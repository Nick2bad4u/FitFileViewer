import { createMetricFilter } from "../../../maps/filters/mapMetricFilter.js";
import {
    formatMetricValue,
    formatPercent,
    getGlobalRecords,
} from "./stateHelpers.js";

/**
 * Build the user-facing summary text for a filter result.
 *
 * @param {
 *     | import("../../../maps/filters/mapMetricFilter.js").MetricFilterResult
 *     | null
 *     | undefined} result
 * @param {
 *     | import("../../../maps/filters/mapMetricFilter.js").MapDataPointFilterConfig
 *     | null
 *     | undefined} config
 * @param {{ decimals?: number } | null} [stats]
 *
 * @returns {string | null}
 */
export function buildSummaryText(result, config, stats) {
    if (!result || !result.isActive || result.reason) {
        return null;
    }
    if (result.mode === "valueRange") {
        const appliedMin = result.appliedMin ?? result.minCandidate ?? 0;
        const appliedMax = result.appliedMax ?? result.maxCandidate ?? 0;
        const coverage = formatPercent(result.percent ?? 0);
        return `Showing ${result.selectedCount} of ${result.totalCandidates} points between ${formatMetricValue(
            appliedMin,
            stats ?? null
        )} and ${formatMetricValue(appliedMax, stats ?? null)} ${
            result.metricLabel ?? result.metric
        } (${coverage}% coverage)`;
    }

    const percentValue = config?.percent ?? result.percent ?? 0;
    return `Showing top ${percentValue}% (${result.selectedCount} of ${result.totalCandidates}) by ${
        result.metricLabel ?? result.metric
    }`;
}

/**
 * Preview the filter result using the current global record set.
 *
 * @param {import("../../../maps/filters/mapMetricFilter.js").MapDataPointFilterConfig} config
 *
 * @returns {import("../../../maps/filters/mapMetricFilter.js").MetricFilterResult | null}
 */
export function previewFilterResult(config) {
    try {
        const records = getGlobalRecords();
        return createMetricFilter(records, config);
    } catch (error) {
        console.error(
            "[dataPointFilter] Failed to preview filter result",
            error
        );
        return null;
    }
}
