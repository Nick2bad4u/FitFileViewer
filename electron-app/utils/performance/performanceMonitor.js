/**
 * Tracks operation timings when performance monitoring is enabled.
 */
export class PerformanceMonitor {
    enabled =
        process.env["NODE_ENV"] === "development" ||
        process.env["PERFORMANCE_MONITORING"] === "true";
    timers = new Map();
    /**
     * Clear all tracked timers.
     */
    clearTimers() {
        this.timers.clear();
    }
    /**
     * End a performance timer and return its duration in milliseconds.
     */
    endTimer(operationId) {
        if (!this.enabled) {
            return null;
        }
        const timer = this.timers.get(operationId);
        if (timer === undefined) {
            console.warn(`No timer found for operation: ${operationId}`);
            return null;
        }
        timer.end = performance.now();
        timer.duration = timer.end - timer.start;
        console.log(
            `[Performance] ${operationId}: ${timer.duration.toFixed(2)}ms`
        );
        return timer.duration;
    }
    /**
     * Return a snapshot of all timer data.
     */
    getAllTimers() {
        return new Map(this.timers);
    }
    /**
     * Return timer information for an operation.
     */
    getTimer(operationId) {
        return this.timers.get(operationId) ?? null;
    }
    /**
     * Check whether performance monitoring is enabled.
     */
    isEnabled() {
        return this.enabled;
    }
    /**
     * Enable or disable performance monitoring.
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Start a performance timer for an operation.
     */
    startTimer(operationId) {
        if (!this.enabled) {
            return;
        }
        this.timers.set(operationId, {
            duration: null,
            end: null,
            start: performance.now(),
        });
    }
}
/**
 * Shared performance monitor singleton.
 */
export const performanceMonitor = new PerformanceMonitor();
