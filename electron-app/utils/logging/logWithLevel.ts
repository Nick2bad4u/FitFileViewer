import { loggingTimestampRuntime } from "./loggingTimestampRuntime.js";

/**
 * Console levels supported by the structured logger.
 */
export type LogLevel = "error" | "info" | "log" | "warn";

let objectKeysThrowAllowed = false;

/**
 * Logs a message with a timestamped FitFileViewer prefix and optional shallow
 * context payload.
 *
 * @param level - Console level. Unknown values fall back to `console.log`.
 * @param message - Message to log.
 * @param context - Optional plain object context.
 */
export function logWithLevel(
    level: LogLevel | string,
    message: string,
    context?: Record<string, unknown> | null
): void {
    try {
        setObjectKeysThrowFlag(true);

        const prefix = "[FFV]";
        const timestamp = loggingTimestampRuntime().isoNow();
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

function createLogPayload(
    context?: Record<string, unknown> | null
): Record<string, unknown> | undefined {
    const isPlainObject =
        context !== null &&
        context !== undefined &&
        typeof context === "object" &&
        !Array.isArray(context);

    if (!isPlainObject) {
        return undefined;
    }

    const hasProps = Object.keys(context).length > 0;
    const clone: Record<string, unknown> = {};
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

function setObjectKeysThrowFlag(value: boolean): void {
    objectKeysThrowAllowed = value;
}

export function getObjectKeysThrowAllowedForTests(): boolean {
    return objectKeysThrowAllowed;
}
