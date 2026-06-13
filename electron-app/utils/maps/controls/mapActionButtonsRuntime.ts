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
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapActionButtonsRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): MapActionButtonTimer {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapActionButtonsRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
