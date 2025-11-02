/**
 * Build the user-facing summary text for a filter result.
 *
 * @param {import("../../../maps/filters/mapMetricFilter.js").MetricFilterResult | null | undefined} result
 * @param {import("../../../maps/filters/mapMetricFilter.js").MapDataPointFilterConfig | null | undefined} config
 * @param {{ decimals?: number } | null} [stats]
 * @returns {string | null}
 */
export function buildSummaryText(result: import("../../../maps/filters/mapMetricFilter.js").MetricFilterResult | null | undefined, config: import("../../../maps/filters/mapMetricFilter.js").MapDataPointFilterConfig | null | undefined, stats?: {
    decimals?: number;
} | null): string | null;
/**
 * Preview the filter result using the current global record set.
 *
 * @param {import("../../../maps/filters/mapMetricFilter.js").MapDataPointFilterConfig} config
 * @returns {import("../../../maps/filters/mapMetricFilter.js").MetricFilterResult | null}
 */
export function previewFilterResult(config: import("../../../maps/filters/mapMetricFilter.js").MapDataPointFilterConfig): import("../../../maps/filters/mapMetricFilter.js").MetricFilterResult | null;
//# sourceMappingURL=metricsPreview.d.ts.map