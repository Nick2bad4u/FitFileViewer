import {
    getGlobalStorageKey,
    getStorageKey,
    loadColPrefs,
    orderSummaryColumnsNamedFirst,
    renderTable,
} from "../helpers/renderSummaryHelpers.js";
import { showColModal } from "../helpers/summaryColModal.js";

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
    const allKeys = [...keySet];
    const fileKey = getStorageKey(data, allKeys);
    const perFilePrefs = loadColPrefs(fileKey, allKeys);
    const globalPrefs = loadColPrefs(getGlobalStorageKey(), allKeys);
    // Always render named columns before numbered-only columns.
    const initialPrefs = perFilePrefs ?? globalPrefs ?? [...allKeys];
    // Preferences can come from a different activity, so they may include keys that do not exist
    // in the current file. Filter them out so we don't render empty/blank columns.
    const normalizedPrefs = orderSummaryColumnsNamedFirst(allKeys).filter((k) => initialPrefs.includes(k));
    let visibleColumns = normalizedPrefs;

    const gearBtn = document.createElement("button");
    gearBtn.className = "summary-gear-btn";
    gearBtn.title = "Select columns";
    gearBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1v.09A1.65 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z"/></svg>`;
    gearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showColModal({
            allKeys,
            data: /** @type {FitSummaryData} */ (data),
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
