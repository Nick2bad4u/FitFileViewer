/**
 * Summary refresh helper for the data point filter control.
 */

type DataPointFilterState = {
    readonly enabled?: boolean;
};

type LastFilterResult = {
    readonly applied?: boolean;
    readonly appliedMax?: number | null;
    readonly appliedMin?: number | null;
    readonly coverage?: number | null;
    readonly maxCandidate?: number | null;
    readonly metric?: string;
    readonly metricLabel?: string | null;
    readonly minCandidate?: number | null;
    readonly mode?: string;
    readonly percent?: number | null;
    readonly reason?: unknown;
    readonly selectedCount?: number;
    readonly totalCandidates?: number;
};

type SummaryRefresherGlobal = typeof globalThis & {
    mapDataPointFilter?: DataPointFilterState;
    mapDataPointFilterLastResult?: LastFilterResult | null;
};

/** Dependencies required to render the data-point filter summary text. */
export type CreateSummaryRefresherParams = {
    readonly formatMetricValue: (value: number, stats: null) => string;
    readonly formatPercent: (value: number) => string;
    readonly summary: HTMLElement;
};

/** Creates a callback that refreshes the data-point filter summary text. */
export function createSummaryRefresher({
    summary,
    formatMetricValue,
    formatPercent,
}: CreateSummaryRefresherParams): () => void {
    return function refreshSummary(): void {
        try {
            const win = globalThis as SummaryRefresherGlobal;
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
                    summary.textContent = `Showing ${getCount(
                        last.selectedCount
                    )} of ${getCount(last.totalCandidates)} points between ${formatMetricValue(
                        appliedMin,
                        null
                    )} and ${formatMetricValue(appliedMax, null)} ${getMetricDisplayName(
                        last.metricLabel,
                        last.metric
                    )} (${formatPercent(coverageValue)}% coverage)`;
                } else {
                    summary.textContent = `Showing top ${getNumberOrDefault(
                        last.percent,
                        0
                    )}% (${getCount(last.selectedCount)} of ${getCount(
                        last.totalCandidates
                    )}) by ${getMetricDisplayName(
                        last.metricLabel,
                        last.metric
                    )}`;
                }
                return;
            }
            if (last && last.reason) {
                summary.textContent = formatReason(last.reason);
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

function getNumberOrDefault(value: unknown, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback;
}

function getCount(value: number | undefined): number {
    return getNumberOrDefault(value, 0);
}

function getMetricDisplayName(
    metricLabel: string | null | undefined,
    metric: string | undefined
): string {
    return metricLabel ?? metric ?? "selected metric";
}

function formatReason(reason: unknown): string {
    if (typeof reason === "string") {
        return reason;
    }

    if (reason instanceof Error) {
        return reason.message;
    }

    if (
        typeof reason === "number" ||
        typeof reason === "boolean" ||
        typeof reason === "bigint" ||
        typeof reason === "symbol"
    ) {
        return String(reason);
    }

    if (reason && typeof reason === "object") {
        try {
            return JSON.stringify(reason);
        } catch {
            return "Unable to summarize filter result.";
        }
    }

    return "Unable to summarize filter result.";
}
