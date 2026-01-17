/**
 * @typedef {Object} MetricFilterResult
 * @property {boolean} isActive
 * @property {string|null} metric
 * @property {string|null} metricLabel
 * @property {MapFilterMode} mode
 * @property {number} percent
 * @property {number|null} threshold
 * @property {number} totalCandidates
 * @property {number} selectedCount
 * @property {Set<number>} allowedIndices
 * @property {number[]} orderedIndices
 * @property {string|null} reason
 * @property {number|null} minCandidate
 * @property {number|null} maxCandidate
 * @property {number|null} appliedMin
 * @property {number|null} appliedMax
 */
/**
 * @typedef {Object} MetricFilterOptions
 * @property {(row:any)=>number|null} [valueExtractor]
 */
/**
 * Convenience helper returning a predicate for whether a record index should
 * be displayed, based on the provided metric filter result.
 *
 * @param {MetricFilterResult} result
 * @returns {(recordIndex:number)=>boolean}
 */
export function buildMetricFilterPredicate(result: MetricFilterResult): (recordIndex: number) => boolean;
/**
 * Compute descriptive statistics for a metric across record messages.
 * @param {Array<any>} recordMesgs
 * @param {string} metricKey
 * @param {MetricFilterOptions} [options]
 * @returns {{metric:string,metricLabel:string,min:number,max:number,average:number,count:number,decimals:number,step:number}|null}
 */
export function computeMetricStatistics(
    recordMesgs: Array<any>,
    metricKey: string,
    options?: MetricFilterOptions
): {
    metric: string;
    metricLabel: string;
    min: number;
    max: number;
    average: number;
    count: number;
    decimals: number;
    step: number;
} | null;
/**
 * Compute the indices belonging to the requested top percentile for a metric.
 *
 * @param {Array<any>} recordMesgs
 * @param {MapDataPointFilterConfig | undefined | null} config
 * @param {MetricFilterOptions} [options]
 * @returns {MetricFilterResult}
 */
export function createMetricFilter(
    recordMesgs: Array<any>,
    config: MapDataPointFilterConfig | undefined | null,
    options?: MetricFilterOptions
): MetricFilterResult;
/**
 * Resolve metric definition by key.
 * @param {string} metricKey
 * @returns {MetricDefinition|null}
 */
export function getMetricDefinition(metricKey: string): MetricDefinition | null;
/**
 * Map data point metric filtering utilities. Provides helpers to compute the
 * top percentile of record indices for a given metric when rendering markers.
 */
/**
 * @typedef {Object} MetricRecord
 * @property {number} [speed]
 * @property {number} [power]
 * @property {number} [cadence]
 * @property {number} [heartRate]
 * @property {number} [altitude]
 */
/**
 * @typedef {"topPercent"|"valueRange"} MapFilterMode
 */
/**
 * @typedef {Object} MapDataPointFilterConfig
 * @property {boolean} enabled
 * @property {string} metric
 * @property {MapFilterMode} [mode]
 * @property {number} [percent]
 * @property {number} [minValue]
 * @property {number} [maxValue]
 */
/**
 * @typedef {Object} MetricDefinition
 * @property {string} key
 * @property {string} label
 * @property {(row:MetricRecord)=>number|null} resolver
 */
/**
 * Available metrics that can be filtered on. Keep in sync with UI control.
 * @type {MetricDefinition[]}
 */
export const MAP_FILTER_METRICS: MetricDefinition[];
export type MetricFilterResult = {
    isActive: boolean;
    metric: string | null;
    metricLabel: string | null;
    mode: MapFilterMode;
    percent: number;
    threshold: number | null;
    totalCandidates: number;
    selectedCount: number;
    allowedIndices: Set<number>;
    orderedIndices: number[];
    reason: string | null;
    minCandidate: number | null;
    maxCandidate: number | null;
    appliedMin: number | null;
    appliedMax: number | null;
};
export type MetricFilterOptions = {
    valueExtractor?: (row: any) => number | null;
};
export type MetricRecord = {
    speed?: number;
    power?: number;
    cadence?: number;
    heartRate?: number;
    altitude?: number;
};
export type MapFilterMode = "topPercent" | "valueRange";
export type MapDataPointFilterConfig = {
    enabled: boolean;
    metric: string;
    mode?: MapFilterMode;
    percent?: number;
    minValue?: number;
    maxValue?: number;
};
export type MetricDefinition = {
    key: string;
    label: string;
    resolver: (row: MetricRecord) => number | null;
};
