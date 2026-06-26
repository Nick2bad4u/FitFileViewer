import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
} from "../utils/runtime/browserRuntime.js";

export interface RendererTestOnlyBootstrapRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
}

export interface RendererTestOnlyBootstrapRuntime {
    createAbortController: () => AbortController;
}

const defaultRendererTestOnlyBootstrapRuntimeScope: RendererTestOnlyBootstrapRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
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
