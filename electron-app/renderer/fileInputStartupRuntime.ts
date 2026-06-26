import { getBrowserAbortController } from "../utils/runtime/browserRuntime.js";

export interface RendererFileInputStartupRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
}

export interface RendererFileInputStartupRuntime {
    createAbortController: () => AbortController;
}

const defaultRendererFileInputStartupRuntimeScope: RendererFileInputStartupRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
    };

export function getRendererFileInputStartupRuntime(
    scope: RendererFileInputStartupRuntimeScope = defaultRendererFileInputStartupRuntimeScope
): RendererFileInputStartupRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderer file input startup requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}
