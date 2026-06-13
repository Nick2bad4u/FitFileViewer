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

export function getRendererApplicationStartupRuntime(
    scope: RendererApplicationStartupRuntimeScope = globalThis
): RendererApplicationStartupRuntime {
    return {
        clearTimeout(handle: RendererApplicationStartupTimerHandle): void {
            const clearTimeoutRef = scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerRef =
                scope.AbortController ?? globalThis.AbortController;
            return new AbortControllerRef();
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): RendererApplicationStartupTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delay);
        },
    };
}
