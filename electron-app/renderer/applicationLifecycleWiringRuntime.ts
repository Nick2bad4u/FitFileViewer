import { getBrowserAbortController } from "../utils/runtime/browserRuntime.js";

export interface RendererApplicationLifecycleWiringRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
}

export interface RendererApplicationLifecycleWiringRuntime {
    createAbortController: () => AbortController;
}

const defaultRendererApplicationLifecycleWiringRuntimeScope: RendererApplicationLifecycleWiringRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
    };

export function getRendererApplicationLifecycleWiringRuntime(
    scope: RendererApplicationLifecycleWiringRuntimeScope = defaultRendererApplicationLifecycleWiringRuntimeScope
): RendererApplicationLifecycleWiringRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderer application lifecycle wiring requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}
