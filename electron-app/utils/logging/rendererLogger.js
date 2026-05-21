/**
 * Creates a scoped renderer logger that mirrors the main-process logWithContext
 * helper while providing a renderer-specific prefix.
 *
 * @param scope - Human-readable scope label.
 *
 * @returns Logger function that accepts level, message, and optional context.
 */
export function createRendererLogger(scope) {
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
export function logWithRendererContext(level, message, context = {}) {
    const hasContext =
        context &&
        typeof context === "object" &&
        Object.keys(context).length > 0;
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [renderer]`;
    const logger = console[level];
    if (hasContext) {
        logger(`${prefix} ${message}`, JSON.stringify(context));
    } else {
        logger(`${prefix} ${message}`);
    }
}
