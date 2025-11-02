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
export function createRendererLogger(scope: any): (level: any, message: any, context?: {}) => void;
export function logWithRendererContext(level: any, message: any, context?: {}): void;
/**
 * Valid console levels supported by the renderer logger.
 */
export type RendererLogLevel = "log" | "info" | "warn" | "error" | "debug";
//# sourceMappingURL=rendererLogger.d.ts.map