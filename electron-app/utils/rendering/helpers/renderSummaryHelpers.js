import { hasPowerData } from "../../data/processing/estimateCyclingPower.js";
import { patchSummaryFields } from "../../data/processing/patchSummaryFields.js";
import { exportUtils } from "../../files/export/exportUtils.js";

/**
 * Generic dictionary record
 *
 * @typedef {Record<string, any>} GenericRecord
 */

/**
 * @typedef {Object} FitSummaryData
 *
 * @property {string} [cachedFilePath]
 * @property {GenericRecord[]} [lapMesgs]
 * @property {GenericRecord[]} [sessionMesgs]
 * @property {GenericRecord[]} [recordMesgs]
 */

/**
 * @typedef {Object} SummaryStats
 *
 * @property {number} [total_records]
 * @property {any} [start_time]
 * @property {any} [end_time]
 * @property {number} [duration]
 * @property {number} [total_distance]
 * @property {number} [avg_speed]
 * @property {number} [max_speed]
 * @property {number} [min_altitude_ft]
 * @property {number} [max_altitude_ft]
 * @property {number | string} [total_ascent]
 * @property {number | string} [total_descent]
 * @property {string} [total_ascent_ft]
 * @property {string} [total_descent_ft]
 * @property {any} [startTime]
 */

/**
 * Column selection localStorage key prefix constant
 *
 * @type {string}
 */
// (legacy prefix documented for clarity)
// Const SUMMARY_COL_KEY_PREFIX = "summaryColSel_"; // not directly used; retained in comment

/**
 * Augment window types (runtime only, JSDoc helps TS inference)
 *
 * @typedef {Window & {
 *     globalData?: any;
 *     activeFitFileName?: string;
 *     aq?: any;
 * }} AugmentedWindow
 */

export const LABEL_COL = "__row_label__";

const SUMMARY_VIRTUAL_ROW_THRESHOLD = 200;
const SUMMARY_VIRTUAL_ROW_HEIGHT_FALLBACK = 34;
const SUMMARY_VIRTUAL_OVERSCAN = 8;

/**
 * Determine whether a Summary column key is a "numbered column" (e.g. "0", "1",
 * "2").
 *
 * Important: this classifies by key name (not by the value type).
 *
 * @param {string} key
 *
 * @returns {boolean}
 */
export function isNumberedSummaryColumnKey(key) {
    return /^\d+$/u.test(key);
}

/**
 * Always order named columns before numbered-only columns while keeping
 * relative order stable.
 *
 * @param {string[]} keys
 *
 * @returns {string[]}
 */
export function orderSummaryColumnsNamedFirst(keys) {
    /** @type {string[]} */
    const named = [];
    /** @type {string[]} */
    const numbered = [];

    for (const k of keys) {
        (isNumberedSummaryColumnKey(k) ? numbered : named).push(k);
    }

    return [...named, ...numbered];
}

/**
 * Global default key for summary column preferences.
 *
 * If a per-file key has no saved preferences, we fall back to this key. This
 * enables a "remember my columns" experience across all files.
 */
export const SUMMARY_COL_GLOBAL_DEFAULT_KEY = "summaryColSel_global_default";

/**
 * @returns {string}
 */
export function getGlobalStorageKey() {
    return SUMMARY_COL_GLOBAL_DEFAULT_KEY;
}

/**
 * Return the label for a given row index.
 *
 * @param {number} rowIdx
 * @param {boolean} isLap
 *
 * @returns {string}
 */
export function getRowLabel(rowIdx, isLap) {
    return isLap ? `Lap ${rowIdx + 1}` : "Summary";
}

/**
 * Build a stable storage key for column visibility preferences for a given file
 * path. Accepts an unused second parameter to remain backwards compatible with
 * older callers passing (data, allKeys).
 *
 * @param {FitSummaryData | GenericRecord | null | undefined} data
 * @param {string[] | undefined} [_allKeys] - Ignored (legacy compatibility)
 *
 * @returns {string}
 */
export function getStorageKey(data, _allKeys) {
    let fpath = "";
    try {
        const w = /** @type {AugmentedWindow} */ (globalThis);
        if (globalThis.window !== undefined && w?.globalData?.cachedFilePath) {
            fpath = w.globalData.cachedFilePath;
        } else if (
            data &&
            typeof data === "object" &&
            /** @type {any} */ (data)?.cachedFilePath
        ) {
            fpath = /** @type {any} */ (data).cachedFilePath;
        } else if (globalThis.window !== undefined && w?.activeFitFileName) {
            fpath = w.activeFitFileName;
        }
    } catch {
        // Ignore
    }
    if (fpath) {
        return `summaryColSel_${encodeURIComponent(String(fpath))}`;
    }
    return "summaryColSel_default";
}

/**
 * Load persisted visible column preferences. Accepts unused second parameter
 * allKeys for legacy compatibility (old signature loadColPrefs(key, allKeys)).
 *
 * @param {string} key
 * @param {string[] | undefined} [_allKeys]
 *
 * @returns {string[] | null}
 */
export function loadColPrefs(key, _allKeys) {
    try {
        const v = localStorage.getItem(key);
        if (v) {
            const arr = JSON.parse(v);
            if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
                return /** @type {string[]} */ (arr);
            }
        }
    } catch {
        /* Intentionally ignore errors */
    }
    return null;
}

/**
 * Render the summary / laps table into the provided container.
 *
 * @param {{
 *     container: HTMLElement;
 *     data: FitSummaryData;
 *     visibleColumns: string[];
 *     setVisibleColumns: (cols: string[]) => void;
 *     gearBtn: HTMLElement;
 * }} params
 *
 * @returns {void}
 */
export function renderTable({
    container,
    data,
    gearBtn,
    setVisibleColumns,
    visibleColumns,
}) {
    // Clean up any prior virtual scroll listeners from earlier renders.
    const cleanupVirtualizer =
        /** @type {{ _summaryVirtualCleanup?: (() => void) }} */ (container)
            ._summaryVirtualCleanup;
    if (typeof cleanupVirtualizer === "function") {
        cleanupVirtualizer();
        /** @type {{ _summaryVirtualCleanup?: (() => void) }} */ (container)
            ._summaryVirtualCleanup = undefined;
    }

    /** @type {HTMLElement | null} */
    let section = container.querySelector(".summary-section");
    if (!section) {
        section = document.createElement("div");
        section.classList.add("summary-section");
        container.append(section);
    }
    section.innerHTML = "";
    // Filter bar with gear button and filter dropdown side by side
    const filterBar = document.createElement("div");
    filterBar.className = "summary-filter-bar";
    // Gear button (column selector)
    filterBar.append(gearBtn);
    // Filter dropdown
    const filterLabel = document.createElement("label");
    filterLabel.textContent = "Show: ";
    const filterSelect = document.createElement("select");

    /**
     * @param {string} value
     * @param {string} label
     */
    const addOption = (value, label) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        filterSelect.append(opt);
    };

    addOption("All", "All");
    addOption("Summary", "Summary");

    if (data.lapMesgs && data.lapMesgs.length > 0) {
        for (let i = 0; i < data.lapMesgs.length; ++i) {
            const lapIndex = i + 1;
            addOption(`Lap ${lapIndex}`, `Lap ${lapIndex}`);
        }
    }
    // --- Persist filter value on container ---
    // @ts-ignore - augmenting DOM element with cached filter value
    const filterValue =
        /** @type {any} */ (container)._summaryFilterValue || "All";
    filterSelect.value = filterValue;
    filterSelect.addEventListener("change", () => {
        // @ts-ignore
        container._summaryFilterValue = filterSelect.value;
        renderTable({
            container,
            data,
            gearBtn,
            setVisibleColumns,
            visibleColumns,
        });
    });
    // Add scroll wheel support for changing selection
    filterSelect.addEventListener(
        "wheel",
        (e) => {
            e.preventDefault();
            const options = [...filterSelect.options];
            let idx = options.findIndex(
                (opt) => opt.value === filterSelect.value
            );
            if (e.deltaY > 0 && idx < options.length - 1) {
                idx++;
            } else if (e.deltaY < 0 && idx > 0) {
                idx--;
            }
            const opt = options[idx];
            if (opt) {
                filterSelect.value = opt.value;
                // @ts-ignore
                container._summaryFilterValue = filterSelect.value;
                renderTable({
                    container,
                    data,
                    gearBtn,
                    setVisibleColumns,
                    visibleColumns,
                });
            }
        },
        { passive: false }
    );
    filterLabel.append(filterSelect);
    filterBar.append(filterLabel);
    section.append(filterBar);

    const headerBar = document.createElement("div");
    headerBar.className = "header-bar";
    const title = document.createElement("h3");
    title.textContent = "Activity Summary";
    title.classList.add("summary-title");
    headerBar.append(title);
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy as CSV";
    copyBtn.className = "copy-btn";
    copyBtn.addEventListener("click", () => {
        try {
            /** @type {string[]} */
            const rows = [],
                orderedVisible = orderSummaryColumnsNamedFirst(visibleColumns),
                sortedVisible = [LABEL_COL, ...orderedVisible];
            rows.push(
                sortedVisible
                    .map((k) => (k === LABEL_COL ? "Type" : k))
                    .join(",")
            );
            // Summary row
            if (filterValue === "All" || filterValue === "Summary") {
                const summaryRows = getSummaryRows(data),
                    summary =
                        summaryRows && summaryRows[0] ? summaryRows[0] : {};
                rows.push(
                    sortedVisible
                        .map((k) =>
                            k === LABEL_COL
                                ? "Summary"
                                : summary && summary[k] !== undefined
                                  ? summary[k]
                                  : ""
                        )
                        .join(",")
                );
            }
            // Lap rows
            if (
                data.lapMesgs &&
                data.lapMesgs.length > 0 &&
                (filterValue === "All" || filterValue.startsWith("Lap"))
            ) {
                const patchedLaps = data.lapMesgs.map((lap) => {
                    const patched = { ...lap };
                    patchSummaryFields(patched);
                    return patched;
                });
                for (const [i, lap] of patchedLaps.entries()) {
                    if (
                        filterValue === "All" ||
                        filterValue === `Lap ${i + 1}`
                    ) {
                        rows.push(
                            sortedVisible
                                .map((k) =>
                                    k === LABEL_COL
                                        ? `Lap ${i + 1}`
                                        : lap[k] === undefined
                                          ? ""
                                          : lap[k]
                                )
                                .join(",")
                        );
                    }
                }
            }
            const csvText = rows.join("\n");
            // Prefer the Electron clipboard bridge to avoid permission denials in file:// contexts.
            Promise.resolve(exportUtils.copyTextToClipboard(csvText)).catch(
                (error) => {
                    console.warn(
                        "[renderSummary] Failed to copy summary CSV:",
                        error
                    );
                }
            );
        } catch {
            /* Ignore copy errors */
        }
    });
    headerBar.append(copyBtn);
    section.append(headerBar);

    const table = document.createElement("table");
    table.classList.add("display");
    const headerRow = document.createElement("tr"),
        orderedVisible = orderSummaryColumnsNamedFirst(visibleColumns),
        sortedVisible = [LABEL_COL, ...orderedVisible],
        thead = document.createElement("thead");
    /** @type {(() => void) | null} */
    let virtualizerInit = null;
    for (const key of sortedVisible) {
        const th = document.createElement("th");
        th.textContent = key === LABEL_COL ? "Type" : key;
        headerRow.append(th);
    }
    thead.append(headerRow);
    const summaryBody = document.createElement("tbody");
    summaryBody.className = "summary-summary-body";
    const lapBody = document.createElement("tbody");
    lapBody.className = "summary-lap-body";
    // Summary row
    if (filterValue === "All" || filterValue === "Summary") {
        const summaryRows = getSummaryRows(data),
            summaryRec = summaryRows[0] || {},
            summaryRow = document.createElement("tr");
        for (const [idx, key] of sortedVisible.entries()) {
            const td = document.createElement("td");
            td.textContent =
                key === LABEL_COL
                    ? "Summary"
                    : summaryRec[key] === undefined
                      ? ""
                      : summaryRec[key];
            if (idx === 0) {
                td.classList.add("summary-row");
            }
            summaryRow.append(td);
        }
        summaryBody.append(summaryRow);
    }
    // Lap rows
    if (
        data.lapMesgs &&
        data.lapMesgs.length > 0 &&
        (filterValue === "All" || filterValue.startsWith("Lap"))
    ) {
        const {lapMesgs} = data;
        const lapCache = new Map();
        const lapFilterIndexRaw = filterValue.startsWith("Lap")
            ? Number.parseInt(filterValue.replace("Lap ", ""), 10)
            : Number.NaN;
        const lapFilterIndex = Number.isFinite(lapFilterIndexRaw)
            ? lapFilterIndexRaw - 1
            : null;
        const shouldVirtualize =
            filterValue === "All" &&
            lapMesgs.length > SUMMARY_VIRTUAL_ROW_THRESHOLD;

        if (shouldVirtualize) {
            virtualizerInit = () => {
                const cleanup = setupVirtualizedLapRows({
                    lapBody,
                    lapCache,
                    lapMesgs,
                    scrollContainer: container,
                    sortedVisible,
                });
                /** @type {{ _summaryVirtualCleanup?: (() => void) }} */ (
                    container
                )._summaryVirtualCleanup = cleanup;
            };
        } else if (lapFilterIndex !== null) {
            if (lapFilterIndex >= 0 && lapFilterIndex < lapMesgs.length) {
                const lap = getPatchedLapRow(
                    lapMesgs,
                    lapFilterIndex,
                    lapCache
                );
                lapBody.append(
                    createLapRowElement(lapFilterIndex, lap, sortedVisible)
                );
            }
        } else {
            for (let i = 0; i < lapMesgs.length; i += 1) {
                const lap = getPatchedLapRow(lapMesgs, i, lapCache);
                lapBody.append(createLapRowElement(i, lap, sortedVisible));
            }
        }
    }
    table.append(thead);
    table.append(summaryBody);
    if (lapBody.childElementCount > 0 || virtualizerInit) {
        table.append(lapBody);
    }
    section.append(table);

    if (typeof virtualizerInit === "function") {
        const raf = globalThis.requestAnimationFrame;
        if (typeof raf === "function") {
            raf(() => virtualizerInit && virtualizerInit());
        } else {
            virtualizerInit();
        }
    }
}

/**
 * Return a patched lap row, caching the transformed entry.
 *
 * @param {GenericRecord[]} lapMesgs
 * @param {number} idx
 * @param {Map<number, GenericRecord>} cache
 *
 * @returns {GenericRecord}
 */
function getPatchedLapRow(lapMesgs, idx, cache) {
    const cached = cache.get(idx);
    if (cached) {
        return cached;
    }
    const raw = lapMesgs[idx] || {};
    const patched = { ...raw };
    patchSummaryFields(patched);
    cache.set(idx, patched);
    return patched;
}

/**
 * Create a lap row element for the summary table.
 *
 * @param {number} lapIndex
 * @param {GenericRecord} lap
 * @param {string[]} sortedVisible
 *
 * @returns {HTMLTableRowElement}
 */
function createLapRowElement(lapIndex, lap, sortedVisible) {
    const lapRow = document.createElement("tr");
    for (const key of sortedVisible) {
        const td = document.createElement("td");
        if (key === LABEL_COL) {
            td.textContent = `Lap ${lapIndex + 1}`;
        } else if (key === "timestamp" && lap.startTime) {
            td.textContent = lap.startTime;
        } else {
            td.textContent = lap[key] === undefined ? "" : String(lap[key]);
        }
        lapRow.append(td);
    }
    return lapRow;
}

/**
 * Create a spacer row used to represent off-screen rows in a virtualized tbody.
 *
 * @param {number} colSpan
 *
 * @returns {{ row: HTMLTableRowElement; cell: HTMLTableCellElement }}
 */
function createSpacerRow(colSpan) {
    const row = document.createElement("tr");
    row.className = "summary-virtual-spacer";
    const cell = document.createElement("td");
    cell.colSpan = colSpan;
    cell.style.padding = "0";
    cell.style.border = "none";
    cell.style.height = "0px";
    cell.style.lineHeight = "0";
    row.append(cell);
    return { row, cell };
}

/**
 * Initialize a virtualized lap tbody to keep DOM size small for large files.
 *
 * @param {{
 *     lapBody: HTMLTableSectionElement;
 *     lapCache: Map<number, GenericRecord>;
 *     lapMesgs: GenericRecord[];
 *     scrollContainer: HTMLElement;
 *     sortedVisible: string[];
 * }} params
 *
 * @returns {() => void} Cleanup callback to remove listeners.
 */
function setupVirtualizedLapRows({
    lapBody,
    lapCache,
    lapMesgs,
    scrollContainer,
    sortedVisible,
}) {
    const lapCount = lapMesgs.length;
    const colSpan = sortedVisible.length;
    const { row: topSpacer, cell: topCell } = createSpacerRow(colSpan);
    const { row: bottomSpacer, cell: bottomCell } = createSpacerRow(colSpan);
    let rowHeight = SUMMARY_VIRTUAL_ROW_HEIGHT_FALLBACK;
    let lastStart = -1;
    let lastEnd = -1;
    let rafHandle = 0;

    const measureRow = createLapRowElement(
        0,
        getPatchedLapRow(lapMesgs, 0, lapCache),
        sortedVisible
    );
    measureRow.style.visibility = "hidden";
    lapBody.append(measureRow);
    rowHeight = Math.max(
        SUMMARY_VIRTUAL_ROW_HEIGHT_FALLBACK,
        Math.round(measureRow.getBoundingClientRect().height)
    );
    measureRow.remove();

    /**
     * @param {number} start
     * @param {number} end
     */
    const renderWindow = (start, end) => {
        if (start === lastStart && end === lastEnd) {
            return;
        }
        lastStart = start;
        lastEnd = end;

        const fragment = document.createDocumentFragment();
        topCell.style.height = `${start * rowHeight}px`;
        bottomCell.style.height = `${(lapCount - end) * rowHeight}px`;
        fragment.append(topSpacer);

        for (let i = start; i < end; i += 1) {
            const lap = getPatchedLapRow(lapMesgs, i, lapCache);
            fragment.append(createLapRowElement(i, lap, sortedVisible));
        }

        fragment.append(bottomSpacer);
        lapBody.replaceChildren(fragment);
    };

    const updateVirtualRows = () => {
        if (lapCount === 0) {
            return;
        }
        const containerRect = scrollContainer.getBoundingClientRect();
        const bodyRect = lapBody.getBoundingClientRect();
        const {scrollTop} = scrollContainer;
        const viewportHeight = scrollContainer.clientHeight;
        const bodyTop = bodyRect.top - containerRect.top + scrollTop;
        const relativeScroll = Math.max(0, scrollTop - bodyTop);

        const start = Math.max(
            0,
            Math.floor(relativeScroll / rowHeight) - SUMMARY_VIRTUAL_OVERSCAN
        );
        const end = Math.min(
            lapCount,
            Math.ceil((relativeScroll + viewportHeight) / rowHeight) +
                SUMMARY_VIRTUAL_OVERSCAN
        );
        renderWindow(start, end);
    };

    const scheduleUpdate = () => {
        if (rafHandle) {
            return;
        }
        rafHandle = globalThis.requestAnimationFrame(() => {
            rafHandle = 0;
            updateVirtualRows();
        });
    };

    const onScroll = () => scheduleUpdate();
    const onResize = () => updateVirtualRows();

    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    globalThis.addEventListener("resize", onResize);

    updateVirtualRows();

    return () => {
        scrollContainer.removeEventListener("scroll", onScroll);
        globalThis.removeEventListener("resize", onResize);
        if (rafHandle) {
            globalThis.cancelAnimationFrame(rafHandle);
            rafHandle = 0;
        }
    };
}

/**
 * Persist visible column preferences. Accepts an unused third parameter
 * (allKeys) for legacy call compatibility.
 *
 * @param {string} key
 * @param {string[]} visibleColumns
 * @param {string[] | undefined} [_allKeys]
 *
 * @returns {void}
 */
export function saveColPrefs(key, visibleColumns, _allKeys) {
    try {
        localStorage.setItem(key, JSON.stringify(visibleColumns));
    } catch {
        /* Intentionally ignore errors */
    }
}

/**
 * Show modal dialog to pick visible summary columns.
 *
 * @param {{
 *     allKeys: string[];
 *     data?: FitSummaryData;
 *     visibleColumns: string[];
 *     setVisibleColumns: (cols: string[]) => void;
 *     renderTable: () => void;
 * }} params
 *
 * @returns {void}
 */
export function showColModal({
    allKeys,
    data,
    renderTable: reRenderTable,
    setVisibleColumns,
    visibleColumns: initialVisibleColumns,
}) {
    // Remove any existing modal
    const old = document.querySelector(".summary-col-modal-overlay");
    if (old) {
        old.remove();
    }
    const overlay = document.createElement("div");
    overlay.className = "summary-col-modal-overlay";
    const modal = document.createElement("div");
    modal.className = "summary-col-modal";
    const title = document.createElement("h2");
    title.textContent = "Select Summary Columns";
    modal.append(title);

    const prefsKeyForFile = getStorageKey(globalThis.globalData || {}, allKeys);
    const prefsKeyGlobal = getGlobalStorageKey();

    // Determine display order: show named/non-numeric keys first, numeric keys last.
    /**
     * @param {string} key
     *
     * @returns {boolean}
     */
    const isNumericKey = (key) => {
        if (!data || typeof data !== "object") {
            return false;
        }

        /** @type {GenericRecord[]} */
        const sampleRows = [];
        if (Array.isArray(data.sessionMesgs)) {
            sampleRows.push(...data.sessionMesgs.slice(0, 5));
        }
        if (Array.isArray(data.lapMesgs)) {
            sampleRows.push(...data.lapMesgs.slice(0, 10));
        }
        if (Array.isArray(data.recordMesgs)) {
            // recordMesgs can be huge; only sample a few.
            sampleRows.push(...data.recordMesgs.slice(0, 25));
        }

        for (const row of sampleRows) {
            if (!row || typeof row !== "object") {
                continue;
            }
            const v = /** @type {any} */ (row)[key];
            if (v === null || v === undefined) {
                continue;
            }
            return typeof v === "number" && Number.isFinite(v);
        }

        return false;
    };

    /** @type {string[]} */
    const displayKeys = (() => {
        /** @type {string[]} */
        const named = [];
        /** @type {string[]} */
        const numeric = [];
        for (const k of allKeys) {
            (isNumericKey(k) ? numeric : named).push(k);
        }
        return [...named, ...numeric];
    })();
    // Local visibleColumns state
    let visibleColumns = [...initialVisibleColumns];
    /**
     * @param {string[]} cols
     */
    const // Select/Deselect All
        selectAllBtn = document.createElement("button"),
        updateVisibleColumns = (cols) => {
            visibleColumns = [...cols];
            if (typeof setVisibleColumns === "function") {
                setVisibleColumns(visibleColumns);
            }
        };
    selectAllBtn.className = "select-all-btn themed-btn";

    // Default preset actions (apply across files)
    const presetsBar = document.createElement("div");
    presetsBar.className = "modal-actions";

    const defaultBadge = document.createElement("span");
    defaultBadge.className = "summary-col-default-badge";
    defaultBadge.textContent = "Default set";

    /**
     * @returns {boolean}
     */
    const hasGlobalDefault = () => Boolean(loadColPrefs(prefsKeyGlobal));

    /**
     * @param {boolean} visible
     */
    const setDefaultBadgeVisible = (visible) => {
        defaultBadge.style.display = visible ? "inline-flex" : "none";
    };

    setDefaultBadgeVisible(hasGlobalDefault());

    const setDefaultBtn = document.createElement("button");
    setDefaultBtn.className = "themed-btn";
    setDefaultBtn.textContent = "Set as Default";
    setDefaultBtn.title =
        "Use this column selection as the default for all future files";
    setDefaultBtn.addEventListener("click", () => {
        saveColPrefs(prefsKeyGlobal, visibleColumns);
        // Also refresh current file prefs so the current file behaves consistently.
        saveColPrefs(prefsKeyForFile, visibleColumns);
        setDefaultBadgeVisible(true);
        reRenderTable();
    });

    const clearDefaultBtn = document.createElement("button");
    clearDefaultBtn.className = "themed-btn";
    clearDefaultBtn.textContent = "Clear Default";
    clearDefaultBtn.title = "Remove the global default column selection";
    clearDefaultBtn.addEventListener("click", () => {
        try {
            localStorage.removeItem(prefsKeyGlobal);
        } catch {
            /* ignore */
        }
        setDefaultBadgeVisible(false);
        reRenderTable();
    });

    presetsBar.append(setDefaultBtn, clearDefaultBtn, defaultBadge);
    modal.append(presetsBar);
    // Column list (declare before updateColList to avoid no-use-before-define)
    const colList = document.createElement("div");
    colList.className = "col-list";
    modal.append(colList);
    /** @type {number | null} */
    let lastCheckedIndex = null;

    // Handlers factory to avoid declaring functions within the loop (no-loop-func)
    /**
     * Create a mousedown handler for range selection with Shift.
     *
     * @param {number} idx
     * @param {string} key
     */
    function createMouseDownHandler(idx, key) {
        /** @param {MouseEvent} e */
        return (e) => {
            if (e.shiftKey && lastCheckedIndex !== null) {
                e.preventDefault();
                const end = Math.max(lastCheckedIndex, idx);
                const start = Math.min(lastCheckedIndex, idx);
                const shouldCheck = !visibleColumns.includes(key);
                let newCols = [...visibleColumns];
                for (let i = start; i <= end; ++i) {
                    const k = displayKeys[i];
                    if (typeof k !== "string") {
                        continue;
                    }
                    if (shouldCheck && !newCols.includes(k)) {
                        newCols.push(k);
                    }
                    if (!shouldCheck && newCols.includes(k)) {
                        newCols = newCols.filter((x) => x !== k);
                    }
                }
                newCols = allKeys.filter((k) => newCols.includes(k));
                updateVisibleColumns(newCols);
                updateColList();
                reRenderTable();
                saveColPrefs(prefsKeyForFile, newCols);
            }
        };
    }

    /**
     * Create a change handler for single checkbox toggle.
     *
     * @param {number} idx
     * @param {string} key
     * @param {HTMLInputElement} loopCheckbox
     */
    function createChangeHandler(idx, key, loopCheckbox) {
        /** @param {Event & { shiftKey?: boolean }} e */
        return (e) => {
            if (e.shiftKey && lastCheckedIndex !== null) {
                return; // handled in mousedown
            }
            lastCheckedIndex = idx;
            let newCols = [...visibleColumns];
            if (loopCheckbox.checked) {
                if (!newCols.includes(key)) {
                    newCols.push(key);
                }
            } else {
                newCols = newCols.filter((k) => k !== key);
            }
            newCols = allKeys.filter((k) => newCols.includes(k));
            updateVisibleColumns(newCols);
            selectAllBtn.textContent =
                newCols.length === allKeys.length
                    ? "Deselect All"
                    : "Select All";
            updateColList();
            reRenderTable();
            saveColPrefs(prefsKeyForFile, newCols);
        };
    }
    /**
     * Refresh checkbox list based on current visibleColumns
     *
     * @returns {void}
     */
    function updateColList() {
        colList.innerHTML = "";
        // Always show label column as checked and disabled
        const checkbox = document.createElement("input"),
            label = document.createElement("label");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.disabled = true;
        label.append(checkbox);
        label.append(document.createTextNode("Type"));
        colList.append(label);
        for (const [idx, key] of displayKeys.entries()) {
            const loopCheckbox = document.createElement("input"),
                loopLabel = document.createElement("label");
            loopCheckbox.type = "checkbox";
            loopCheckbox.checked = visibleColumns.includes(key);
            loopCheckbox.tabIndex = 0;
            // Use factory-created handlers to avoid declaring functions in the loop
            loopCheckbox.addEventListener(
                "mousedown",
                createMouseDownHandler(idx, key)
            );
            loopCheckbox.addEventListener(
                "change",
                createChangeHandler(idx, key, loopCheckbox)
            );
            loopLabel.append(loopCheckbox);
            loopLabel.append(document.createTextNode(key));
            colList.append(loopLabel);
        }
        selectAllBtn.textContent =
            visibleColumns.length === allKeys.length
                ? "Deselect All"
                : "Select All";
    }
    selectAllBtn.textContent =
        visibleColumns.length === allKeys.length
            ? "Deselect All"
            : "Select All";
    selectAllBtn.addEventListener("click", () => {
        /** @type {string[]} */
        const newCols =
            visibleColumns.length === allKeys.length ? [] : [...allKeys];
        updateVisibleColumns(newCols);
        updateColList();
        reRenderTable();
        saveColPrefs(prefsKeyForFile, newCols);
    });
    modal.append(selectAllBtn);
    updateColList();
    // Actions
    const actions = document.createElement("div");
    actions.className = "modal-actions";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "themed-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => overlay.remove());
    const okBtn = document.createElement("button");
    okBtn.className = "themed-btn";
    okBtn.textContent = "OK";
    okBtn.addEventListener("click", () => {
        overlay.remove();
        reRenderTable();
        saveColPrefs(prefsKeyForFile, visibleColumns);
    });
    actions.append(cancelBtn);
    actions.append(okBtn);
    modal.append(actions);
    overlay.append(modal);
    document.body.append(overlay);
}

/**
 * Compute summary rows (one row either from sessionMesgs or derived from
 * recordMesgs)
 *
 * @param {FitSummaryData} data
 *
 * @returns {GenericRecord[]} Single element array (or [{}])
 */
function getSummaryRows(data) {
    if (data?.sessionMesgs && data.sessionMesgs.length > 0) {
        const raw = { ...data.sessionMesgs[0] };
        patchSummaryFields(raw);

        // If this activity has estimated power (and no real power), surface basic stats.
        // This lets the Summary tab reflect the Estimated Power feature without altering FIT semantics.
        try {
            const recs = Array.isArray(data.recordMesgs)
                ? data.recordMesgs
                : [];
            if (
                recs.length > 0 &&
                !hasPowerData(/** @type {Record<string, unknown>[]} */ (recs))
            ) {
                /** @type {number[]} */
                const values = [];
                for (const r of recs) {
                    const v = Number(/** @type {any} */ (r)?.estimatedPower);
                    if (Number.isFinite(v) && v > 0) {
                        values.push(v);
                    }
                }
                if (values.length > 0) {
                    const total = values.reduce((a, b) => a + b, 0);
                    raw.avg_estimated_power = Math.round(total / values.length);
                    raw.max_estimated_power = Math.round(Math.max(...values));
                }
            }
        } catch {
            /* ignore */
        }
        if (raw.total_ascent != null && !isNaN(raw.total_ascent)) {
            raw.total_ascent_ft = `${(raw.total_ascent * 3.280_84).toFixed(0)} ft`;
        }
        if (raw.total_descent != null && !isNaN(raw.total_descent)) {
            raw.total_descent_ft = `${(raw.total_descent * 3.280_84).toFixed(0)} ft`;
        }
        return [raw];
    }
    if (
        data?.recordMesgs &&
        data.recordMesgs.length > 0 &&
        globalThis.window !== undefined &&
        /** @type {AugmentedWindow} */ (globalThis)?.aq
    ) {
        try {
            const { aq } = /** @type {AugmentedWindow} */ (globalThis),
                table = aq.from(data.recordMesgs),
                /** @type {SummaryStats} */
                stats = {
                    end_time: table.get(table.numRows() - 1, "timestamp"),
                    start_time: table.get(0, "timestamp"),
                    total_records: table.numRows(),
                };
            if (table.columnNames().includes("distance")) {
                stats.total_distance = table.get(
                    table.numRows() - 1,
                    "distance"
                );
            }
            if (table.columnNames().includes("timestamp")) {
                const endTs = new Date(
                        table.get(table.numRows() - 1, "timestamp")
                    ).getTime(),
                    startTs = new Date(table.get(0, "timestamp")).getTime();
                if (Number.isFinite(startTs) && Number.isFinite(endTs)) {
                    const sec = Math.round((endTs - startTs) / 1000);
                    stats.duration = sec;
                }
            }
            if (table.columnNames().includes("speed")) {
                const speeds = table.array("speed");
                if (Array.isArray(speeds) && speeds.length > 0) {
                    const total = speeds.reduce((a, b) => a + b, 0);
                    stats.avg_speed = total / speeds.length;
                    stats.max_speed = Math.max(...speeds);
                }
            }
            if (table.columnNames().includes("altitude")) {
                const alts = table.array("altitude");
                if (Array.isArray(alts) && alts.length > 0) {
                    stats.min_altitude_ft = Math.min(...alts);
                    stats.max_altitude_ft = Math.max(...alts);
                }
            }
            patchSummaryFields(stats);
            return [/** @type {GenericRecord} */ (stats)];
        } catch {
            // Ignore stats errors
        }
    }
    return [{}];
}
