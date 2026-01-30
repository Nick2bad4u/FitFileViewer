/**
 * @typedef {import("../../maps/filters/mapMetricFilter.js").MapDataPointFilterConfig} MapDataPointFilterConfig
 */
/**
 * @param {(payload: {
 *     action: "apply" | "clear";
 *     config: MapDataPointFilterConfig;
 *     result?: import("../../maps/filters/mapMetricFilter.js").MetricFilterResult;
 * }) => void} [onFilterChange]
 *
 * @returns {HTMLDivElement}
 */
export function createDataPointFilterControl(
    onFilterChange?: (payload: {
        action: "apply" | "clear";
        config: MapDataPointFilterConfig;
        result?: import("../../maps/filters/mapMetricFilter.js").MetricFilterResult;
    }) => void
): HTMLDivElement;
export type MapDataPointFilterConfig =
    import("../../maps/filters/mapMetricFilter.js").MapDataPointFilterConfig;
