export type MapDrawLapsTimer = ReturnType<typeof globalThis.setTimeout>;

export interface MapDrawLapsRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface MapDrawLapsRuntime {
    clearTimeout(timer: MapDrawLapsTimer): void;
    setTimeout(callback: () => void, delayMs: number): MapDrawLapsTimer;
}

const defaultMapDrawLapsRuntimeScope: MapDrawLapsRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeClearTimeout(
    scope: MapDrawLapsRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getScopeSetTimeout(
    scope: MapDrawLapsRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
}

export function getMapDrawLapsRuntime(
    scope: MapDrawLapsRuntimeScope = defaultMapDrawLapsRuntimeScope
): MapDrawLapsRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("mapDrawLapsRuntime requires clearTimeout");
            }

            clearTimeoutRef.call(scope, timer);
        },
        setTimeout(callback, delayMs): MapDrawLapsTimer {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("mapDrawLapsRuntime requires setTimeout");
            }

            return setTimeoutRef.call(scope, callback, delayMs);
        },
    };
}
