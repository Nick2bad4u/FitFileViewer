export type MapFullscreenControlTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface MapFullscreenControlRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface MapFullscreenControlRuntime {
    clearTimeout(timer: MapFullscreenControlTimer): void;
    setTimeout(
        callback: () => void,
        delayMs: number
    ): MapFullscreenControlTimer;
}

export function getMapFullscreenControlRuntime(
    scope: MapFullscreenControlRuntimeScope = globalThis
): MapFullscreenControlRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): MapFullscreenControlTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
