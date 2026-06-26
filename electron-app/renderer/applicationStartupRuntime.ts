import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserSetTimeout,
} from "../utils/runtime/browserRuntime.js";

export type RendererApplicationStartupTimerHandle = BrowserTimerHandle;

export interface RendererApplicationStartupRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => BrowserSetTimeout | undefined)
        | undefined;
}

export interface RendererApplicationStartupRuntime {
    clearTimeout: (handle: RendererApplicationStartupTimerHandle) => void;
    createAbortController: () => AbortController;
    setTimeout: (
        callback: () => void,
        delay: number
    ) => RendererApplicationStartupTimerHandle;
}

const defaultRendererApplicationStartupRuntimeScope: RendererApplicationStartupRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getClearTimeout: getBrowserClearTimeout,
        getSetTimeout: getBrowserSetTimeout,
    };

export function getRendererApplicationStartupRuntime(
    scope: RendererApplicationStartupRuntimeScope = defaultRendererApplicationStartupRuntimeScope
): RendererApplicationStartupRuntime {
    return {
        clearTimeout(handle: RendererApplicationStartupTimerHandle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "renderer application startup requires clearTimeout"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerRef = scope.getAbortController?.();
            if (typeof AbortControllerRef !== "function") {
                throw new TypeError(
                    "renderer application startup requires an AbortController"
                );
            }

            return new AbortControllerRef();
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): RendererApplicationStartupTimerHandle {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "renderer application startup requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delay);
        },
    };
}
