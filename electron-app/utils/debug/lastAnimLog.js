/**
 * @fileoverview Throttled animation logging utility for development debugging
 * Part of the FitFileViewer Electron application utilities
 *
 * This module provides a throttled logging function specifically designed for
 * animation frame logging to prevent console flooding during development.
 *
 * @author FitFileViewer
 * @version 1.0.0
 */

/**
 * Logs animation progress messages to the console at most once every 500ms to prevent log flooding.
 * Intended for development/debug logging only—automatically disabled in production builds.
 *
 * This utility uses a closure to maintain state and throttle log messages, which is particularly
 * useful for high-frequency events like animation frames or scroll handlers.
 *
 * @param {string} message - The message to log to the console
 * @returns {void}
 *
 * @example
 * // Log animation frame updates (throttled to max once per 500ms)
 * throttledAnimLog('Animation frame updated: frame 1234');
 * throttledAnimLog('Chart rendering progress: 45%');
 *
 * @example
 * // Use in animation loops
 * function animateChart() {
 *     throttledAnimLog(`Chart animation progress: ${progress}%`);
 *     // ... animation logic
 *     requestAnimationFrame(animateChart);
 * }
 *
 * @internal
 * @since 1.0.0
 */
export const throttledAnimLog = (() => {
    let lastAnimLogTimestamp = 0;
    const THROTTLE_INTERVAL_MS = 500;

    /** @param {any} message */
    return function (message) {
        // Skip logging in production or if console is not available
        if (typeof console === "undefined" || !console.log) {
            return;
        }

        // Additional development mode check
        const isDevelopment =
            (typeof window !== "undefined" && /** @type {any} */ (window).__renderer_dev) ||
            process?.env?.NODE_ENV === "development";

        if (!isDevelopment) {
            return;
        }
        try {
            const now = Date.now();
            if (now - lastAnimLogTimestamp > THROTTLE_INTERVAL_MS) {
                console.log(`[AnimDebug] ${message}`);
                lastAnimLogTimestamp = now;
            }
        } catch {
            // Silently fail if logging encounters an error
            // Don't use console.error to avoid potential recursion
        }
    };
})();

/**
 * Alternative logging function for critical animation events that should always be logged
 * even if throttling is active. Use sparingly to avoid console flooding.
 *
 * @param {string} message - The critical message to log immediately
 * @returns {void}
 *
 * @example
 * criticalAnimLog('Animation failed: unable to render chart');
 * criticalAnimLog('Animation completed successfully');
 *
 * @internal
 * @since 1.0.0
 */
export const criticalAnimLog = (message) => {
    // Skip logging in production or if console is not available
    if (typeof console === "undefined" || !console.log) {
        return;
    }

    const isDevelopment =
        (typeof window !== "undefined" && /** @type {any} */ (window).__renderer_dev) ||
        process?.env?.NODE_ENV === "development";

    if (!isDevelopment) {
        return;
    }
    try {
        console.log(`[AnimCritical] ${message}`);
    } catch {
        // Silently fail if logging encounters an error
    }
};

/**
 * Performance-aware animation logger that includes timing information
 * Logs with high-resolution timestamps for performance analysis
 *
 * @param {string} message - The message to log with timing information
 * @param {number} [startTime] - Optional start time for duration calculation
 * @returns {void}
 *
 * @example
 * const start = performance.now();
 * // ... animation work
 * perfAnimLog('Chart render completed', start);
 *
 * @internal
 * @since 1.0.0
 */
export const perfAnimLog = (() => {
    let lastPerfLogTimestamp = 0;
    const THROTTLE_INTERVAL_MS = 1000; // Less frequent for performance logs

    /**
     * @param {any} message
     * @param {any} startTime
     */
    return function (message, startTime) {
        // Skip logging in production or if console is not available
        if (typeof console === "undefined" || !console.log) {
            return;
        }

        const isDevelopment =
            (typeof window !== "undefined" && /** @type {any} */ (window).__renderer_dev) ||
            process?.env?.NODE_ENV === "development";

        if (!isDevelopment) {
            return;
        }

        try {
            const now = performance.now();
            if (now - lastPerfLogTimestamp > THROTTLE_INTERVAL_MS) {
                const duration = startTime ? ` (${(now - startTime).toFixed(2)}ms)` : "";
                console.log(`[AnimPerf@${now.toFixed(2)}ms] ${message}${duration}`);
                lastPerfLogTimestamp = now;
            }
        } catch {
            // Silently fail if logging encounters an error
        }
    };
})();
