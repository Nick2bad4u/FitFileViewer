/**
 * Logs a message with a FitFileViewer prefix and optional context.
 *
 * @param level - Console level. Unknown strings fall back to `console.log`.
 * @param message - Message to log.
 * @param context - Optional plain object context.
 */
export function logWithLevel(
    level: LogLevel | string,
    message: string,
    context?: null | Record<string, unknown>
): void;
/** Console levels supported by the structured logger. */
export type LogLevel = "log" | "info" | "warn" | "error";
