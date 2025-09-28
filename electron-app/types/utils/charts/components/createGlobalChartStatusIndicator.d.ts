/**
 * Creates a persistent global chart status indicator that's always visible
 * at the top of the chart tab, regardless of settings panel visibility
 *
 * Provides visual feedback about chart availability and visibility status,
 * with quick access to settings for enabling hidden charts.
 *
 * @returns {HTMLElement|null} The created indicator element or null on failure
 *
 * @example
 * // Create or update the global chart status indicator
 * const indicator = createGlobalChartStatusIndicator();
 * if (indicator) {
 *     console.log("Chart status indicator created successfully");
 * }
 */
export function createGlobalChartStatusIndicator(): HTMLElement | null;
/**
 * Supported log levels for this module
 */
export type LogLevel = "log" | "info" | "warn" | "error";
export type ChartCounts = import("../core/getChartCounts.js").ChartCounts;
export type ChartStatus = {
    isAllVisible: boolean;
    hasHiddenCharts: boolean;
    hasNoCharts: boolean;
    counts: ChartCounts;
};
//# sourceMappingURL=createGlobalChartStatusIndicator.d.ts.map