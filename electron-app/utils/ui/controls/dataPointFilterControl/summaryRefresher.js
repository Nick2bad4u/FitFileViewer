/**
 * Summary refresh helper for the data point filter control.
 */

/**
 * @param {{
 *     summary: HTMLElement;
 *     formatMetricValue: (value: number, stats: any) => string;
 *     formatPercent: (value: number) => string;
 * }} params
 *
 * @returns {() => void}
 */
export function createSummaryRefresher({
    summary,
    formatMetricValue,
    formatPercent,
}) {
    return function refreshSummary() {
        try {
            const win = /** @type {any} */ (globalThis);
            const last = win.mapDataPointFilterLastResult;
            if (last && last.applied) {
                if (last.mode === "valueRange") {
                    const appliedMin =
                        typeof last.appliedMin === "number"
                            ? last.appliedMin
                            : (last.minCandidate ?? 0);
                    const appliedMax =
                        typeof last.appliedMax === "number"
                            ? last.appliedMax
                            : (last.maxCandidate ?? 0);
                    const coverageValue =
                        typeof last.coverage === "number"
                            ? last.coverage
                            : typeof last.percent === "number"
                              ? last.percent
                              : 0;
                    summary.textContent = `Showing ${last.selectedCount} of ${last.totalCandidates} points between ${formatMetricValue(
                        appliedMin,
                        null
                    )} and ${formatMetricValue(appliedMax, null)} ${last.metricLabel ?? last.metric} (${formatPercent(
                        coverageValue
                    )}% coverage)`;
                } else {
                    summary.textContent = `Showing top ${last.percent}% (${last.selectedCount} of ${last.totalCandidates}) by ${
                        last.metricLabel ?? last.metric
                    }`;
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
