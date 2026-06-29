import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLInputElementConstructor,
    getBrowserAbortController,
    getBrowserHTMLInputElement,
} from "../utils/runtime/browserRuntime.js";

export interface RendererFileInputStartupRuntimeScope {
    readonly getAbortController: RendererFileInputStartupRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getHTMLInputElement: RendererFileInputStartupRuntimeProvider<BrowserHTMLInputElementConstructor>;
}

type RendererFileInputStartupRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface RendererFileInputStartupRuntime {
    createAbortController: () => AbortController;
    isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
}

const defaultRendererFileInputStartupRuntimeScope: RendererFileInputStartupRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getHTMLInputElement: getBrowserHTMLInputElement,
    };

export function getRendererFileInputStartupRuntime(
    scope: RendererFileInputStartupRuntimeScope = defaultRendererFileInputStartupRuntimeScope
): RendererFileInputStartupRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    );
    const getHTMLInputElement = getRequiredProvider(
        scope.getHTMLInputElement,
        "HTMLInputElement"
    );

    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderer file input startup requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        isHTMLInputElement(value: unknown): value is HTMLInputElement {
            const HTMLInputElementConstructor = getHTMLInputElement();
            return (
                typeof HTMLInputElementConstructor === "function" &&
                value instanceof HTMLInputElementConstructor
            );
        },
    };
}

function getRequiredProvider<T>(
    provider: RendererFileInputStartupRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `renderer file input startup requires ${article} ${providerName} provider`
        );
    }

    return provider;
}
