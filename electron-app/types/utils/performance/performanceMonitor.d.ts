export const performanceMonitor: PerformanceMonitor;
/**
 * Performance monitoring utility for tracking operation timing
 * Used to monitor performance of various application operations
 */
declare class PerformanceMonitor {
    timers: Map<any, any>;
    enabled: boolean;
    /**
     * Clear all timers
     */
    clearTimers(): void;
    /**
     * End a performance timer and calculate duration
     * @param {string} operationId - The operation identifier
     * @returns {number|null} Duration in milliseconds, or null if not enabled
     */
    endTimer(operationId: string): number | null;
    /**
     * Get all timer data
     * @returns {Map} All timer data
     */
    getAllTimers(): Map<any, any>;
    /**
     * Get timer information for an operation
     * @param {string} operationId - The operation identifier
     * @returns {object|null} Timer data or null if not found
     */
    getTimer(operationId: string): object | null;
    /**
     * Check if performance monitoring is enabled
     * @returns {boolean} Whether monitoring is enabled
     */
    isEnabled(): boolean;
    /**
     * Enable or disable monitoring
     * @param {boolean} enabled - Whether to enable monitoring
     */
    setEnabled(enabled: boolean): void;
    /**
     * Start a performance timer for an operation
     * @param {string} operationId - Unique identifier for the operation
     */
    startTimer(operationId: string): void;
}
export {};
