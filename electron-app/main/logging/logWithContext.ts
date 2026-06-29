/**
 * Logs a message from the main process with optional structured context for
 * easier debugging. The implementation mirrors the behaviour that previously
 * lived in main.js so existing log expectations in tests remain unchanged.
 */
import { loggingTimestampRuntime } from "../../utils/logging/loggingTimestampRuntime.js";
import {
    getLogWithContextRuntime,
    type LogWithContextRuntime,
} from "./logWithContextRuntime.js";

type ConsoleMethod = (
    message?: unknown,
    ...optionalParameters: readonly unknown[]
) => void;

type LogContext = Record<string, unknown>;

const logWithContextRuntime = (): LogWithContextRuntime =>
    getLogWithContextRuntime();

const getNodeEnvironment = (): string | undefined =>
    logWithContextRuntime().getProcessEnvironmentValue("NODE_ENV");

const isConsoleMethod = (value: unknown): value is ConsoleMethod =>
    typeof value === "function";

const wrapConsoleMethod =
    (method: ConsoleMethod): ConsoleMethod =>
    (message?: unknown, ...args: readonly unknown[]): void => {
        method(message, ...args);
    };

const getConsoleMethod = (level: string): ConsoleMethod => {
    const method =
        level === "debug"
            ? console.debug
            : level === "error"
              ? console.error
              : level === "info"
                ? console.info
                : level === "log"
                  ? console.log
                  : level === "trace"
                    ? console.trace
                    : level === "warn"
                      ? console.warn
                      : console.log;

    if (isConsoleMethod(method)) {
        return wrapConsoleMethod(method);
    }

    return wrapConsoleMethod(console.log);
};

const shouldRedactKey = (key: string): boolean => {
    const normalizedKey = key.toLowerCase();

    if (normalizedKey.includes("secret")) {
        return true;
    }

    if (
        normalizedKey === "authorization" ||
        normalizedKey === "cookie" ||
        normalizedKey === "set-cookie" ||
        normalizedKey.includes("password")
    ) {
        return true;
    }

    return normalizedKey.includes("token") && !normalizedKey.endsWith("url");
};

const normalizeLogValue = (
    key: string,
    seen: WeakSet<object>,
    value: unknown
): unknown => {
    try {
        if (key.length > 0 && shouldRedactKey(key)) {
            return "[REDACTED]";
        }

        if (typeof value === "bigint") {
            return value.toString();
        }

        if (typeof value === "function") {
            return `[Function ${value.name || "anonymous"}]`;
        }

        if (value instanceof Error) {
            const base = { message: value.message, name: value.name };

            if (getNodeEnvironment() === "test" && value.stack) {
                return { ...base, stack: value.stack };
            }

            return base;
        }

        if (value && typeof value === "object") {
            if (seen.has(value)) {
                return "[Circular]";
            }

            seen.add(value);
        }
    } catch {
        return "[Unserializable]";
    }

    return value;
};

const safeStringifyContext = (payload: LogContext): string => {
    const seen = new WeakSet<object>();

    try {
        return JSON.stringify(payload, (key, value: unknown) =>
            normalizeLogValue(key, seen, value)
        );
    } catch {
        return '"[Unserializable]"';
    }
};

export function logWithContext(
    level: string,
    message: string,
    context: LogContext = {}
): void {
    const timestamp = loggingTimestampRuntime().isoNow();
    const log = getConsoleMethod(level);

    if (Object.keys(context).length > 0) {
        log(
            `[${timestamp}] [main.js] ${message}`,
            safeStringifyContext(context)
        );

        return;
    }

    log(`[${timestamp}] [main.js] ${message}`);
}
