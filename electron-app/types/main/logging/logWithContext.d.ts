/**
 * Logs a message from the main process with optional structured context for
 * easier debugging. The implementation mirrors the behaviour that previously
 * lived in main.js so existing log expectations in tests remain unchanged.
 *
 * @param {"info" | "warn" | "error" | string} level - Console method to invoke.
 * @param {string} message - Message to log.
 * @param {Record<string, unknown>} [context={}] - Optional context payload
 *   serialized to JSON. Default is `{}`
 */
export function logWithContext(
    level: "info" | "warn" | "error" | string,
    message: string,
    context?: Record<string, unknown>
): void;
