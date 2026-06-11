import {
    getState,
    setState,
    updateState,
    type StateUpdateOptions,
} from "../core/stateManager.js";

const CHART_PERFORMANCE_HISTORY_STATE_PATH = "performance.chartHistory";
const CHART_PERFORMANCE_TRACKING_STATE_PATH = "performance.tracking";
const DEFAULT_MAX_CHART_PERFORMANCE_HISTORY = 50;

export type RendererChartPerformanceRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RendererChartPerformanceRecord {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function getRendererChartPerformanceHistory(): RendererChartPerformanceRecord[] {
    const history = getState(CHART_PERFORMANCE_HISTORY_STATE_PATH);
    return Array.isArray(history) ? history.filter(isRecord) : [];
}

export function getRendererChartPerformanceTracking(
    trackingId: string
): unknown {
    return getState(`${CHART_PERFORMANCE_TRACKING_STATE_PATH}.${trackingId}`);
}

export function appendRendererChartPerformanceHistory(
    performanceRecord: RendererChartPerformanceRecord,
    options: StateUpdateOptions = {}
): RendererChartPerformanceRecord[] {
    const history = getRendererChartPerformanceHistory();
    history.push(performanceRecord);

    if (history.length > DEFAULT_MAX_CHART_PERFORMANCE_HISTORY) {
        history.splice(0, history.length - DEFAULT_MAX_CHART_PERFORMANCE_HISTORY);
    }

    setState(CHART_PERFORMANCE_HISTORY_STATE_PATH, history, {
        source: "rendererChartPerformanceState.appendHistory",
        ...options,
    });

    return history;
}

export function updateRendererChartPerformanceTracking(
    trackingId: string,
    performanceRecord: RendererChartPerformanceRecord,
    options: StateUpdateOptions = {}
): void {
    updateState(
        CHART_PERFORMANCE_TRACKING_STATE_PATH,
        {
            [trackingId]: performanceRecord,
        },
        {
            source: "rendererChartPerformanceState.updateTracking",
            ...options,
        }
    );
}
