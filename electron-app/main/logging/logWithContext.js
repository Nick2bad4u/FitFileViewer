/**
 * Logs a message from the main process with optional structured context for easier debugging.
 * The implementation mirrors the behaviour that previously lived in main.js so existing log
 * expectations in tests remain unchanged.
 *
 * @param {"info"|"warn"|"error"|string} level - Console method to invoke.
 * @param {string} message - Message to log.
 * @param {Record<string, unknown>} [context={}] - Optional context payload serialized to JSON.
 */
function logWithContext(level, message, context = {}) {
    const hasContext = context && typeof context === "object" && Object.keys(context).length > 0;
    const timestamp = new Date().toISOString();
    if (hasContext) {
        /** @type {any} */ (console)[level](`[${timestamp}] [main.js] ${message}`, JSON.stringify(context));
    } else {
        /** @type {any} */ (console)[level](`[${timestamp}] [main.js] ${message}`);
    }
}

module.exports = { logWithContext };
