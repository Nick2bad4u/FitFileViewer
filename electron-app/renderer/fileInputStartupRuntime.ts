import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLInputElementConstructor,
    getBrowserAbortController,
    getBrowserHTMLInputElement,
} from "../utils/runtime/browserRuntime.js";

export interface RendererFileInputStartupRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => BrowserHTMLInputElementConstructor | undefined)
        | undefined;
}

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
        isHTMLInputElement(value: unknown): value is HTMLInputElement {
            const HTMLInputElementConstructor = scope.getHTMLInputElement?.();
            return (
                typeof HTMLInputElementConstructor === "function" &&
                value instanceof HTMLInputElementConstructor
            );
        },
    };
}
