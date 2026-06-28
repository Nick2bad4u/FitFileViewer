export type ScreenfullRuntime = {
    isEnabled: boolean;
    isFullscreen: boolean;
    off?: (event: "change", handler: (event: Event) => void) => void;
    on: (event: "change", handler: (event: Event) => void) => void;
};

type ScreenfullRuntimeRegistry = {
    runtime?: unknown;
};

const screenfullRuntimeRegistry: ScreenfullRuntimeRegistry = {};

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function setScreenfullRuntime(runtime: unknown): void {
    screenfullRuntimeRegistry.runtime = runtime;
}

export function clearScreenfullRuntimeForTests(): void {
    screenfullRuntimeRegistry.runtime = undefined;
}

export function resolveScreenfullRuntime(): ScreenfullRuntime | undefined {
    const runtime = screenfullRuntimeRegistry.runtime;
    return isScreenfullRuntime(runtime) ? runtime : undefined;
}

export function isScreenfullRuntime(
    value: unknown
): value is ScreenfullRuntime {
    return (
        isRecord(value) &&
        typeof value["isEnabled"] === "boolean" &&
        typeof value["isFullscreen"] === "boolean" &&
        typeof value["on"] === "function"
    );
}
