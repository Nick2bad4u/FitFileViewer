export type LifecycleListenersTimer = ReturnType<typeof globalThis.setTimeout>;

export interface LifecycleListenersRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface LifecycleListenersRuntime {
    clearTimeout(handle: LifecycleListenersTimer): void;
    createAbortController(): AbortController;
    setTimeout(
        callback: () => void,
        delayMs: number
    ): LifecycleListenersTimer;
}

const defaultLifecycleListenersRuntimeScope: LifecycleListenersRuntimeScope =
    globalThis;

export function getLifecycleListenersRuntime(
    scope: LifecycleListenersRuntimeScope = defaultLifecycleListenersRuntimeScope
): LifecycleListenersRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "lifecycle listeners require a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "lifecycle listeners require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        setTimeout(callback, delayMs): LifecycleListenersTimer {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "lifecycle listeners require a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
