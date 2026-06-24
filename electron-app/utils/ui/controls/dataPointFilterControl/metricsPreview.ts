import {
    createMetricFilter,
    type MapDataPointFilterConfig,
    type MetricFilterResult,
    type MetricStatistics,
} from "../../../maps/filters/mapMetricFilter.js";
import {
    formatMetricValue,
    formatPercent,
    getActiveMetricRecords,
} from "./stateHelpers.js";

/** Build the user-facing summary text for a filter result. */
export function buildSummaryText(
    result: MetricFilterResult | null | undefined,
    config: MapDataPointFilterConfig | null | undefined,
    stats?: Pick<MetricStatistics, "decimals"> | null
): string | null {
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
        )} and ${formatMetricValue(appliedMax, stats ?? null)} ${getMetricDisplayName(
            result.metricLabel,
            result.metric
        )} (${coverage}% coverage)`;
    }

    const percentValue = config?.percent ?? result.percent ?? 0;
    return `Showing top ${percentValue}% (${result.selectedCount} of ${result.totalCandidates}) by ${getMetricDisplayName(
        result.metricLabel,
        result.metric
    )}`;
}

/** Preview the filter result using the active FIT record set. */
export function previewFilterResult(
    config: MapDataPointFilterConfig
): MetricFilterResult | null {
    try {
        const records = getActiveMetricRecords();
        return createMetricFilter(records, config);
    } catch (error) {
        console.error(
            "[dataPointFilter] Failed to preview filter result",
            error
        );
        return null;
    }
}

function getMetricDisplayName(
    metricLabel: string | null | undefined,
    metric: string | null | undefined
): string {
    return metricLabel ?? metric ?? "selected metric";
}
