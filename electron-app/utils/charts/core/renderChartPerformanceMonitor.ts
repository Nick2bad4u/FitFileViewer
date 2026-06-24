import {
    appendRendererChartPerformanceHistory,
    getRendererChartPerformanceHistory,
    getRendererChartPerformanceTracking,
    updateRendererChartPerformanceTracking,
} from "../../state/domain/rendererChartPerformanceState.js";
import { getRecordValue, isObjectRecord } from "./renderChartModuleHelpers.js";
import {
    getRenderChartPerformanceMonitorRuntime,
    type RenderChartPerformanceMonitorRuntime,
} from "./renderChartPerformanceMonitorRuntime.js";

interface PerformanceTrackingRecord extends Record<string, unknown> {
    startTime: number;
}

/** Summary of recent chart rendering performance samples. */
export interface PerformanceSummary {
    averageDuration?: number;
    lastOperation?: unknown;
    maxDuration?: number;
    minDuration?: number;
    recentOperations?: unknown[];
    totalOperations?: number;
}

function getPerformanceHistory(): Record<string, unknown>[] {
    return getRendererChartPerformanceHistory();
}

function renderChartPerformanceMonitorRuntime(): RenderChartPerformanceMonitorRuntime {
    return getRenderChartPerformanceMonitorRuntime();
}

function isPerformanceTrackingRecord(
    value: unknown
): value is PerformanceTrackingRecord {
    return (
        isObjectRecord(value) &&
        typeof getRecordValue(value, "startTime") === "number"
    );
}

/**
 * Tracks and summarizes chart rendering performance metrics.
 */
export const chartPerformanceMonitor = {
    /**
     * End performance tracking and record metrics.
     *
     * @param trackingId - Tracking ID from startTracking.
     * @param additionalData - Additional performance data.
     */
    endTracking(
        trackingId: string,
        additionalData: Record<string, unknown> = {}
    ): void {
        const trackingData = getRendererChartPerformanceTracking(trackingId);
        if (!isPerformanceTrackingRecord(trackingData)) {
            return;
        }

        const endTime = renderChartPerformanceMonitorRuntime().nowPerformance();
        const duration = endTime - trackingData.startTime;
        const performanceRecord = {
            ...trackingData,
            ...additionalData,
            duration,
            endTime,
            status: "completed",
        };

        updateRendererChartPerformanceTracking(trackingId, performanceRecord, {
            source: "chartPerformanceMonitor.endTracking",
        });
        appendRendererChartPerformanceHistory(performanceRecord, {
            silent: false,
            source: "chartPerformanceMonitor.endTracking",
        });

        console.log(
            `[ChartJS Performance] ${String(getRecordValue(trackingData, "operation"))} completed in ${duration.toFixed(2)}ms`
        );
    },

    /**
     * Get performance summary for charts.
     *
     * @returns Performance metrics summary.
     */
    getSummary(): PerformanceSummary {
        const history = getPerformanceHistory();
        if (history.length === 0) {
            return {};
        }

        const durations = history
            .map((record) => Number(getRecordValue(record, "duration")))
            .filter((duration) => Number.isFinite(duration));
        if (durations.length === 0) {
            return {
                averageDuration: 0,
                lastOperation: history.at(-1),
                maxDuration: 0,
                minDuration: 0,
                recentOperations: history.slice(-10),
                totalOperations: history.length,
            };
        }

        const averageDuration =
            durations.reduce((sum, duration) => sum + duration, 0) /
            durations.length;

        return {
            averageDuration,
            lastOperation: history.at(-1),
            maxDuration: Math.max(...durations),
            minDuration: Math.min(...durations),
            recentOperations: history.slice(-10),
            totalOperations: history.length,
        };
    },

    /**
     * Start performance tracking for a chart operation.
     *
     * @param operation - Operation name.
     *
     * @returns Performance tracking ID.
     */
    startTracking(operation: string): string {
        const startTime =
            renderChartPerformanceMonitorRuntime().nowPerformance();
        const trackingId = `chart-${operation}-${renderChartPerformanceMonitorRuntime().dateNow()}`;

        updateRendererChartPerformanceTracking(
            trackingId,
            {
                operation,
                startTime,
                status: "running",
            },
            { source: "chartPerformanceMonitor.startTracking" }
        );

        return trackingId;
    },
};
