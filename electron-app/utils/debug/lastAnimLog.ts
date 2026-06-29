/**
 * Throttled animation logging utilities for renderer development debugging.
 */

import {
    getLastAnimLogRuntime,
    type LastAnimLogRuntime,
} from "./lastAnimLogRuntime.js";
import { isRendererDebugLoggingEnabled } from "./rendererDebugLoggingState.js";
import {
    getRendererDebugRuntime,
    type RendererDebugRuntime,
} from "./rendererDebugRuntime.js";

interface AnimationDebugConsole {
    log: (...args: unknown[]) => void;
}

export interface AnimationDebugLogger {
    readonly criticalAnimLog: (message: string) => void;
    readonly perfAnimLog: (message: string, startTime?: number) => void;
    readonly throttledAnimLog: (message: string) => void;
}

export interface AnimationDebugLoggerRuntime {
    readonly getConsole: () => AnimationDebugConsole | undefined;
    readonly getLastAnimLogRuntime: () => LastAnimLogRuntime;
    readonly getRendererDebugRuntime: () => RendererDebugRuntime;
    readonly isDevelopmentEnvironment: () => boolean;
    readonly isRendererDebugLoggingEnabled: () => boolean;
}

type AnimationDebugLoggerOptions = Partial<AnimationDebugLoggerRuntime>;

const defaultAnimationDebugLoggerRuntime: AnimationDebugLoggerRuntime = {
    getConsole: () => console,
    getLastAnimLogRuntime,
    getRendererDebugRuntime,
    isDevelopmentEnvironment: () =>
        getLastAnimLogRuntime().isDevelopmentEnvironment(),
    isRendererDebugLoggingEnabled,
};

function resolveAnimationDebugLoggerRuntime(
    runtime: AnimationDebugLoggerOptions
): AnimationDebugLoggerRuntime {
    const getLastAnimLogRuntimeProvider =
        runtime.getLastAnimLogRuntime ??
        defaultAnimationDebugLoggerRuntime.getLastAnimLogRuntime;

    return {
        getConsole:
            runtime.getConsole ?? defaultAnimationDebugLoggerRuntime.getConsole,
        getLastAnimLogRuntime: getLastAnimLogRuntimeProvider,
        getRendererDebugRuntime:
            runtime.getRendererDebugRuntime ??
            defaultAnimationDebugLoggerRuntime.getRendererDebugRuntime,
        isDevelopmentEnvironment:
            runtime.isDevelopmentEnvironment ??
            (() =>
                getLastAnimLogRuntimeProvider().isDevelopmentEnvironment()),
        isRendererDebugLoggingEnabled:
            runtime.isRendererDebugLoggingEnabled ??
            defaultAnimationDebugLoggerRuntime.isRendererDebugLoggingEnabled,
    };
}

/**
 * Checks whether renderer animation debug logging should be enabled.
 *
 * @returns True when development logging is enabled.
 */
function isDevelopmentMode(
    runtime: AnimationDebugLoggerRuntime
): boolean {
    return (
        runtime
            .getRendererDebugRuntime()
            .isRendererDebugLoggingAvailable(
                runtime.isRendererDebugLoggingEnabled()
            ) || runtime.isDevelopmentEnvironment()
    );
}

/**
 * Creates throttled animation debug loggers with explicit runtime providers.
 *
 * @param options - Optional runtime provider overrides.
 *
 * @returns Animation debug logger functions.
 */
export function createAnimationDebugLogger(
    options: AnimationDebugLoggerOptions = {}
): AnimationDebugLogger {
    const runtime = resolveAnimationDebugLoggerRuntime(options);
    let lastAnimLogTimestamp = 0;
    let lastPerfLogTimestamp = 0;
    const PERFORMANCE_THROTTLE_INTERVAL_MS = 1000,
        THROTTLE_INTERVAL_MS = 500;

    return {
        criticalAnimLog(message): void {
            const consoleRef = runtime.getConsole();
            if (typeof consoleRef?.log !== "function") {
                return;
            }

            if (!isDevelopmentMode(runtime)) {
                return;
            }
            try {
                consoleRef.log(`[AnimCritical] ${message}`);
            } catch {
                // Silently fail if logging encounters an error
            }
        },

        perfAnimLog(message, startTime): void {
            const consoleRef = runtime.getConsole();
            if (typeof consoleRef?.log !== "function") {
                return;
            }

            if (!isDevelopmentMode(runtime)) {
                return;
            }

            try {
                const now = runtime.getLastAnimLogRuntime().performanceNow();
                if (
                    now - lastPerfLogTimestamp >
                    PERFORMANCE_THROTTLE_INTERVAL_MS
                ) {
                    const duration = startTime
                        ? ` (${(now - startTime).toFixed(2)}ms)`
                        : "";
                    consoleRef.log(
                        `[AnimPerf@${now.toFixed(2)}ms] ${message}${duration}`
                    );
                    lastPerfLogTimestamp = now;
                }
            } catch {
                // Silently fail if logging encounters an error
            }
        },

        throttledAnimLog(message): void {
            const consoleRef = runtime.getConsole();
            if (typeof consoleRef?.log !== "function") {
                return;
            }

            if (!isDevelopmentMode(runtime)) {
                return;
            }
            try {
                const now = runtime.getLastAnimLogRuntime().dateNow();
                if (now - lastAnimLogTimestamp > THROTTLE_INTERVAL_MS) {
                    consoleRef.log(`[AnimDebug] ${message}`);
                    lastAnimLogTimestamp = now;
                }
            } catch {
                // Silently fail if logging encounters an error
                // Don't use console.error to avoid potential recursion
            }
        },
    };
}

const defaultAnimationDebugLogger = createAnimationDebugLogger();

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
export const throttledAnimLog = (message: string): void =>
    defaultAnimationDebugLogger.throttledAnimLog(message);

/**
 * Alternative logging function for critical animation events that should always
 * be logged even if throttling is active. Use sparingly to avoid console
 * flooding.
 *
 * @param message - The critical message to log immediately.
 */
export const criticalAnimLog = (message: string): void =>
    defaultAnimationDebugLogger.criticalAnimLog(message);

/**
 * Performance-aware animation logger that includes timing information.
 *
 * @param message - The message to log with timing information.
 * @param startTime - Optional start time for duration calculation.
 */
export const perfAnimLog = (message: string, startTime?: number): void =>
    defaultAnimationDebugLogger.perfAnimLog(message, startTime);
