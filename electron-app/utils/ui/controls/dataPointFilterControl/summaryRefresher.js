/**
 * Summary refresh helper for the data point filter control.
 */
/** Creates a callback that refreshes the data-point filter summary text. */
export function createSummaryRefresher({
    summary,
    formatMetricValue,
    formatPercent,
}) {
    return function refreshSummary() {
        try {
            const win = globalThis;
            const last = win.mapDataPointFilterLastResult;
            if (last && last.applied) {
                if (last.mode === "valueRange") {
                    const appliedMin = getNumberOrDefault(
                        last.appliedMin,
                        last.minCandidate ?? 0
                    );
                    const appliedMax = getNumberOrDefault(
                        last.appliedMax,
                        last.maxCandidate ?? 0
                    );
                    const coverageValue = getNumberOrDefault(
                        last.coverage,
                        getNumberOrDefault(last.percent, 0)
                    );
                    summary.textContent = `Showing ${last.selectedCount} of ${last.totalCandidates} points between ${formatMetricValue(appliedMin, null)} and ${formatMetricValue(appliedMax, null)} ${last.metricLabel ?? last.metric} (${formatPercent(coverageValue)}% coverage)`;
                } else {
                    summary.textContent = `Showing top ${last.percent}% (${last.selectedCount} of ${last.totalCandidates}) by ${last.metricLabel ?? last.metric}`;
                }
                return;
            }
            if (last && last.reason) {
                summary.textContent = String(last.reason);
                return;
            }
            if (!win.mapDataPointFilter || !win.mapDataPointFilter.enabled) {
                summary.textContent =
                    "Highlight the most intense sections of your ride.";
            }
        } catch {
            /* ignore */
        }
    };
}
function getNumberOrDefault(value, fallback) {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback;
}
