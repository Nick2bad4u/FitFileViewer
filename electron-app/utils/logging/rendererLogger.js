/**
 * Renderer logging helper that mirrors the main-process logWithContext helper
 * while providing a renderer-specific prefix for easier filtering.
 */

/**
 * Valid console levels supported by the renderer logger.
 * @typedef {"log"|"info"|"warn"|"error"|"debug"} RendererLogLevel
 */

/**
 * Logs a message from the renderer with optional structured context.
 * The implementation mirrors the main process helper so tooling can
 * key off the same argument order.
 *
 * @param {RendererLogLevel} level - Console method to invoke.
 * @param {string} message - Message to log.
 * @param {Record<string, unknown>} [context={}] - Optional context payload.
 */
export function createRendererLogger(scope) {
    const scopedPrefix = scope ? `${scope}:` : "";
    return (level, message, context = {}) => {
        logWithRendererContext(level, `${scopedPrefix} ${message}`.trim(), context);
    };
}

export function logWithRendererContext(level, message, context = {}) {
    const hasContext = context && typeof context === "object" && Object.keys(context).length > 0;
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [renderer]`;

    if (hasContext) {
        /** @type {any} */ (console)[level](`${prefix} ${message}`, JSON.stringify(context));
    } else {
        /** @type {any} */ (console)[level](`${prefix} ${message}`);
    }
}
