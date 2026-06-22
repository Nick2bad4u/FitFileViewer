export type UpdateTabVisibilityTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;
type UpdateTabVisibilityClearTimeout = (
    handle: UpdateTabVisibilityTimerHandle
) => void;
type UpdateTabVisibilityRequestAnimationFrame = (
    callback: FrameRequestCallback
) => number;
type UpdateTabVisibilitySetTimeout = (
    callback: () => void,
    timeout?: number
) => UpdateTabVisibilityTimerHandle;

export interface UpdateTabVisibilityRuntimeScope {
    readonly getClearTimeout?:
        | (() => UpdateTabVisibilityClearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getRequestAnimationFrame?:
        | (() => UpdateTabVisibilityRequestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => UpdateTabVisibilitySetTimeout | undefined)
        | undefined;
}

export interface UpdateTabVisibilityRuntime {
    clearTimeout: (handle: UpdateTabVisibilityTimerHandle) => void;
    getDocument: () => Document | undefined;
    requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => number | undefined;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => UpdateTabVisibilityTimerHandle;
}

const defaultUpdateTabVisibilityRuntimeScope: UpdateTabVisibilityRuntimeScope =
    {
        getClearTimeout: () => globalThis.clearTimeout,
        getDocument: () => globalThis.document,
        getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
        getSetTimeout: () => globalThis.setTimeout,
    };

export function getUpdateTabVisibilityRuntime(
    scope: UpdateTabVisibilityRuntimeScope = defaultUpdateTabVisibilityRuntimeScope
): UpdateTabVisibilityRuntime {
    return {
        clearTimeout(handle: UpdateTabVisibilityTimerHandle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "updateTabVisibility requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        getDocument(): Document | undefined {
            return scope.getDocument?.();
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            const requestAnimationFrame = scope.getRequestAnimationFrame?.();
            if (typeof requestAnimationFrame !== "function") {
                return undefined;
            }

            return requestAnimationFrame(callback);
        },
        setTimeout(
            callback: () => void,
            timeout: number
        ): UpdateTabVisibilityTimerHandle {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "updateTabVisibility requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}
