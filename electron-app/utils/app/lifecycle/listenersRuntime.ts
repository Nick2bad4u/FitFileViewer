export type LifecycleListenersTimer = ReturnType<typeof globalThis.setTimeout>;

export interface LifecycleListenersRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface LifecycleListenersRuntime {
    clearTimeout(handle: LifecycleListenersTimer): void;
    setTimeout(
        callback: () => void,
        delayMs: number
    ): LifecycleListenersTimer;
}

export function getLifecycleListenersRuntime(
    scope: LifecycleListenersRuntimeScope = globalThis
): LifecycleListenersRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        setTimeout(callback, delayMs): LifecycleListenersTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
