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

function getDefaultPerformanceUtilsRuntimeScope(): PerformanceUtilsRuntimeScope {
    return {
        cancelIdleCallback: globalThis.cancelIdleCallback?.bind(globalThis),
        clearTimeout: globalThis.clearTimeout,
        dateNow: Date.now,
        requestIdleCallback: globalThis.requestIdleCallback?.bind(globalThis),
        setTimeout: globalThis.setTimeout,
    };
}

export function getPerformanceUtilsRuntime(
    scope: PerformanceUtilsRuntimeScope = getDefaultPerformanceUtilsRuntimeScope()
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
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError("performanceUtils requires clearTimeout");
            }

            clearTimeoutRef(handle);
        },
        now(): number {
            const dateNow = scope.dateNow;
            if (typeof dateNow !== "function") {
                throw new TypeError("performanceUtils requires dateNow");
            }

            return dateNow();
        },
        requestIdleCallback(callback, options): PerformanceUtilsIdleCallbackHandle {
            const requestIdleCallback = scope.requestIdleCallback;
            if (typeof requestIdleCallback === "function") {
                return requestIdleCallback(callback, options);
            }

            return this.setTimeout(callback, options?.timeout ?? 1);
        },
        setTimeout(callback, timeout): PerformanceUtilsTimerHandle {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("performanceUtils requires setTimeout");
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
