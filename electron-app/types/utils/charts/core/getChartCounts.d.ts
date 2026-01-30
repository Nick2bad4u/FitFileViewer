/**
 * @typedef {{ total: number; visible: number; available: number }} ChartCategoryCounts
 *
 * @typedef {{
 *     total: number;
 *     visible: number;
 *     available: number;
 *     categories: {
 *         metrics: ChartCategoryCounts;
 *         analysis: ChartCategoryCounts;
 *         zones: ChartCategoryCounts;
 *         gps: ChartCategoryCounts;
 *     };
 * }} ChartCounts
 */
/** @typedef {import("./getChartCounts.js").ChartCounts} */
/**
 * Gets the count of available chart types based on current data
 *
 * @returns {Object} Object containing total available and currently visible
 *   counts
 */
/**
 * Compute chart counts grouped by category.
 *
 * @returns {ChartCounts}
 */
export function getChartCounts(): ChartCounts;
export type getChartCounts = import("./getChartCounts.js").ChartCounts;
export type ChartCategoryCounts = {
    total: number;
    visible: number;
    available: number;
};
export type ChartCounts = {
    total: number;
    visible: number;
    available: number;
    categories: {
        metrics: ChartCategoryCounts;
        analysis: ChartCategoryCounts;
        zones: ChartCategoryCounts;
        gps: ChartCategoryCounts;
    };
};
