type PreloadConsole = import("./preloadModuleTypes").PreloadConsole;
type PreloadLog = import("./preloadModuleTypes").PreloadLog;

export function createPreloadLogger(
    consoleRef: PreloadConsole | undefined = console
): PreloadLog {
    return (level, message, ...details) => {
        if (!isPreloadObjectRecord(consoleRef)) {
            return;
        }

        const methodName = level === "info" ? "log" : level;
        const method = Reflect.get(consoleRef, methodName);
        if (typeof method !== "function") {
            return;
        }

        method.call(consoleRef, message, ...details);
    };
}

function isPreloadObjectRecord(
    value: unknown
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
