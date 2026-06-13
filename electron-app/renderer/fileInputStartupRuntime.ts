export interface RendererFileInputStartupRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
}

export interface RendererFileInputStartupRuntime {
    createAbortController(): AbortController;
}

export function getRendererFileInputStartupRuntime(
    scope: RendererFileInputStartupRuntimeScope = globalThis
): RendererFileInputStartupRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderer file input startup requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}
