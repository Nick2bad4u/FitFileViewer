"use strict";
/**
 * Logs a message from the main process with optional structured context for
 * easier debugging. The implementation mirrors the behaviour that previously
 * lived in main.js so existing log expectations in tests remain unchanged.
 */
{
    const getNodeEnvironment = () => globalThis.process?.env?.["NODE_ENV"];
    const isConsoleMethod = (value) => typeof value === "function";
    const getConsoleMethod = (level) => {
        const method = Reflect.get(console, level);
        if (isConsoleMethod(method)) {
            const boundMethod = method.bind(console);
            return (message, ...args) => {
                boundMethod(message, ...args);
            };
        }
        const fallback = console.log.bind(console);
        return (message, ...args) => {
            fallback(message, ...args);
        };
    };
    const shouldRedactKey = (key) => {
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
        return (
            normalizedKey.includes("token") && !normalizedKey.endsWith("url")
        );
    };
    const normalizeLogValue = (key, seen, value) => {
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
    const safeStringifyContext = (payload) => {
        const seen = new WeakSet();
        try {
            return JSON.stringify(payload, (key, value) =>
                normalizeLogValue(key, seen, value)
            );
        } catch {
            return '"[Unserializable]"';
        }
    };
    function logWithContext(level, message, context = {}) {
        const timestamp = new Date().toISOString();
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
    module.exports = { logWithContext };
}
