/**
 * Renderer logging helper that mirrors the main-process logWithContext helper
 * while providing a renderer-specific prefix for easier filtering.
 */
/**
 * Valid console levels supported by the renderer logger.
 *
 * @typedef {"log" | "info" | "warn" | "error" | "debug"} RendererLogLevel
 */
/**
 * Renderer logger function signature.
 *
 * @typedef {(
 *     level: RendererLogLevel,
 *     message: string,
 *     context?: Record<string, unknown>
 * ) => void} RendererLogger
 */
/**
 * Creates a scoped renderer logger that mirrors the main-process logWithContext
 * helper while providing a renderer-specific prefix for easier filtering.
 *
 * @param {string} scope - Human-readable scope label (e.g. component or module
 *   name).
 *
 * @returns {RendererLogger} Logger function that accepts level, message, and
 *   optional context.
 */
export function createRendererLogger(scope: string): RendererLogger;
export function logWithRendererContext(
    level: any,
    message: any,
    context?: {}
): void;
/**
 * Valid console levels supported by the renderer logger.
 */
export type RendererLogLevel = "log" | "info" | "warn" | "error" | "debug";
/**
 * Renderer logger function signature.
 */
export type RendererLogger = (
    level: RendererLogLevel,
    message: string,
    context?: Record<string, unknown>
) => void;
