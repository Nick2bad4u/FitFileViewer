export type PerformanceUtilsTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;
export type PerformanceUtilsIdleCallbackHandle = PerformanceUtilsTimerHandle;

export interface PerformanceUtilsRuntimeScope {
    readonly cancelIdleCallback?:
        | ((handle: number) => void)
        | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly dateNow?: (() => number) | undefined;
    readonly requestIdleCallback?:
        | ((callback: () => void, options?: IdleRequestOptions) => number)
        | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout?: number
          ) => PerformanceUtilsTimerHandle)
        | undefined;
}

export interface PerformanceUtilsRuntime {
    cancelIdleCallback(handle: PerformanceUtilsIdleCallbackHandle): void;
    clearTimeout(handle: PerformanceUtilsTimerHandle): void;
    now(): number;
    requestIdleCallback(
        callback: () => void,
        options?: IdleRequestOptions
    ): PerformanceUtilsIdleCallbackHandle;
    setTimeout(
        callback: () => void,
        timeout: number
    ): PerformanceUtilsTimerHandle;
}

export function getPerformanceUtilsRuntime(
    scope: PerformanceUtilsRuntimeScope = globalThis
): PerformanceUtilsRuntime {
    return {
        cancelIdleCallback(handle): void {
            const cancelIdleCallback = scope.cancelIdleCallback;
            if (
                typeof handle === "number" &&
                typeof cancelIdleCallback === "function"
            ) {
                cancelIdleCallback(handle);
                return;
            }

            this.clearTimeout(handle);
        },
        clearTimeout(handle): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        now(): number {
            return scope.dateNow?.() ?? Date.now();
        },
        requestIdleCallback(callback, options): PerformanceUtilsIdleCallbackHandle {
            const requestIdleCallback = scope.requestIdleCallback;
            if (typeof requestIdleCallback === "function") {
                return requestIdleCallback(callback, options);
            }

            return this.setTimeout(callback, options?.timeout ?? 1);
        },
        setTimeout(callback, timeout): PerformanceUtilsTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, timeout);
        },
    };
}
