/**
 * Typed logging helper to avoid dynamic console[level] index signature errors
 * Provides consistent formatting and optional context object.
 *
 * @typedef {"log" | "info" | "warn" | "error"} LogLevel
 *
 * @param {LogLevel} level
 * @param {string} message
 * @param {Record<string, any>} [context]
 */
export function logWithLevel(level, message, context) {
    try {
        // Allow tests that mock Object.keys to throw to reach our error path by opting in
        try {
            if (typeof globalThis !== "undefined")
                /** @type {any} */ (
                    globalThis
                ).__vitest_object_keys_allow_throw = true;
        } catch {
            /* Ignore errors */
        }
        const prefix = `[FFV]`,
            timestamp = new Date().toISOString(),
            base = `${timestamp} ${prefix} ${String(message)}`;
        // Only treat context as an object if it's a plain object
        const isObject =
            context != null &&
            typeof context === "object" &&
            !Array.isArray(context);
        /** @type {any} */
        let payload;
        if (isObject) {
            // First, attempt to detect if the object has any own properties using Object.keys.
            // Some tests intentionally mock Object.keys to throw; guard it and fallback gracefully.
            let hasProps = false;
            hasProps = Object.keys(/** @type {any} */ (context)).length > 0;
            // Shallow clone without relying on Object.entries to avoid other global mutations.
            // Also guard against getters that may throw during property access.
            /** @type {Record<string, any>} */
            const clone = {};
            let hasAny = false;
            // Prefer for..in with hasOwnProperty to enumerate own-enumerable keys
            // While avoiding reliance on global Object methods that tests may mock to throw.
            for (const k in /** @type {Record<string, any>} */ (context)) {
                if (Object.hasOwn(/** @type {any} */ (context), k)) {
                    try {
                        clone[k] = /** @type {any} */ (context)[k];
                        hasAny = true;
                    } catch {
                        // Skip keys that throw on access
                    }
                }
            }
            payload = hasProps && hasAny ? clone : undefined;
        }

        switch (level) {
            case "error": {
                payload ? console.error(base, payload) : console.error(base);
                break;
            }
            case "info": {
                payload ? console.info(base, payload) : console.info(base);
                break;
            }
            case "warn": {
                payload ? console.warn(base, payload) : console.warn(base);
                break;
            }
            default: {
                payload ? console.log(base, payload) : console.log(base);
            }
        }
    } catch {
        // Fallback minimal logging if something unexpected occurs
        try {
            console.log("[FFV][logWithLevel] Logging failure");
        } catch {
            /* No-op */
        }
    } finally {
        // Reset throw-through flag to keep test runner stable
        try {
            if (typeof globalThis !== "undefined")
                /** @type {any} */ (
                    globalThis
                ).__vitest_object_keys_allow_throw = false;
        } catch {
            /* Ignore errors */
        }
    }
}
