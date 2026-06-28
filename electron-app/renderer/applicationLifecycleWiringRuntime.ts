import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
} from "../utils/runtime/browserRuntime.js";

export interface RendererApplicationLifecycleWiringRuntimeScope {
    readonly getAbortController: () =>
        | BrowserAbortControllerConstructor
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
    if (typeof scope.getAbortController !== "function") {
        throw new TypeError(
            "renderer application lifecycle wiring requires an AbortController provider"
        );
    }

    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderer application lifecycle wiring requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}
