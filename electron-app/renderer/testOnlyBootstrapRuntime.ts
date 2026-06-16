export interface RendererTestOnlyBootstrapRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
}

export interface RendererTestOnlyBootstrapRuntime {
    createAbortController: () => AbortController;
}

const defaultRendererTestOnlyBootstrapRuntimeScope: RendererTestOnlyBootstrapRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
    };

export function getRendererTestOnlyBootstrapRuntime(
    scope: RendererTestOnlyBootstrapRuntimeScope = defaultRendererTestOnlyBootstrapRuntimeScope
): RendererTestOnlyBootstrapRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderer test-only bootstrap requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}
