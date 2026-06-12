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
        typeof value === "object" &&
        value !== null &&
        typeof (value as { isEnabled?: unknown }).isEnabled === "boolean" &&
        typeof (value as { isFullscreen?: unknown }).isFullscreen ===
            "boolean" &&
        typeof (value as { on?: unknown }).on === "function"
    );
}
