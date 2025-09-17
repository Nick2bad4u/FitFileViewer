/**
 * Performance monitoring utility for tracking operation timing
 * Used to monitor performance of various application operations
 */

class PerformanceMonitor {
    constructor() {
        this.timers = new Map();
        this.enabled = process.env.NODE_ENV === "development" || process.env.PERFORMANCE_MONITORING === "true";
    }

    /**
     * Check if performance monitoring is enabled
     * @returns {boolean} Whether monitoring is enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Start a performance timer for an operation
     * @param {string} operationId - Unique identifier for the operation
     */
    startTimer(operationId) {
        if (!this.enabled) return;

        this.timers.set(operationId, {
            start: performance.now(),
            end: null,
            duration: null,
        });
    }

    /**
     * End a performance timer and calculate duration
     * @param {string} operationId - The operation identifier
     * @returns {number|null} Duration in milliseconds, or null if not enabled
     */
    endTimer(operationId) {
        if (!this.enabled) return null;

        const timer = this.timers.get(operationId);
        if (!timer) {
            console.warn(`No timer found for operation: ${operationId}`);
            return null;
        }

        timer.end = performance.now();
        timer.duration = timer.end - timer.start;

        console.log(`[Performance] ${operationId}: ${timer.duration.toFixed(2)}ms`);

        return timer.duration;
    }

    /**
     * Get timer information for an operation
     * @param {string} operationId - The operation identifier
     * @returns {object|null} Timer data or null if not found
     */
    getTimer(operationId) {
        return this.timers.get(operationId) || null;
    }

    /**
     * Clear all timers
     */
    clearTimers() {
        this.timers.clear();
    }

    /**
     * Get all timer data
     * @returns {Map} All timer data
     */
    getAllTimers() {
        return new Map(this.timers);
    }

    /**
     * Enable or disable monitoring
     * @param {boolean} enabled - Whether to enable monitoring
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export { performanceMonitor };
