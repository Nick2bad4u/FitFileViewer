export interface RendererTestOnlyBootstrapRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface RendererTestOnlyBootstrapRuntime {
    createAbortController(): AbortController;
}

const defaultRendererTestOnlyBootstrapRuntimeScope: RendererTestOnlyBootstrapRuntimeScope =
    globalThis;

export function getRendererTestOnlyBootstrapRuntime(
    scope: RendererTestOnlyBootstrapRuntimeScope = defaultRendererTestOnlyBootstrapRuntimeScope
): RendererTestOnlyBootstrapRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderer test-only bootstrap requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}
