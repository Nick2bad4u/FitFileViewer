export type MapActionButtonTimer = ReturnType<typeof globalThis.setTimeout>;

export interface MapActionButtonsRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface MapActionButtonsRuntime {
    clearTimeout: (timer: MapActionButtonTimer) => void;
    setTimeout: (
        callback: () => void,
        delayMs: number
    ) => MapActionButtonTimer;
}

export function getMapActionButtonsRuntime(
    scope: MapActionButtonsRuntimeScope = globalThis
): MapActionButtonsRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): MapActionButtonTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
