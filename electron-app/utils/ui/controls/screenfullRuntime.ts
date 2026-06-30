export type ScreenfullRuntime = {
    isEnabled: boolean;
    isFullscreen: boolean;
    off?: (event: "change", handler: (event: Event) => void) => void;
    on: (event: "change", handler: (event: Event) => void) => void;
};

type ScreenfullRuntimeCandidate = Readonly<{
    readonly isEnabled?: unknown;
    readonly isFullscreen?: unknown;
    readonly off?: unknown;
    readonly on?: unknown;
}>;

type ScreenfullRuntimeRegistry = {
    runtime?: ScreenfullRuntime;
};

const screenfullRuntimeRegistry: ScreenfullRuntimeRegistry = {};

function isObjectCandidate(value: unknown): value is object {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toScreenfullRuntimeCandidate(
    value: unknown
): ScreenfullRuntimeCandidate | undefined {
    return isObjectCandidate(value) ? value : undefined;
}

function readRuntimeValue(readValue: () => unknown): unknown {
    try {
        return readValue();
    } catch {
        return undefined;
    }
}

export function registerScreenfullRuntime(runtime: ScreenfullRuntime): void {
    screenfullRuntimeRegistry.runtime = runtime;
}

export function clearScreenfullRuntimeForTests(): void {
    delete screenfullRuntimeRegistry.runtime;
}

export function resolveScreenfullRuntime(): ScreenfullRuntime | undefined {
    return screenfullRuntimeRegistry.runtime;
}

export function isScreenfullRuntime(
    value: unknown
): value is ScreenfullRuntime {
    const runtime = toScreenfullRuntimeCandidate(value);
    if (runtime === undefined) {
        return false;
    }

    return (
        typeof readRuntimeValue(() => runtime.isEnabled) === "boolean" &&
        typeof readRuntimeValue(() => runtime.isFullscreen) === "boolean" &&
        typeof readRuntimeValue(() => runtime.on) === "function"
    );
}
