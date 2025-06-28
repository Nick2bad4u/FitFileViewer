import { patchSummaryFields } from "../../data/processing/patchSummaryFields.js";
import { formatDistance } from "../../formatting/formatters/formatDistance.js";
import { formatDuration } from "../../formatting/formatters/formatDuration.js";
import { getStorageKey, loadColPrefs, renderTable, showColModal } from "../helpers/renderSummaryHelpers.js";

/**
 * Renders a summary of activity data, including main summary and lap summary tables,
 * into the DOM element with id 'content-summary'. Provides "Copy as CSV" buttons for both tables.
 *
 * The summary is generated from either `sessionMesgs` or `recordMesgs` in the input data.
 * If lap data is available (`lapMesgs`), lap rows are appended to the same table.
 *
 * @param {Object} data - The activity data object.
 * @param {Array<Object>} [data.sessionMesgs] - Array of session message objects (optional).
 * @param {Array<Object>} [data.recordMesgs] - Array of record message objects (optional).
 * @param {Array<Object>} [data.lapMesgs] - Array of lap message objects (optional).
 *
 * @example
 * renderSummary({
 *   sessionMesgs: [{ total_ascent: 100, total_descent: 80, ... }],
 *   recordMesgs: [{ timestamp: 123, distance: 1000, speed: 2.5, ... }, ...],
 *   lapMesgs: [{ lap_index: 1, total_time: 300, ... }, ...]
 * });
 */
export function renderSummary(data) {
    const container = document.getElementById("content-summary");
    container.innerHTML = "";
    let summaryRows = [];
    // Main summary table logic
    if (data.sessionMesgs && data.sessionMesgs.length > 0) {
        const raw = { ...data.sessionMesgs[0] };
        patchSummaryFields(raw);
        if (raw.total_ascent != null && !isNaN(raw.total_ascent)) {
            raw.total_ascent_ft = (raw.total_ascent * 3.28084).toFixed(0) + " ft";
        }
        if (raw.total_descent != null) {
            raw.total_descent_ft = (raw.total_descent * 3.28084).toFixed(0) + " ft";
        }
        summaryRows = [raw];
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
            stats.total_distance = formatDistance(dist);
        }
        if (table.columnNames().includes("timestamp")) {
            const start = new Date(table.get(0, "timestamp"));
            const end = new Date(table.get(table.numRows() - 1, "timestamp"));
            const sec = Math.round((end - start) / 1000);
            stats.duration = formatDuration(sec);
        }
        if (table.columnNames().includes("speed")) {
            const avg = table.array("speed").reduce((a, b) => a + b, 0) / table.numRows();
            const max = Math.max(...table.array("speed"));
            stats.avg_speed = (avg * 3.6).toFixed(2) + " km/h / " + (avg * 2.23694).toFixed(2) + " mph";
            stats.max_speed = (max * 3.6).toFixed(2) + " km/h / " + (max * 2.23694).toFixed(2) + " mph";
        }
        if (table.columnNames().includes("altitude")) {
            const min = Math.min(...table.array("altitude"));
            const max = Math.max(...table.array("altitude"));
            stats.min_altitude_ft = (min * 3.28084).toFixed(0) + " ft";
            stats.max_altitude_ft = (max * 3.28084).toFixed(0) + " ft";
        }
        patchSummaryFields(stats);
        summaryRows = [stats];
    } else {
        container.innerHTML = "<p>No summary data available.</p>";
        return;
    }
    // Remove summary columns with no data, all zero values, or NaN
    if (summaryRows.length > 0) {
        const keys = Object.keys(summaryRows[0]);
        const filteredKeys = keys.filter((key) => {
            const val = summaryRows[0][key];
            // Remove if null, undefined, empty string, strictly 0, or NaN
            return (
                val !== null &&
                val !== undefined &&
                val !== "" &&
                !(
                    (typeof val === "number" && val === 0) ||
                    (typeof val === "string" && /^(0+(\.0+)?|0*\.\d*0+)$/.test(val.trim()))
                ) &&
                !(typeof val === "number" && isNaN(val))
            );
        });
        summaryRows[0] = Object.fromEntries(filteredKeys.map((k) => [k, summaryRows[0][k]]));
    }

    // Use helpers for the rest
    let allKeys = Object.keys(summaryRows[0]);
    if (data.sessionMesgs && data.sessionMesgs.length > 0) {
        data.sessionMesgs.forEach((row) => {
            Object.keys(row).forEach((k) => {
                if (!allKeys.includes(k)) allKeys.push(k);
            });
        });
    } else if (data.recordMesgs && data.recordMesgs.length > 0) {
        data.recordMesgs.forEach((row) => {
            Object.keys(row).forEach((k) => {
                if (!allKeys.includes(k)) allKeys.push(k);
            });
        });
    }
    let visibleColumns = loadColPrefs(getStorageKey(data, allKeys), allKeys) || allKeys.slice();

    const gearBtn = document.createElement("button");
    gearBtn.className = "summary-gear-btn";
    gearBtn.title = "Select columns";
    gearBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1v.09A1.65 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z"/></svg>`;
    gearBtn.onclick = (e) => {
        e.stopPropagation();
        showColModal({
            container,
            allKeys,
            visibleColumns,
            setVisibleColumns: (cols) => {
                visibleColumns = cols;
            },
            renderTable: () =>
                renderTable({
                    container,
                    data,
                    allKeys,
                    visibleColumns,
                    setVisibleColumns: (cols) => {
                        visibleColumns = cols;
                    },
                    gearBtn,
                }),
        });
    };

    renderTable({
        container,
        data,
        allKeys,
        visibleColumns,
        setVisibleColumns: (cols) => {
            visibleColumns = cols;
        },
        gearBtn,
    });
}
