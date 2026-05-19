/**
 * Timer data captured for one measured operation.
 */
export type PerformanceTimer = {
    duration: number | null;
    end: number | null;
    start: number;
};

/**
 * Tracks operation timings when performance monitoring is enabled.
 */
export class PerformanceMonitor {
    private enabled =
        process.env["NODE_ENV"] === "development" ||
        process.env["PERFORMANCE_MONITORING"] === "true";

    private readonly timers = new Map<string, PerformanceTimer>();

    /**
     * Clear all tracked timers.
     */
    clearTimers(): void {
        this.timers.clear();
    }

    /**
     * End a performance timer and return its duration in milliseconds.
     */
    endTimer(operationId: string): number | null {
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
    getAllTimers(): Map<string, PerformanceTimer> {
        return new Map(this.timers);
    }

    /**
     * Return timer information for an operation.
     */
    getTimer(operationId: string): PerformanceTimer | null {
        return this.timers.get(operationId) ?? null;
    }

    /**
     * Check whether performance monitoring is enabled.
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Enable or disable performance monitoring.
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Start a performance timer for an operation.
     */
    startTimer(operationId: string): void {
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
