export type MapDrawLapsTimer = ReturnType<typeof globalThis.setTimeout>;

export interface MapDrawLapsRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface MapDrawLapsRuntime {
    clearTimeout(timer: MapDrawLapsTimer): void;
    setTimeout(callback: () => void, delayMs: number): MapDrawLapsTimer;
}

export function getMapDrawLapsRuntime(
    scope: MapDrawLapsRuntimeScope = globalThis
): MapDrawLapsRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): MapDrawLapsTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
