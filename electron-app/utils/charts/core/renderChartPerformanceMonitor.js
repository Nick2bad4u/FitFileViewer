import {
    getState,
    setState,
    updateState,
} from "../../state/core/stateManager.js";
import { getRecordValue, isObjectRecord } from "./renderChartModuleHelpers.js";
function getPerformanceHistory() {
    const history = getState("performance.chartHistory");
    return Array.isArray(history) ? history : [];
}
function isPerformanceTrackingRecord(value) {
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
    endTracking(trackingId, additionalData = {}) {
        const trackingData = getState(`performance.tracking.${trackingId}`);
        if (!isPerformanceTrackingRecord(trackingData)) {
            return;
        }
        const endTime = performance.now();
        const duration = endTime - trackingData.startTime;
        const performanceRecord = {
            ...trackingData,
            ...additionalData,
            duration,
            endTime,
            status: "completed",
        };
        updateState(
            "performance.tracking",
            {
                [trackingId]: performanceRecord,
            },
            { merge: true, source: "chartPerformanceMonitor.endTracking" }
        );
        const history = getPerformanceHistory();
        history.push(performanceRecord);
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
        setState("performance.chartHistory", history, {
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
    getSummary() {
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
    startTracking(operation) {
        const startTime = performance.now();
        const trackingId = `chart-${operation}-${Date.now()}`;
        updateState(
            "performance.tracking",
            {
                [trackingId]: {
                    operation,
                    startTime,
                    status: "running",
                },
            },
            { merge: true, source: "chartPerformanceMonitor.startTracking" }
        );
        return trackingId;
    },
};
