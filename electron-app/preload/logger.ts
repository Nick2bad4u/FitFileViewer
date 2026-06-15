type PreloadLog = (
    level: "error" | "info" | "warn",
    message: string,
    ...details: unknown[]
) => void;

interface ConsoleLike {
    error?: (...args: unknown[]) => void;
    log?: (...args: unknown[]) => void;
    warn?: (...args: unknown[]) => void;
}

export function createPreloadLogger(
    consoleRef: ConsoleLike | undefined = console
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
