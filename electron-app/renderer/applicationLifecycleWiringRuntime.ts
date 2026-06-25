import { getBrowserRendererAbortController } from "./rendererBrowserRuntime.js";

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
        getAbortController: getBrowserRendererAbortController,
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
