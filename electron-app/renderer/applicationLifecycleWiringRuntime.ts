export interface RendererApplicationLifecycleWiringRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface RendererApplicationLifecycleWiringRuntime {
    createAbortController(): AbortController;
}

const defaultRendererApplicationLifecycleWiringRuntimeScope: RendererApplicationLifecycleWiringRuntimeScope =
    globalThis;

export function getRendererApplicationLifecycleWiringRuntime(
    scope: RendererApplicationLifecycleWiringRuntimeScope = defaultRendererApplicationLifecycleWiringRuntimeScope
): RendererApplicationLifecycleWiringRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderer application lifecycle wiring requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}
