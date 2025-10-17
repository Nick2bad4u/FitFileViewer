import { getStorageKey, loadColPrefs, renderTable, showColModal } from "../helpers/renderSummaryHelpers.js";

/**
 * @typedef {import("../helpers/renderSummaryHelpers.js").FitSummaryData} FitSummaryData
 */

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
    const container = document.querySelector("#content-summary");
    if (!container) {
        return;
    } // Guard: container missing
    container.innerHTML = "";

    // Build superset of keys from session, lap, record messages for column selection.
    /** @type {Set<string>} */
    const keySet = new Set();
    if (data && data.sessionMesgs) {
        for (const row of data.sessionMesgs) for (const k of Object.keys(row || {})) keySet.add(k);
    }
    if (data && data.lapMesgs) {
        for (const row of data.lapMesgs) for (const k of Object.keys(row || {})) keySet.add(k);
    }
    if (data && data.recordMesgs) {
        for (const row of data.recordMesgs) for (const k of Object.keys(row || {})) keySet.add(k);
    }
    const allKeys = Array.from(keySet);
    let visibleColumns = loadColPrefs(getStorageKey(data)) || Array.from(allKeys);

    const gearBtn = document.createElement("button");
    gearBtn.className = "summary-gear-btn";
    gearBtn.title = "Select columns";
    gearBtn.innerHTML = '<iconify-icon icon="flat-color-icons:settings" width="22" height="22"></iconify-icon>';
    gearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showColModal({
            allKeys,
            renderTable: () =>
                renderTable({
                    container,
                    data: /** @type {FitSummaryData} */ (data),
                    gearBtn,
                    setVisibleColumns: (cols) => {
                        visibleColumns = cols;
                    },
                    visibleColumns,
                }),
            setVisibleColumns: (cols) => {
                visibleColumns = cols;
            },
            visibleColumns,
        });
    });

    renderTable({
        container,
        data: /** @type {FitSummaryData} */ (data),
        gearBtn,
        setVisibleColumns: (cols) => {
            visibleColumns = cols;
        },
        visibleColumns,
    });
}
