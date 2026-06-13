export type RendererStateIntegrationTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface RendererStateIntegrationRuntimeScope {
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface RendererStateIntegrationRuntime {
    clearTimeout(timer: RendererStateIntegrationTimer): void;
    setTimeout(
        callback: () => void,
        delayMs: number
    ): RendererStateIntegrationTimer;
}

export function getRendererStateIntegrationRuntime(
    scope: RendererStateIntegrationRuntimeScope = globalThis
): RendererStateIntegrationRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(timer);
        },
        setTimeout(callback, delayMs): RendererStateIntegrationTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
