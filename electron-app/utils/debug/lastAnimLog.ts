/**
 * Throttled animation logging utilities for renderer development debugging.
 */

import { isDevelopmentEnvironment } from "../runtime/processEnvironment.js";
import { getLastAnimLogRuntime } from "./lastAnimLogRuntime.js";
import { isRendererDebugLoggingEnabled } from "./rendererDebugLoggingState.js";
import { getRendererDebugRuntime } from "./rendererDebugRuntime.js";

const lastAnimLogRuntime = getLastAnimLogRuntime();
const rendererDebugRuntime = getRendererDebugRuntime();

/**
 * Checks whether renderer animation debug logging should be enabled.
 *
 * @returns True when development logging is enabled.
 */
function isDevelopmentMode(): boolean {
    return (
        rendererDebugRuntime.isRendererDebugLoggingAvailable(
            isRendererDebugLoggingEnabled()
        ) ||
        isDevelopmentEnvironment()
    );
}

/**
 * Logs animation progress messages to the console at most once every 500ms to
 * prevent log flooding. Intended for development/debug logging only, and
 * disabled in production builds.
 *
 * This utility uses a closure to maintain state and throttle log messages,
 * which is particularly useful for high-frequency events like animation frames
 * or scroll handlers.
 *
 * @param message - The message to log to the console.
 */
export const throttledAnimLog = (() => {
    let lastAnimLogTimestamp = 0;
    const THROTTLE_INTERVAL_MS = 500;

    return function throttledAnimationLog(message: string): void {
        // Skip logging in production or if console is not available
        if (typeof console === "undefined" || !console.log) {
            return;
        }

        if (!isDevelopmentMode()) {
            return;
        }
        try {
            const now = lastAnimLogRuntime.dateNow();
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
 * Alternative logging function for critical animation events that should always
 * be logged even if throttling is active. Use sparingly to avoid console
 * flooding.
 *
 * @param message - The critical message to log immediately.
 */
export const criticalAnimLog = (message: string): void => {
    // Skip logging in production or if console is not available
    if (typeof console === "undefined" || !console.log) {
        return;
    }

    if (!isDevelopmentMode()) {
        return;
    }
    try {
        console.log(`[AnimCritical] ${message}`);
    } catch {
        // Silently fail if logging encounters an error
    }
};

/**
 * Performance-aware animation logger that includes timing information.
 *
 * @param message - The message to log with timing information.
 * @param startTime - Optional start time for duration calculation.
 */
export const perfAnimLog = (() => {
    let lastPerfLogTimestamp = 0;
    const THROTTLE_INTERVAL_MS = 1000; // Less frequent for performance logs

    return function performanceAnimationLog(
        message: string,
        startTime?: number
    ): void {
        // Skip logging in production or if console is not available
        if (typeof console === "undefined" || !console.log) {
            return;
        }

        if (!isDevelopmentMode()) {
            return;
        }

        try {
            const now = lastAnimLogRuntime.performanceNow();
            if (now - lastPerfLogTimestamp > THROTTLE_INTERVAL_MS) {
                const duration = startTime
                    ? ` (${(now - startTime).toFixed(2)}ms)`
                    : "";
                console.log(
                    `[AnimPerf@${now.toFixed(2)}ms] ${message}${duration}`
                );
                lastPerfLogTimestamp = now;
            }
        } catch {
            // Silently fail if logging encounters an error
        }
    };
})();
