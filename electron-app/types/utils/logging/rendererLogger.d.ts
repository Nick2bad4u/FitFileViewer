/**
 * Creates a scoped renderer logger that mirrors the main-process logWithContext
 * helper while providing a renderer-specific prefix for easier filtering.
 *
 * @param scope - Human-readable scope label.
 *
 * @returns Logger function that accepts level, message, and optional context.
 */
export function createRendererLogger(scope: string): RendererLogger;
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
    context?: Record<string, unknown>
): void;
/** Valid console levels supported by the renderer logger. */
export type RendererLogLevel = "log" | "info" | "warn" | "error" | "debug";
/** Renderer logger function signature. */
export type RendererLogger = (
    level: RendererLogLevel,
    message: string,
    context?: Record<string, unknown>
) => void;
