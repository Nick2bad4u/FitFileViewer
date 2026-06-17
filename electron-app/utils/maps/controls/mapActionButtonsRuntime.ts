export type MapActionButtonTimer = ReturnType<typeof globalThis.setTimeout>;

export interface MapActionButtonsRuntimeScope {
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface MapActionButtonsRuntime {
    clearTimeout: (timer: MapActionButtonTimer) => void;
    setTimeout: (callback: () => void, delayMs: number) => MapActionButtonTimer;
}

const defaultMapActionButtonsRuntimeScope: MapActionButtonsRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getSetTimeout: () => globalThis.setTimeout,
};

export function getMapActionButtonsRuntime(
    scope: MapActionButtonsRuntimeScope = defaultMapActionButtonsRuntimeScope
): MapActionButtonsRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapActionButtonsRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): MapActionButtonTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapActionButtonsRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
