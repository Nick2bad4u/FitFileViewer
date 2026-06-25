import { loggingTimestampRuntime } from "./loggingTimestampRuntime.js";

/**
 * Valid console levels supported by the renderer logger.
 */
export type RendererLogLevel = "debug" | "error" | "info" | "log" | "warn";

/**
 * Renderer logger function signature.
 */
export type RendererLogger = (
    level: RendererLogLevel,
    message: string,
    context?: Record<string, unknown>
) => void;

/**
 * Creates a scoped renderer logger that mirrors the main-process logWithContext
 * helper while providing a renderer-specific prefix.
 *
 * @param scope - Human-readable scope label.
 *
 * @returns Logger function that accepts level, message, and optional context.
 */
export function createRendererLogger(scope: string): RendererLogger {
    const scopedPrefix = scope ? `${scope}:` : "";
    return (level, message, context = {}) => {
        logWithRendererContext(
            level,
            `${scopedPrefix} ${message}`.trim(),
            context
        );
    };
}

/**
 * Logs a renderer-scoped message with optional JSON-serialized context.
 *
 * @param level - Console level.
 * @param message - Message to log.
 * @param context - Optional context payload.
 */
export function logWithRendererContext(
    level: RendererLogLevel,
    message: string,
    context: Record<string, unknown> = {}
): void {
    const hasContext =
        context &&
        typeof context === "object" &&
        Object.keys(context).length > 0;
    const timestamp = loggingTimestampRuntime().isoNow();
    const prefix = `[${timestamp}] [renderer]`;

    const logger = console[level];
    if (hasContext) {
        logger(`${prefix} ${message}`, JSON.stringify(context));
    } else {
        logger(`${prefix} ${message}`);
    }
}
