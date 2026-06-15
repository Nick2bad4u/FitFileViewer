export type RendererStateIntegrationTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface RendererStateIntegrationRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
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

const defaultRendererStateIntegrationRuntimeScope: RendererStateIntegrationRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getClearTimeout: () => globalThis.clearTimeout,
        getSetTimeout: () => globalThis.setTimeout,
    };

function getAbortControllerConstructor(
    scope: RendererStateIntegrationRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.getAbortController?.() ?? scope.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "rendererStateIntegration requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

export function getRendererStateIntegrationRuntime(
    scope: RendererStateIntegrationRuntimeScope = defaultRendererStateIntegrationRuntimeScope
): RendererStateIntegrationRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef =
                scope.getClearTimeout?.() ?? scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "rendererStateIntegration requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(timer);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        setTimeout(callback, delayMs): RendererStateIntegrationTimer {
            const setTimeoutRef = scope.getSetTimeout?.() ?? scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "rendererStateIntegration requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
