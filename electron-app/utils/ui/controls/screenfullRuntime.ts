export type ScreenfullRuntime = {
    isEnabled: boolean;
    isFullscreen: boolean;
    off?: (event: "change", handler: (event: Event) => void) => void;
    on: (event: "change", handler: (event: Event) => void) => void;
};

interface ScreenfullRuntimeRegistry {
    runtime?: unknown;
}

const screenfullRuntimeRegistryKey = Symbol.for(
    "fitfileviewer.screenfullRuntime"
);

export function setScreenfullRuntime(runtime: unknown): void {
    getScreenfullRuntimeRegistry().runtime = runtime;
}

export function clearScreenfullRuntimeForTests(): void {
    getScreenfullRuntimeRegistry().runtime = undefined;
}

export function resolveScreenfullRuntime(): ScreenfullRuntime | undefined {
    const runtime = getScreenfullRuntimeRegistry().runtime;
    return isScreenfullRuntime(runtime) ? runtime : undefined;
}

export function isScreenfullRuntime(
    value: unknown
): value is ScreenfullRuntime {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as { isEnabled?: unknown }).isEnabled === "boolean" &&
        typeof (value as { isFullscreen?: unknown }).isFullscreen ===
            "boolean" &&
        typeof (value as { on?: unknown }).on === "function"
    );
}

function getScreenfullRuntimeRegistry(): ScreenfullRuntimeRegistry {
    const screenfullGlobal = globalThis as typeof globalThis &
        Record<symbol, ScreenfullRuntimeRegistry | undefined>;
    screenfullGlobal[screenfullRuntimeRegistryKey] ??= {};
    return screenfullGlobal[screenfullRuntimeRegistryKey];
}
