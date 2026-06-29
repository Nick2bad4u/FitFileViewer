import {
    type BrowserClearTimeout,
    type BrowserRequestAnimationFrame,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type UpdateTabVisibilityTimerHandle = BrowserTimerHandle | number;
type UpdateTabVisibilityClearTimeout = (
    handle: UpdateTabVisibilityTimerHandle
) => ReturnType<BrowserClearTimeout>;
type UpdateTabVisibilityRequestAnimationFrame = BrowserRequestAnimationFrame;
type UpdateTabVisibilitySetTimeout = (
    callback: () => void,
    timeout?: number
) => ReturnType<BrowserSetTimeout> | number;

export interface UpdateTabVisibilityRuntimeScope {
    readonly getClearTimeout:
        | (() => UpdateTabVisibilityClearTimeout | undefined)
        | undefined;
    readonly getDocument: (() => Document | undefined) | undefined;
    readonly getRequestAnimationFrame:
        | (() => UpdateTabVisibilityRequestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout:
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
        getClearTimeout: getBrowserClearTimeout,
        getDocument: getBrowserDocument,
        getRequestAnimationFrame: getBrowserRequestAnimationFrame,
        getSetTimeout: getBrowserSetTimeout,
    };

export function getUpdateTabVisibilityRuntime(
    scope: UpdateTabVisibilityRuntimeScope = defaultUpdateTabVisibilityRuntimeScope
): UpdateTabVisibilityRuntime {
    function getRequiredProvider<T>(
        provider: (() => T | undefined) | undefined,
        name:
            | "clearTimeout"
            | "document"
            | "requestAnimationFrame"
            | "setTimeout"
    ): () => T | undefined {
        if (!provider) {
            throw new TypeError(
                `updateTabVisibility requires a ${name} provider`
            );
        }

        return provider;
    }

    return {
        clearTimeout(handle: UpdateTabVisibilityTimerHandle): void {
            const clearTimeoutRef = getRequiredProvider(
                scope.getClearTimeout,
                "clearTimeout"
            )();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "updateTabVisibility requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        getDocument(): Document | undefined {
            return getRequiredProvider(scope.getDocument, "document")();
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            const requestAnimationFrame = getRequiredProvider(
                scope.getRequestAnimationFrame,
                "requestAnimationFrame"
            )();
            if (typeof requestAnimationFrame !== "function") {
                return undefined;
            }

            return requestAnimationFrame(callback);
        },
        setTimeout(
            callback: () => void,
            timeout: number
        ): UpdateTabVisibilityTimerHandle {
            const setTimeoutRef = getRequiredProvider(
                scope.getSetTimeout,
                "setTimeout"
            )();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "updateTabVisibility requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}
