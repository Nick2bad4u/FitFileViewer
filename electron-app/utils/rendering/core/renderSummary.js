import { getElementByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { getAppIconSvg } from "../../ui/icons/iconFactory.js";
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
 * Renders a summary of activity data, including main summary and lap summary
 * tables, into the DOM element with id 'content_summary'. Provides "Copy as
 * CSV" buttons for both tables.
 *
 * The summary is generated from either `sessionMesgs` or `recordMesgs` in the
 * input data. If lap data is available (`lapMesgs`), lap rows are appended to
 * the same table.
 *
 * @example
 *     renderSummary({
 *       sessionMesgs: [{ total_ascent: 100, total_descent: 80, ... }],
 *       recordMesgs: [{ timestamp: 123, distance: 1000, speed: 2.5, ... }, ...],
 *       lapMesgs: [{ lap_index: 1, total_time: 300, ... }, ...]
 *     });
 *
 * @param {Object} data - The activity data object.
 * @param {Object[]} [data.sessionMesgs] - Array of session message objects
 *   (optional).
 * @param {Object[]} [data.recordMesgs] - Array of record message objects
 *   (optional).
 * @param {Object[]} [data.lapMesgs] - Array of lap message objects (optional).
 */
export function renderSummary(data) {
    const container = getElementByIdFlexible(document, "content_summary");
    if (!container) {
        return;
    } // Guard: container missing
    container.innerHTML = "";

    // Build superset of keys from session, lap, record messages for column selection.
    /** @type {Set<string>} */
    const keySet = new Set();
    if (data && data.sessionMesgs) {
        for (const row of data.sessionMesgs)
            for (const k of Object.keys(row || {})) keySet.add(k);
    }
    if (data && data.lapMesgs) {
        for (const row of data.lapMesgs)
            for (const k of Object.keys(row || {})) keySet.add(k);
    }
    if (data && data.recordMesgs) {
        for (const row of data.recordMesgs)
            for (const k of Object.keys(row || {})) keySet.add(k);
    }
    const allKeys = [...keySet];
    const fileKey = getStorageKey(data, allKeys);
    const perFilePrefs = loadColPrefs(fileKey, allKeys);
    const globalPrefs = loadColPrefs(getGlobalStorageKey(), allKeys);
    // Always render named columns before numbered-only columns.
    const initialPrefs = perFilePrefs ?? globalPrefs ?? [...allKeys];
    // Preferences can come from a different activity, so they may include keys that do not exist
    // in the current file. Filter them out so we don't render empty/blank columns.
    const normalizedPrefs = orderSummaryColumnsNamedFirst(allKeys).filter((k) =>
        initialPrefs.includes(k)
    );
    let visibleColumns = normalizedPrefs;

    const gearBtn = document.createElement("button");
    gearBtn.className = "summary-gear-btn";
    gearBtn.title = "Select columns";
    gearBtn.innerHTML = getAppIconSvg("settings", {
        className: "summary-gear-btn__icon",
        size: 22,
        strokeWidth: 2,
    });
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
