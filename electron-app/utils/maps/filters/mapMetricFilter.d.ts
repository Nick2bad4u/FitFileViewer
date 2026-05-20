/** A FIT record row with metric fields used by map data-point filtering. */
export type MetricRecord = Record<string, unknown> & {
    altitude?: number;
    auxHeartRate?: number;
    cadence?: number;
    heartRate?: number;
    power?: number;
    speed?: number;
};

/** Data-point filter modes supported by the map marker renderer. */
export type MapFilterMode = "topPercent" | "valueRange";

/** User-facing data-point filter configuration. */
export type MapDataPointFilterConfig = {
    enabled: boolean;
    maxValue?: number;
    metric: string;
    minValue?: number;
    mode?: MapFilterMode;
    percent?: number;
};

/** Definition of a metric available for map data-point filtering. */
export type MetricDefinition = {
    key: string;
    label: string;
    resolver: (row: MetricRecord) => number | null;
};

/** Descriptive statistics for a metric across the current record set. */
export type MetricStatistics = {
    average: number;
    count: number;
    decimals: number;
    max: number;
    metric: string;
    metricLabel: string;
    min: number;
    step: number;
};

/** Result returned after applying a data-point metric filter. */
export type MetricFilterResult = {
    allowedIndices: Set<number>;
    appliedMax: number | null;
    appliedMin: number | null;
    isActive: boolean;
    maxCandidate: number | null;
    metric: string | null;
    metricLabel: string | null;
    minCandidate: number | null;
    mode: MapFilterMode;
    orderedIndices: number[];
    percent: number;
    reason: string | null;
    selectedCount: number;
    threshold: number | null;
    totalCandidates: number;
};

/** Optional hooks for metric filtering. */
export type MetricFilterOptions = {
    valueExtractor?: (row: MetricRecord) => number | null;
};

/** Metrics available to the map data-point filter. */
export const MAP_FILTER_METRICS: MetricDefinition[];

/** Builds a predicate for testing whether a record index is selected. */
export function buildMetricFilterPredicate(
    result: MetricFilterResult
): (recordIndex: number) => boolean;

/** Computes descriptive statistics for a metric across record messages. */
export function computeMetricStatistics(
    recordMesgs: readonly MetricRecord[],
    metricKey: string,
    options?: MetricFilterOptions
): MetricStatistics | null;

/** Applies a metric filter to a record set. */
export function createMetricFilter(
    recordMesgs: readonly MetricRecord[],
    config: MapDataPointFilterConfig | null | undefined,
    options?: MetricFilterOptions
): MetricFilterResult;

/** Resolves a metric definition by key. */
export function getMetricDefinition(metricKey: string): MetricDefinition | null;
