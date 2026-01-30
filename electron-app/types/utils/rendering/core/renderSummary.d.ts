/**
 * @typedef {import("../helpers/renderSummaryHelpers.js").FitSummaryData} FitSummaryData
 */
/**
 * Renders a summary of activity data, including main summary and lap summary
 * tables, into the DOM element with id 'content-summary'. Provides "Copy as
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
export function renderSummary(data: {
    sessionMesgs?: Object[] | undefined;
    recordMesgs?: Object[] | undefined;
    lapMesgs?: Object[] | undefined;
}): void;
export type FitSummaryData =
    import("../helpers/renderSummaryHelpers.js").FitSummaryData;
