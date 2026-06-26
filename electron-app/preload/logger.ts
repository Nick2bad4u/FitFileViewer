type PreloadConsole = import("./preloadModuleTypes").PreloadConsole;
type PreloadLog = import("./preloadModuleTypes").PreloadLog;

type PreloadConsoleMethod = (...args: unknown[]) => void;

export function createPreloadLogger(
    consoleRef: PreloadConsole | undefined = console
): PreloadLog {
    return (level, message, ...details) => {
        const method = getPreloadConsoleMethod(consoleRef, level);
        if (typeof method !== "function") {
            return;
        }

        method.call(consoleRef, message, ...details);
    };
}

function getPreloadConsoleMethod(
    consoleRef: PreloadConsole | undefined,
    level: Parameters<PreloadLog>[0]
): PreloadConsoleMethod | undefined {
    if (!isPreloadConsole(consoleRef)) {
        return undefined;
    }

    try {
        if (level === "info") {
            return consoleRef.log;
        }

        if (level === "error") {
            return consoleRef.error;
        }

        return consoleRef.warn;
    } catch {
        return undefined;
    }
}

function isPreloadConsole(value: unknown): value is PreloadConsole {
    return typeof value === "object" && value !== null;
}
