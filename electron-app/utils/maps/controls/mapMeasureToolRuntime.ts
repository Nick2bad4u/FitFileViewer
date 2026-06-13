export type MapMeasureToolTimer = ReturnType<typeof globalThis.setTimeout>;

export interface MapMeasureToolRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface MapMeasureToolRuntime {
    clearTimeout(timer: MapMeasureToolTimer): void;
    setTimeout(callback: () => void, delayMs: number): MapMeasureToolTimer;
}

export function getMapMeasureToolRuntime(
    scope: MapMeasureToolRuntimeScope = globalThis
): MapMeasureToolRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): MapMeasureToolTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
