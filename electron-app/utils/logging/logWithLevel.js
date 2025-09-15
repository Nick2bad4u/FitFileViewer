/**
 * Typed logging helper to avoid dynamic console[level] index signature errors
 * Provides consistent formatting and optional context object.
 *
 * @typedef {'log'|'info'|'warn'|'error'} LogLevel
 * @param {LogLevel} level
 * @param {string} message
 * @param {Record<string, any>} [context]
 */
export function logWithLevel(level, message, context) {
    try {
        const timestamp = new Date().toISOString(),
         prefix = `[FFV]`,
         base = `${timestamp} ${prefix} ${String(message)}`;
        // Only treat context as an object if it's a plain object
        const isObject = context != null && typeof context === 'object' && !Array.isArray(context);
        /** @type {any} */
        let payload = undefined;
        if (isObject) {
            // Shallow clone without relying on Object.keys/Object.entries to avoid tests that mock them.
            // Also guard against getters that may throw during property access.
            /** @type {Record<string, any>} */
            const clone = {};
            let hasAny = false;
            // Prefer for..in with hasOwnProperty to enumerate own-enumerable keys
            // while avoiding reliance on global Object methods that tests may mock to throw.
            for (const k in /** @type {Record<string, any>} */ (context)) {
                if (Object.prototype.hasOwnProperty.call(/** @type {any} */ (context), k)) {
                    try {
                        clone[k] = /** @type {any} */ (context)[k];
                        hasAny = true;
                    } catch {
                        // Skip keys that throw on access
                    }
                }
            }
            payload = hasAny ? clone : undefined;
        }

        switch (level) {
            case "info":
                payload ? console.info(base, payload) : console.info(base);
                break;
            case "warn":
                payload ? console.warn(base, payload) : console.warn(base);
                break;
            case "error":
                payload ? console.error(base, payload) : console.error(base);
                break;
            default:
                payload ? console.log(base, payload) : console.log(base);
        }
    } catch {
        // Fallback minimal logging if something unexpected occurs
        console.log("[FFV][logWithLevel] Logging failure");
    }
}
