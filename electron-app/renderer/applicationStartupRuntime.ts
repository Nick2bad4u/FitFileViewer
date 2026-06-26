import {
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserSetTimeout,
} from "../utils/runtime/browserRuntime.js";

export type RendererApplicationStartupTimerHandle = ReturnType<
    typeof globalThis.setTimeout
>;

export interface RendererApplicationStartupRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
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
