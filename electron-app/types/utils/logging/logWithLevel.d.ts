/**
 * Typed logging helper to avoid dynamic console[level] index signature errors
 * Provides consistent formatting and optional context object.
 *
 * @typedef {'log'|'info'|'warn'|'error'} LogLevel
 * @param {LogLevel} level
 * @param {string} message
 * @param {Record<string, any>} [context]
 */
export function logWithLevel(level: LogLevel, message: string, context?: Record<string, any>): void;
/**
 * Typed logging helper to avoid dynamic console[level] index signature errors
 * Provides consistent formatting and optional context object.
 */
export type LogLevel = "log" | "info" | "warn" | "error";
//# sourceMappingURL=logWithLevel.d.ts.map
