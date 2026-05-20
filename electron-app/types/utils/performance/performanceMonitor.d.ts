/** Timer data captured for one measured operation. */
export type PerformanceTimer = {
    duration: number | null;
    end: number | null;
    start: number;
};

/** Tracks operation timings when performance monitoring is enabled. */
export class PerformanceMonitor {
    /** Clear all tracked timers. */
    clearTimers(): void;

    /** End a performance timer and return its duration in milliseconds. */
    endTimer(operationId: string): number | null;

    /** Return a snapshot of all timer data. */
    getAllTimers(): Map<string, PerformanceTimer>;

    /** Return timer information for an operation. */
    getTimer(operationId: string): PerformanceTimer | null;

    /** Check whether performance monitoring is enabled. */
    isEnabled(): boolean;

    /** Enable or disable performance monitoring. */
    setEnabled(enabled: boolean): void;

    /** Start a performance timer for an operation. */
    startTimer(operationId: string): void;
}

/** Shared performance monitor singleton. */
export const performanceMonitor: PerformanceMonitor;
