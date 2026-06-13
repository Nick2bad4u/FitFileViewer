export type RendererStateIntegrationTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface RendererStateIntegrationRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface RendererStateIntegrationRuntime {
    clearTimeout(timer: RendererStateIntegrationTimer): void;
    createAbortController: () => AbortController;
    setTimeout(
        callback: () => void,
        delayMs: number
    ): RendererStateIntegrationTimer;
}

function getAbortControllerConstructor(
    scope: RendererStateIntegrationRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "rendererStateIntegration requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
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
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        setTimeout(callback, delayMs): RendererStateIntegrationTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delayMs);
        },
    };
}
