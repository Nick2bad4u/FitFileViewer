import { patchSummaryFields } from "./patchSummaryFields.js";

export const LABEL_COL = "__row_label__";

export function getStorageKey(data) {
    let fpath = "";
    if (window?.globalData?.cachedFilePath) {
        fpath = window.globalData.cachedFilePath;
    } else if (data?.cachedFilePath) {
        fpath = data.cachedFilePath;
    } else if (window?.activeFitFileName) {
        fpath = window.activeFitFileName;
    }
    if (fpath) {
        return `summaryColSel_${encodeURIComponent(fpath)}`;
    }
    return "summaryColSel_default";
}

export function saveColPrefs(key, visibleColumns) {
    try {
        localStorage.setItem(key, JSON.stringify(visibleColumns));
    } catch {
        /* intentionally ignore errors */
    }
}

export function loadColPrefs(key) {
    try {
        const v = localStorage.getItem(key);
        if (v) {
            const arr = JSON.parse(v);
            if (Array.isArray(arr) && arr.length > 0) {
                return arr;
            }
        }
    } catch {
        /* intentionally ignore errors */
    }
    return null;
}

export function getRowLabel(rowIdx, isLap) {
    if (isLap) return `Lap ${rowIdx + 1}`;
    return "Summary";
}

export function renderTable({ container, data, visibleColumns, setVisibleColumns, gearBtn }) {
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
    let filterValue = container._summaryFilterValue || "All";
    filterSelect.value = filterValue;
    filterSelect.onchange = () => {
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
            if (options[idx]) {
                filterSelect.value = options[idx].value;
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
        const rows = [];
        const sortedVisible = [LABEL_COL, ...visibleColumns];
        rows.push(sortedVisible.map((k) => (k === LABEL_COL ? "Type" : k)).join(","));
        // Summary row
        if (filterValue === "All" || filterValue === "Summary") {
            const summaryRows = getSummaryRows(data);
            rows.push(sortedVisible.map((k) => (k === LABEL_COL ? "Summary" : summaryRows[0][k] !== undefined ? summaryRows[0][k] : "")).join(","));
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
                    rows.push(sortedVisible.map((k) => (k === LABEL_COL ? `Lap ${i + 1}` : lap[k] !== undefined ? lap[k] : "")).join(","));
                }
            });
        }
        navigator.clipboard.writeText(rows.join("\n"));
    };
    headerBar.appendChild(copyBtn);
    section.appendChild(headerBar);

    const table = document.createElement("table");
    table.classList.add("display");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const sortedVisible = [LABEL_COL, ...visibleColumns];
    const headerRow = document.createElement("tr");
    sortedVisible.forEach((key) => {
        const th = document.createElement("th");
        th.textContent = key === LABEL_COL ? "Type" : key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    // Summary row
    if (filterValue === "All" || filterValue === "Summary") {
        const summaryRows = getSummaryRows(data);
        const summaryRow = document.createElement("tr");
        sortedVisible.forEach((key, idx) => {
            const td = document.createElement("td");
            td.textContent = key === LABEL_COL ? "Summary" : summaryRows[0][key] !== undefined ? summaryRows[0][key] : "";
            if (idx === 0) td.classList.add("summary-row");
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
                        td.textContent = lap.startTime;
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

function getSummaryRows(data) {
    if (data.sessionMesgs && data.sessionMesgs.length > 0) {
        const raw = { ...data.sessionMesgs[0] };
        patchSummaryFields(raw);
        if (raw.total_ascent != null && !isNaN(raw.total_ascent)) {
            raw.total_ascent_ft = (raw.total_ascent * 3.28084).toFixed(0) + " ft";
        }
        if (raw.total_descent != null) {
            raw.total_descent_ft = (raw.total_descent * 3.28084).toFixed(0) + " ft";
        }
        return [raw];
    } else if (data.recordMesgs && data.recordMesgs.length > 0) {
        const aq = window.aq;
        const table = aq.from(data.recordMesgs);
        const stats = {
            total_records: table.numRows(),
            start_time: table.get(0, "timestamp"),
            end_time: table.get(table.numRows() - 1, "timestamp"),
        };
        if (table.columnNames().includes("distance")) {
            const dist = table.get(table.numRows() - 1, "distance");
            stats.total_distance = dist;
        }
        if (table.columnNames().includes("timestamp")) {
            const start = new Date(table.get(0, "timestamp"));
            const end = new Date(table.get(table.numRows() - 1, "timestamp"));
            const sec = Math.round((end - start) / 1000);
            stats.duration = sec;
        }
        if (table.columnNames().includes("speed")) {
            const avg = table.array("speed").reduce((a, b) => a + b, 0) / table.numRows();
            const max = Math.max(...table.array("speed"));
            stats.avg_speed = avg;
            stats.max_speed = max;
        }
        if (table.columnNames().includes("altitude")) {
            const min = Math.min(...table.array("altitude"));
            const max = Math.max(...table.array("altitude"));
            stats.min_altitude_ft = min;
            stats.max_altitude_ft = max;
        }
        patchSummaryFields(stats);
        return [stats];
    }
    return [{}];
}

export function showColModal({ allKeys, visibleColumns: initialVisibleColumns, setVisibleColumns, renderTable }) {
    // Remove any existing modal
    const old = document.querySelector(".summary-col-modal-overlay");
    if (old) old.remove();
    const overlay = document.createElement("div");
    overlay.className = "summary-col-modal-overlay";
    const modal = document.createElement("div");
    modal.className = "summary-col-modal";
    const title = document.createElement("h2");
    title.textContent = "Select Summary Columns";
    modal.appendChild(title);
    // Local visibleColumns state
    let visibleColumns = [...initialVisibleColumns];
    const updateVisibleColumns = (cols) => {
        visibleColumns = [...cols];
        if (typeof setVisibleColumns === "function") setVisibleColumns(visibleColumns);
    };
    // Select/Deselect All
    const selectAllBtn = document.createElement("button");
    selectAllBtn.className = "select-all-btn themed-btn";
    function updateColList() {
        colList.innerHTML = "";
        // Always show label column as checked and disabled
        const label = document.createElement("label");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = true;
        cb.disabled = true;
        label.appendChild(cb);
        label.appendChild(document.createTextNode("Type"));
        colList.appendChild(label);
        allKeys.forEach((key, idx) => {
            const label = document.createElement("label");
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = visibleColumns.includes(key);
            cb.tabIndex = 0;
            cb.onmousedown = (e) => {
                if (e.shiftKey && lastCheckedIndex !== null) {
                    e.preventDefault();
                    const start = Math.min(lastCheckedIndex, idx);
                    const end = Math.max(lastCheckedIndex, idx);
                    const shouldCheck = !visibleColumns.includes(key);
                    let newCols = [...visibleColumns];
                    for (let i = start; i <= end; ++i) {
                        const k = allKeys[i];
                        if (shouldCheck && !newCols.includes(k)) newCols.push(k);
                        if (!shouldCheck && newCols.includes(k)) newCols = newCols.filter((x) => x !== k);
                    }
                    newCols = allKeys.filter((k) => newCols.includes(k));
                    updateVisibleColumns(newCols);
                    updateColList();
                    renderTable();
                    saveColPrefs(getStorageKey(window.globalData || {}, allKeys), newCols);
                }
            };
            cb.onchange = (e) => {
                if (e.shiftKey && lastCheckedIndex !== null) return; // handled in onmousedown
                lastCheckedIndex = idx;
                let newCols = [...visibleColumns];
                if (cb.checked) {
                    if (!newCols.includes(key)) newCols.push(key);
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
        let newCols;
        if (visibleColumns.length === allKeys.length) {
            newCols = [];
        } else {
            newCols = allKeys.slice();
        }
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
