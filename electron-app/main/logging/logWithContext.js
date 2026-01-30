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
function logWithContext(level, message, context = {}) {
    const hasContext =
        context &&
        typeof context === "object" &&
        Object.keys(context).length > 0;
    const timestamp = new Date().toISOString();

    /**
     * Pick a console method defensively.
     *
     * @param {string} lvl
     *
     * @returns {(msg: string, ...args: any[]) => void}
     */
    const getConsoleMethod = (lvl) => {
        const m = /** @type {any} */ (console)[lvl];
        return typeof m === "function"
            ? m.bind(console)
            : console.log.bind(console);
    };

    /**
     * Decide whether a key should be redacted.
     *
     * NOTE: We intentionally do not redact _all_ keys containing "token"
     * because configuration keys like tokenUrl are not secrets. We do redact
     * actual token values and secrets.
     *
     * @param {string} key
     *
     * @returns {boolean}
     */
    const shouldRedactKey = (key) => {
        const k = String(key).toLowerCase();
        if (k.includes("secret")) return true;
        if (
            k === "authorization" ||
            k === "cookie" ||
            k === "set-cookie" ||
            k.includes("password")
        )
            return true;
        if (k.includes("token") && !k.endsWith("url")) return true;
        return false;
    };

    /**
     * Safe JSON serialization for log contexts.
     *
     * - Redacts secret-ish keys
     * - Expands Error objects to {name,message[,stack]}
     * - Replaces circular refs
     * - Stringifies BigInt
     *
     * @param {Record<string, unknown>} payload
     *
     * @returns {string}
     */
    const safeStringifyContext = (payload) => {
        /** @type {WeakSet<object>} */
        const seen = new WeakSet();

        /** @type {(this: any, key: string, value: any) => any} */
        const replacer = (key, value) => {
            try {
                if (key && shouldRedactKey(key)) return "[REDACTED]";
                if (typeof value === "bigint") return value.toString();
                if (typeof value === "function")
                    return `[Function ${value.name || "anonymous"}]`;

                if (value instanceof Error) {
                    const base = { name: value.name, message: value.message };
                    // Stack traces can be very large; include only in tests for debugging.
                    if (process?.env?.NODE_ENV === "test" && value.stack) {
                        return { ...base, stack: value.stack };
                    }
                    return base;
                }

                if (value && typeof value === "object") {
                    if (seen.has(value)) return "[Circular]";
                    seen.add(value);
                }
            } catch {
                // If the replacer itself fails, avoid breaking logging.
                return "[Unserializable]";
            }
            return value;
        };

        try {
            return JSON.stringify(payload, replacer);
        } catch {
            return '"[Unserializable]"';
        }
    };

    const log = getConsoleMethod(String(level));
    if (hasContext) {
        log(
            `[${timestamp}] [main.js] ${message}`,
            safeStringifyContext(context)
        );
    } else {
        log(`[${timestamp}] [main.js] ${message}`);
    }
}

module.exports = { logWithContext };
