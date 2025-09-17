import { patchSummaryFields } from "../../data/processing/patchSummaryFields.js";

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
 * Column selection localStorage key prefix constant
 * @type {string}
 */
// (legacy prefix documented for clarity)
// Const SUMMARY_COL_KEY_PREFIX = "summaryColSel_"; // not directly used; retained in comment

/**
 * Augment window types (runtime only, JSDoc helps TS inference)
 * @typedef {Window & { globalData?: any; activeFitFileName?: string; aq?: any }} AugmentedWindow
 */

export const LABEL_COL = "__row_label__";

/**
 * Build a stable storage key for column visibility preferences for a given file path.
 * Accepts an unused second parameter to remain backwards compatible with older callers
 * passing (data, allKeys).
 * @param {FitSummaryData|GenericRecord|null|undefined} data
 * @param {string[]|undefined} [_allKeys] - Ignored (legacy compatibility)
 * @returns {string}
 */
export function getStorageKey(data, _allKeys) {
    let fpath = "";
    try {
        const w = /** @type {AugmentedWindow} */ (window);
        if (typeof window !== "undefined" && w?.globalData?.cachedFilePath) {
            fpath = w.globalData.cachedFilePath;
        } else if (data && typeof data === "object" && /** @type {any} */ (data)?.cachedFilePath) {
            fpath = /** @type {any} */ (data).cachedFilePath;
        } else if (typeof window !== "undefined" && w?.activeFitFileName) {
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
 * Load persisted visible column preferences.
 * Accepts unused second parameter allKeys for legacy compatibility (old signature loadColPrefs(key, allKeys)).
 * @param {string} key
 * @param {string[]|undefined} [_allKeys]
 * @returns {string[]|null}
 */
export function loadColPrefs(key, _allKeys) {
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
 * Return the label for a given row index.
 * @param {number} rowIdx
 * @param {boolean} isLap
 * @returns {string}
 */
export function getRowLabel(rowIdx, isLap) {
    return isLap ? `Lap ${rowIdx + 1}` : "Summary";
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
export function renderTable({ container, data, visibleColumns, setVisibleColumns, gearBtn }) {
    /** @type {HTMLElement|null} */
    let section = container.querySelector(".summary-section");
    if (!section) {
        section = document.createElement("div");
        section.classList.add("summary-section");
        container.appendChild(section);
    }
    section.innerHTML = "";
    // Filter bar with gear button and filter dropdown side by side
    const filterBar = document.createElement("div");
    filterBar.className = "summary-filter-bar";
    // Gear button (column selector)
    filterBar.appendChild(gearBtn);
    // Filter dropdown
    const filterLabel = document.createElement("label");
    filterLabel.textContent = "Show: ";
    const filterSelect = document.createElement("select");
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
    filterSelect.onchange = () => {
        // @ts-ignore
        container._summaryFilterValue = filterSelect.value;
        renderTable({ container, data, visibleColumns, setVisibleColumns, gearBtn });
    };
    // Add scroll wheel support for changing selection
    filterSelect.addEventListener(
        "wheel",
        (e) => {
            e.preventDefault();
            const options = Array.from(filterSelect.options);
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
                renderTable({ container, data, visibleColumns, setVisibleColumns, gearBtn });
            }
        },
        { passive: false }
    );
    filterLabel.appendChild(filterSelect);
    filterBar.appendChild(filterLabel);
    section.appendChild(filterBar);

    const headerBar = document.createElement("div");
    headerBar.className = "header-bar";
    const title = document.createElement("h3");
    title.textContent = "Activity Summary";
    title.classList.add("summary-title");
    headerBar.appendChild(title);
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy as CSV";
    copyBtn.className = "copy-btn";
    copyBtn.onclick = () => {
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
                patchedLaps.forEach((lap, i) => {
                    if (filterValue === "All" || filterValue === `Lap ${i + 1}`) {
                        rows.push(
                            sortedVisible
                                .map((k) => (k === LABEL_COL ? `Lap ${i + 1}` : lap[k] !== undefined ? lap[k] : ""))
                                .join(",")
                        );
                    }
                });
            }
            if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(rows.join("\n"));
            }
        } catch {
            /* Ignore copy errors */
        }
    };
    headerBar.appendChild(copyBtn);
    section.appendChild(headerBar);

    const table = document.createElement("table");
    table.classList.add("display");
    const thead = document.createElement("thead"),
        tbody = document.createElement("tbody"),
        sortedVisible = [LABEL_COL, ...visibleColumns],
        headerRow = document.createElement("tr");
    sortedVisible.forEach((key) => {
        const th = document.createElement("th");
        th.textContent = key === LABEL_COL ? "Type" : key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    // Summary row
    if (filterValue === "All" || filterValue === "Summary") {
        const summaryRows = getSummaryRows(data),
            summaryRow = document.createElement("tr"),
            summaryRec = summaryRows[0] || {};
        sortedVisible.forEach((key, idx) => {
            const td = document.createElement("td");
            td.textContent = key === LABEL_COL ? "Summary" : summaryRec[key] !== undefined ? summaryRec[key] : "";
            if (idx === 0) {
                td.classList.add("summary-row");
            }
            summaryRow.appendChild(td);
        });
        tbody.appendChild(summaryRow);
    }
    // Lap rows
    if (data.lapMesgs && data.lapMesgs.length > 0 && (filterValue === "All" || filterValue.startsWith("Lap"))) {
        const patchedLaps = data.lapMesgs.map((lap) => {
            const patched = { ...lap };
            patchSummaryFields(patched);
            return patched;
        });
        patchedLaps.forEach((lap, i) => {
            if (filterValue === "All" || filterValue === `Lap ${i + 1}`) {
                const lapRow = document.createElement("tr");
                sortedVisible.forEach((key) => {
                    const td = document.createElement("td");
                    if (key === LABEL_COL) {
                        td.textContent = `Lap ${i + 1}`;
                    } else if (key === "timestamp" && lap.startTime) {
                        td.textContent = lap.startTime; // Bracket access for index signature
                    } else {
                        td.textContent = lap[key] !== undefined ? lap[key] : "";
                    }
                    lapRow.appendChild(td);
                });
                tbody.appendChild(lapRow);
            }
        });
    }
    table.appendChild(thead);
    table.appendChild(tbody);
    section.appendChild(table);
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
            raw.total_ascent_ft = `${(raw.total_ascent * 3.28084).toFixed(0)} ft`;
        }
        if (raw.total_descent != null && !isNaN(raw.total_descent)) {
            raw.total_descent_ft = `${(raw.total_descent * 3.28084).toFixed(0)} ft`;
        }
        return [raw];
    }
    if (
        data?.recordMesgs &&
        data.recordMesgs.length > 0 &&
        typeof window !== "undefined" &&
        /** @type {AugmentedWindow} */ (window)?.aq
    ) {
        try {
            const aq = /** @type {AugmentedWindow} */ (window).aq,
                table = aq.from(data.recordMesgs),
                /** @type {SummaryStats} */
                stats = {
                    total_records: table.numRows(),
                    start_time: table.get(0, "timestamp"),
                    end_time: table.get(table.numRows() - 1, "timestamp"),
                };
            if (table.columnNames().includes("distance")) {
                stats.total_distance = table.get(table.numRows() - 1, "distance");
            }
            if (table.columnNames().includes("timestamp")) {
                const startTs = new Date(table.get(0, "timestamp")).getTime(),
                    endTs = new Date(table.get(table.numRows() - 1, "timestamp")).getTime();
                if (Number.isFinite(startTs) && Number.isFinite(endTs)) {
                    const sec = Math.round((endTs - startTs) / 1000);
                    stats.duration = sec;
                }
            }
            if (table.columnNames().includes("speed")) {
                const speeds = table.array("speed");
                if (Array.isArray(speeds) && speeds.length) {
                    const total = speeds.reduce((a, b) => a + b, 0);
                    stats.avg_speed = total / speeds.length;
                    stats.max_speed = Math.max(...speeds);
                }
            }
            if (table.columnNames().includes("altitude")) {
                const alts = table.array("altitude");
                if (Array.isArray(alts) && alts.length) {
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
export function showColModal({ allKeys, visibleColumns: initialVisibleColumns, setVisibleColumns, renderTable }) {
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
    modal.appendChild(title);
    // Local visibleColumns state
    let visibleColumns = [...initialVisibleColumns];
    /**
     * @param {string[]} cols
     */
    const updateVisibleColumns = (cols) => {
            visibleColumns = [...cols];
            if (typeof setVisibleColumns === "function") {
                setVisibleColumns(visibleColumns);
            }
        },
        // Select/Deselect All
        selectAllBtn = document.createElement("button");
    selectAllBtn.className = "select-all-btn themed-btn";
    /**
     * Refresh checkbox list based on current visibleColumns
     * @returns {void}
     */
    function updateColList() {
        colList.innerHTML = "";
        // Always show label column as checked and disabled
        const label = document.createElement("label"),
            cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = true;
        cb.disabled = true;
        label.appendChild(cb);
        label.appendChild(document.createTextNode("Type"));
        colList.appendChild(label);
        allKeys.forEach((key, idx) => {
            const label = document.createElement("label"),
                cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = visibleColumns.includes(key);
            cb.tabIndex = 0;
            /**
             * @param {MouseEvent} e
             */
            cb.onmousedown = (e) => {
                if (e.shiftKey && lastCheckedIndex !== null) {
                    e.preventDefault();
                    const start = Math.min(lastCheckedIndex, idx),
                        end = Math.max(lastCheckedIndex, idx),
                        shouldCheck = !visibleColumns.includes(key);
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
                    renderTable();
                    saveColPrefs(getStorageKey(window.globalData || {}, allKeys), newCols);
                }
            };
            /**
             * @param {Event & { shiftKey?: boolean}} e
             */
            cb.onchange = (e) => {
                if (e.shiftKey && lastCheckedIndex !== null) {
                    return;
                } // Handled in onmousedown
                lastCheckedIndex = idx;
                let newCols = [...visibleColumns];
                if (cb.checked) {
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
                renderTable();
                saveColPrefs(getStorageKey(window.globalData || {}, allKeys), newCols);
            };
            label.appendChild(cb);
            label.appendChild(document.createTextNode(key));
            colList.appendChild(label);
        });
        selectAllBtn.textContent = visibleColumns.length === allKeys.length ? "Deselect All" : "Select All";
    }
    selectAllBtn.textContent = visibleColumns.length === allKeys.length ? "Deselect All" : "Select All";
    selectAllBtn.onclick = () => {
        /** @type {string[]} */
        const newCols = visibleColumns.length === allKeys.length ? [] : allKeys.slice();
        updateVisibleColumns(newCols);
        updateColList();
        renderTable();
        saveColPrefs(getStorageKey(window.globalData || {}, allKeys), newCols);
    };
    modal.appendChild(selectAllBtn);
    // Column list
    const colList = document.createElement("div");
    colList.className = "col-list";
    modal.appendChild(colList);
    /** @type {number|null} */
    let lastCheckedIndex = null;
    updateColList();
    // Actions
    const actions = document.createElement("div");
    actions.className = "modal-actions";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "themed-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => overlay.remove();
    const okBtn = document.createElement("button");
    okBtn.className = "themed-btn";
    okBtn.textContent = "OK";
    okBtn.onclick = () => {
        overlay.remove();
        renderTable();
        saveColPrefs(getStorageKey(window.globalData || {}, allKeys), visibleColumns);
    };
    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
