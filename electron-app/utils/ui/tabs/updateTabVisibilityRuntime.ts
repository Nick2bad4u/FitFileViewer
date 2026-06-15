export type UpdateTabVisibilityTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface UpdateTabVisibilityRuntimeScope {
    readonly clearTimeout?:
        | ((handle: UpdateTabVisibilityTimerHandle) => void)
        | undefined;
    readonly document?: Document | undefined;
    readonly requestAnimationFrame?:
        | ((callback: FrameRequestCallback) => number)
        | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout?: number
          ) => UpdateTabVisibilityTimerHandle)
        | undefined;
}

export interface UpdateTabVisibilityRuntime {
    clearTimeout: (handle: UpdateTabVisibilityTimerHandle) => void;
    getDocument: () => Document | undefined;
    requestAnimationFrame: (callback: FrameRequestCallback) => number | undefined;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => UpdateTabVisibilityTimerHandle;
}

const defaultUpdateTabVisibilityRuntimeScope: UpdateTabVisibilityRuntimeScope =
    globalThis;

export function getUpdateTabVisibilityRuntime(
    scope: UpdateTabVisibilityRuntimeScope = defaultUpdateTabVisibilityRuntimeScope
): UpdateTabVisibilityRuntime {
    return {
        clearTimeout(handle: UpdateTabVisibilityTimerHandle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "updateTabVisibility requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        getDocument(): Document | undefined {
            return scope.document;
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            if (typeof scope.requestAnimationFrame !== "function") {
                return undefined;
            }

            return scope.requestAnimationFrame(callback);
        },
        setTimeout(
            callback: () => void,
            timeout: number
        ): UpdateTabVisibilityTimerHandle {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "updateTabVisibility requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}
