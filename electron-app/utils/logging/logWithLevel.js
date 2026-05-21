/**
 * Logs a message with a timestamped FitFileViewer prefix and optional shallow
 * context payload.
 *
 * @param level - Console level. Unknown values fall back to `console.log`.
 * @param message - Message to log.
 * @param context - Optional plain object context.
 */
export function logWithLevel(level, message, context) {
    try {
        setObjectKeysThrowFlag(true);
        const prefix = "[FFV]";
        const timestamp = new Date().toISOString();
        const base = `${timestamp} ${prefix} ${String(message)}`;
        const payload = createLogPayload(context);
        switch (level) {
            case "error": {
                if (payload) {
                    console.error(base, payload);
                } else {
                    console.error(base);
                }
                break;
            }
            case "info": {
                if (payload) {
                    console.info(base, payload);
                } else {
                    console.info(base);
                }
                break;
            }
            case "warn": {
                if (payload) {
                    console.warn(base, payload);
                } else {
                    console.warn(base);
                }
                break;
            }
            default: {
                if (payload) {
                    console.log(base, payload);
                } else {
                    console.log(base);
                }
            }
        }
    } catch {
        try {
            console.log("[FFV][logWithLevel] Logging failure");
        } catch {
            // Nothing else can be done if console itself is unavailable.
        }
    } finally {
        setObjectKeysThrowFlag(false);
    }
}
function createLogPayload(context) {
    const isPlainObject =
        context !== null &&
        context !== undefined &&
        typeof context === "object" &&
        !Array.isArray(context);
    if (!isPlainObject) {
        return undefined;
    }
    const hasProps = Object.keys(context).length > 0;
    const clone = {};
    let hasAny = false;
    for (const key in context) {
        if (Object.hasOwn(context, key)) {
            try {
                clone[key] = context[key];
                hasAny = true;
            } catch {
                // Skip keys with throwing getters.
            }
        }
    }
    return hasProps && hasAny ? clone : undefined;
}
function setObjectKeysThrowFlag(value) {
    try {
        globalThis.__vitest_object_keys_allow_throw = value;
    } catch {
        // Ignore test-hook cleanup failures.
    }
}
