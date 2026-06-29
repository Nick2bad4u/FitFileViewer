import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
} from "../utils/runtime/browserRuntime.js";

export interface RendererApplicationLifecycleWiringRuntimeScope {
    readonly getAbortController: RendererApplicationLifecycleWiringRuntimeProvider<BrowserAbortControllerConstructor>;
}

type RendererApplicationLifecycleWiringRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

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
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    );

    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderer application lifecycle wiring requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}

function getRequiredProvider<T>(
    provider: RendererApplicationLifecycleWiringRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `renderer application lifecycle wiring requires ${article} ${providerName} provider`
        );
    }

    return provider;
}
