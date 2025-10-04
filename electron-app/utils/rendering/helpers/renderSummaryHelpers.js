import { patchSummaryFields } from "../../data/processing/patchSummaryFields.js";
import { createDensityToggle, getDensityPreference } from "../../ui/controls/createDensityToggle.js";
import {
    createIconElement,
    getHumanizedLabel,
    getSummaryEmoji,
    getSummaryIcon,
} from "../../ui/icons/iconMappings.js";

/**
 * Generic dictionary record
 * @typedef {Record<string, any>} GenericRecord
 */

/**
 * @typedef {Object} FitSummaryData
 * @property {string} [cachedFilePath]
 * @property {GenericRecord[]} [lapMesgs]
 * @property {GenericRecord[]} [sessionMesgs]
 * @property {GenericRecord[]} [recordMesgs]
 */

/**
 * @typedef {Object} SummaryStats
 * @property {number} [total_records]
 * @property {any} [start_time]
 * @property {any} [end_time]
 * @property {number} [duration]
 * @property {number} [total_distance]
 * @property {number} [avg_speed]
 * @property {number} [max_speed]
 * @property {number} [min_altitude_ft]
 * @property {number} [max_altitude_ft]
 * @property {number|string} [total_ascent]
 * @property {number|string} [total_descent]
 * @property {string} [total_ascent_ft]
 * @property {string} [total_descent_ft]
 * @property {any} [startTime]
 */

/**
 * Augment window types (runtime only, JSDoc helps TS inference)
 * @typedef {Window & { globalData?: any; activeFitFileName?: string; aq?: any }} AugmentedWindow
 */

export const LABEL_COL = "__row_label__";

/**
 * Return the label for a given row index.
 * @param {number} rowIdx
 * @param {boolean} isLap
 * @returns {string}
 */
export function getRowLabel(rowIdx, isLap) {
    return isLap ? `Lap ${rowIdx + 1}` : "Summary";
}

/**
 * Build a stable storage key for column visibility preferences for a given file path.
 * @param {FitSummaryData|GenericRecord|null|undefined} data
 * @returns {string}
 */
export function getStorageKey(data) {
    let fpath = "";
    try {
        const w = /** @type {AugmentedWindow} */ (globalThis);
        if (globalThis.window !== undefined && w?.globalData?.cachedFilePath) {
            fpath = w.globalData.cachedFilePath;
        } else if (data && typeof data === "object" && /** @type {any} */ (data)?.cachedFilePath) {
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
 * Load persisted visible column preferences.
 * @param {string} key
 * @returns {string[]|null}
 */
export function loadColPrefs(key) {
    try {
        const v = localStorage.getItem(key);
        if (v) {
            const arr = JSON.parse(v);
            if (Array.isArray(arr) && arr.length > 0 && arr.every((x) => typeof x === "string")) {
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
 * @param {{
 *  container: HTMLElement,
 *  data: FitSummaryData,
 *  visibleColumns: string[],
 *  setVisibleColumns: (cols: string[]) => void,
 *  gearBtn: HTMLElement
 * }} params
 * @returns {void}
 */
export function renderTable({ container, data, gearBtn, setVisibleColumns, visibleColumns }) {
    /** @type {HTMLElement|null} */
    let section = container.querySelector(".summary-section");
    if (!section) {
        section = document.createElement("div");
        section.classList.add("summary-section", "summary-surface");
        section.setAttribute("role", "region");
        section.setAttribute("aria-label", "Activity summary data");
        container.append(section);
    }
    section.innerHTML = "";

    // Apply saved density preference
    const densityPref = getDensityPreference("summaryTableDensity", "spacious");
    section.classList.remove("density-spacious", "density-dense");
    section.classList.add(`density-${densityPref}`);

    // Filter bar with gear button, density toggle, and filter dropdown
    const filterBar = document.createElement("div");
    filterBar.classList.add("summary-filter-bar");

    const filterBarLeft = document.createElement("div");
    filterBarLeft.classList.add("summary-filter-left");
    filterBarLeft.append(gearBtn);

    // Density toggle with label
    const densityToggle = createDensityToggle({
        onChange: (density) => {
            section?.classList.remove("density-spacious", "density-dense");
            section?.classList.add(`density-${density}`);
        },
        showLabel: true,
        storageKey: "summaryTableDensity",
    });
    densityToggle.classList.add("summary-density-toggle");
    filterBarLeft.append(densityToggle);

    const filterControls = document.createElement("div");
    filterControls.classList.add("summary-filter-controls");

    const filterSelect = document.createElement("select");
    filterSelect.classList.add("summary-filter-select");
    const filterSelectId = "summary-filter-select";
    filterSelect.id = filterSelectId;
    filterSelect.setAttribute("aria-label", "Filter summary rows");
    filterSelect.innerHTML = '<option value="All">All</option><option value="Summary">Summary</option>';
    if (data.lapMesgs && data.lapMesgs.length > 0) {
        for (let i = 0; i < data.lapMesgs.length; ++i) {
            filterSelect.innerHTML += `<option value="Lap ${i + 1}">Lap ${i + 1}</option>`;
        }
    }
    // --- Persist filter value on container ---
    // @ts-ignore - augmenting DOM element with cached filter value
    const filterValue = /** @type {any} */ (container)._summaryFilterValue || "All";
    filterSelect.value = filterValue;
    filterSelect.addEventListener("change", () => {
        // @ts-ignore
        container._summaryFilterValue = filterSelect.value;
        renderTable({ container, data, gearBtn, setVisibleColumns, visibleColumns });
    });
    // Add scroll wheel support for changing selection
    filterSelect.addEventListener(
        "wheel",
        (e) => {
            e.preventDefault();
            const options = [...filterSelect.options];
            let idx = options.findIndex((opt) => opt.value === filterSelect.value);
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
                renderTable({ container, data, gearBtn, setVisibleColumns, visibleColumns });
            }
        },
        { passive: false }
    );
    const filterLabel = document.createElement("label");
    filterLabel.classList.add("summary-filter-label");
    filterLabel.setAttribute("for", filterSelectId);
    const filterLabelIcon = createIconElement("mdi:filter-variant", 18);
    filterLabelIcon.classList.add("summary-filter-icon");
    const filterLabelText = document.createElement("span");
    filterLabelText.classList.add("summary-filter-text");
    filterLabelText.textContent = "Show";
    filterLabel.append(filterLabelIcon);
    filterLabel.append(filterLabelText);
    filterControls.append(filterLabel);
    filterControls.append(filterSelect);

    filterBar.append(filterBarLeft);
    filterBar.append(filterControls);
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
                sortedVisible = [LABEL_COL, ...visibleColumns];
            rows.push(sortedVisible.map((k) => (k === LABEL_COL ? "Type" : k)).join(","));
            // Summary row
            if (filterValue === "All" || filterValue === "Summary") {
                const summaryRows = getSummaryRows(data),
                    summary = summaryRows && summaryRows[0] ? summaryRows[0] : {};
                rows.push(
                    sortedVisible
                        .map((k) =>
                            k === LABEL_COL ? "Summary" : summary && summary[k] !== undefined ? summary[k] : ""
                        )
                        .join(",")
                );
            }
            // Lap rows
            if (data.lapMesgs && data.lapMesgs.length > 0 && (filterValue === "All" || filterValue.startsWith("Lap"))) {
                const patchedLaps = data.lapMesgs.map((lap) => {
                    const patched = { ...lap };
                    patchSummaryFields(patched);
                    return patched;
                });
                for (const [i, lap] of patchedLaps.entries()) {
                    if (filterValue === "All" || filterValue === `Lap ${i + 1}`) {
                        rows.push(
                            sortedVisible
                                .map((k) => (k === LABEL_COL ? `Lap ${i + 1}` : lap[k] === undefined ? "" : lap[k]))
                                .join(",")
                        );
                    }
                }
            }
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(rows.join("\n"));
            }
        } catch {
            /* Ignore copy errors */
        }
    });
    headerBar.append(copyBtn);
    section.append(headerBar);

    const table = document.createElement("table");
    table.classList.add("display");
    const headerRow = document.createElement("tr"),
        sortedVisible = [LABEL_COL, ...visibleColumns],
        tbody = document.createElement("tbody"),
        thead = document.createElement("thead");
    for (const key of sortedVisible) {
        const th = document.createElement("th");
        const headerContent = document.createElement("div");
        headerContent.classList.add("summary-header-cell");

        if (key === LABEL_COL) {
            const typeIcon = createIconElement("mdi:view-list-outline", 18);
            typeIcon.classList.add("summary-header-icon");
            headerContent.append(typeIcon);
            const typeLabel = document.createElement("span");
            typeLabel.classList.add("summary-header-label");
            typeLabel.textContent = "Type";
            headerContent.append(typeLabel);
        } else {
            const iconName = getSummaryIcon(key);
            if (iconName) {
                const icon = createIconElement(iconName, 18);
                icon.classList.add("summary-header-icon");
                headerContent.append(icon);
            }
            const label = document.createElement("span");
            label.classList.add("summary-header-label");
            const metricLabel = getHumanizedLabel(key) || key;
            const emoji = getSummaryEmoji(key);
            label.textContent = emoji ? `${emoji} ${metricLabel}` : metricLabel;
            headerContent.append(label);
        }

        th.append(headerContent);
        headerRow.append(th);
    }
    thead.append(headerRow);
    // Summary row
    if (filterValue === "All" || filterValue === "Summary") {
        const summaryRows = getSummaryRows(data),
            summaryRec = summaryRows[0] || {},
            summaryRow = document.createElement("tr");
        for (const [idx, key] of sortedVisible.entries()) {
            const td = document.createElement("td");
            td.textContent = key === LABEL_COL ? "Summary" : summaryRec[key] === undefined ? "" : summaryRec[key];
            if (idx === 0) {
                td.classList.add("summary-row");
            }
            summaryRow.append(td);
        }
        tbody.append(summaryRow);
    }
    // Lap rows
    if (data.lapMesgs && data.lapMesgs.length > 0 && (filterValue === "All" || filterValue.startsWith("Lap"))) {
        const patchedLaps = data.lapMesgs.map((lap) => {
            const patched = { ...lap };
            patchSummaryFields(patched);
            return patched;
        });
        for (const [i, lap] of patchedLaps.entries()) {
            if (filterValue === "All" || filterValue === `Lap ${i + 1}`) {
                const lapRow = document.createElement("tr");
                for (const key of sortedVisible) {
                    const td = document.createElement("td");
                    if (key === LABEL_COL) {
                        td.textContent = `Lap ${i + 1}`;
                    } else if (key === "timestamp" && lap.startTime) {
                        td.textContent = lap.startTime; // Bracket access for index signature
                    } else {
                        td.textContent = lap[key] === undefined ? "" : lap[key];
                    }
                    lapRow.append(td);
                }
                tbody.append(lapRow);
            }
        }
    }
    table.append(thead);
    table.append(tbody);
    section.append(table);
}

/**
 * Persist visible column preferences.
 * Accepts an unused third parameter (allKeys) for legacy call compatibility.
 * @param {string} key
 * @param {string[]} visibleColumns
 * @param {string[]|undefined} [_allKeys]
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
 * @param {{
 *  allKeys: string[],
 *  visibleColumns: string[],
 *  setVisibleColumns: (cols: string[]) => void,
 *  renderTable: () => void
 * }} params
 * @returns {void}
 */
export function showColModal({
    allKeys,
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
    // Column list (declare before updateColList to avoid no-use-before-define)
    const colList = document.createElement("div");
    colList.className = "col-list";
    modal.append(colList);
    /** @type {number|null} */
    let lastCheckedIndex = null;

    // Handlers factory to avoid declaring functions within the loop (no-loop-func)
    /**
     * Create a mousedown handler for range selection with Shift.
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
                    const k = allKeys[i];
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
                saveColPrefs(getStorageKey(globalThis.globalData || {}), newCols);
            }
        };
    }

    /**
     * Create a change handler for single checkbox toggle.
     * @param {number} idx
     * @param {string} key
     * @param {HTMLInputElement} loopCheckbox
     */
    function createChangeHandler(idx, key, loopCheckbox) {
        /** @param {Event & { shiftKey?: boolean}} e */
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
            selectAllBtn.textContent = newCols.length === allKeys.length ? "Deselect All" : "Select All";
            updateColList();
            reRenderTable();
            saveColPrefs(getStorageKey(globalThis.globalData || {}), newCols);
        };
    }
    /**
     * Refresh checkbox list based on current visibleColumns
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
        for (const [idx, key] of allKeys.entries()) {
            const loopCheckbox = document.createElement("input"),
                loopLabel = document.createElement("label");
            loopCheckbox.type = "checkbox";
            loopCheckbox.checked = visibleColumns.includes(key);
            loopCheckbox.tabIndex = 0;
            // Use factory-created handlers to avoid declaring functions in the loop
            loopCheckbox.addEventListener("mousedown", createMouseDownHandler(idx, key));
            loopCheckbox.addEventListener("change", createChangeHandler(idx, key, loopCheckbox));
            loopLabel.append(loopCheckbox);
            loopLabel.append(document.createTextNode(key));
            colList.append(loopLabel);
        }
        selectAllBtn.textContent = visibleColumns.length === allKeys.length ? "Deselect All" : "Select All";
    }
    selectAllBtn.textContent = visibleColumns.length === allKeys.length ? "Deselect All" : "Select All";
    selectAllBtn.addEventListener("click", () => {
        /** @type {string[]} */
        const newCols = visibleColumns.length === allKeys.length ? [] : [...allKeys];
        updateVisibleColumns(newCols);
        updateColList();
        reRenderTable();
        saveColPrefs(getStorageKey(globalThis.globalData || {}), newCols);
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
        saveColPrefs(getStorageKey(globalThis.globalData || {}), visibleColumns);
    });
    actions.append(cancelBtn);
    actions.append(okBtn);
    modal.append(actions);
    overlay.append(modal);
    document.body.append(overlay);
}

/**
 * Compute summary rows (one row either from sessionMesgs or derived from recordMesgs)
 * @param {FitSummaryData} data
 * @returns {GenericRecord[]} single element array (or [{}])
 */
function getSummaryRows(data) {
    if (data?.sessionMesgs && data.sessionMesgs.length > 0) {
        const raw = { ...data.sessionMesgs[0] };
        patchSummaryFields(raw);
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
                stats.total_distance = table.get(table.numRows() - 1, "distance");
            }
            if (table.columnNames().includes("timestamp")) {
                const endTs = new Date(table.get(table.numRows() - 1, "timestamp")).getTime(),
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
