export type RendererApplicationStartupTimerHandle =
    ReturnType<typeof globalThis.setTimeout>;

export interface RendererApplicationStartupRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface RendererApplicationStartupRuntime {
    clearTimeout(handle: RendererApplicationStartupTimerHandle): void;
    createAbortController(): AbortController;
    setTimeout(
        callback: () => void,
        delay: number
    ): RendererApplicationStartupTimerHandle;
}

const defaultRendererApplicationStartupRuntimeScope: RendererApplicationStartupRuntimeScope =
    {
        get AbortController() {
            return globalThis.AbortController;
        },
        get clearTimeout() {
            return globalThis.clearTimeout;
        },
        get setTimeout() {
            return globalThis.setTimeout;
        },
    };

export function getRendererApplicationStartupRuntime(
    scope: RendererApplicationStartupRuntimeScope = defaultRendererApplicationStartupRuntimeScope
): RendererApplicationStartupRuntime {
    return {
        clearTimeout(handle: RendererApplicationStartupTimerHandle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "renderer application startup requires clearTimeout"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerRef = scope.AbortController;
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
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "renderer application startup requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delay);
        },
    };
}
