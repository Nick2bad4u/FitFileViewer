/**
 * Renderer logging helper that mirrors the main-process logWithContext helper
 * while providing a renderer-specific prefix for easier filtering.
 */

/**
 * Valid console levels supported by the renderer logger.
 * @typedef {"log"|"info"|"warn"|"error"|"debug"} RendererLogLevel
 */

/**
 * Renderer logger function signature.
 *
 * @typedef {(level: RendererLogLevel, message: string, context?: Record<string, unknown>) => void} RendererLogger
 */

/**
 * Creates a scoped renderer logger that mirrors the main-process logWithContext
 * helper while providing a renderer-specific prefix for easier filtering.
 *
 * @param {string} scope - Human-readable scope label (e.g. component or module name).
 * @returns {RendererLogger} Logger function that accepts level, message, and optional context.
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
