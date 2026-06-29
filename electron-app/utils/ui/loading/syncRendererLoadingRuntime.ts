import { querySelectorByIdFlexible } from "../dom/elementIdUtils.js";
import {
    type BrowserHTMLButtonElementConstructor,
    type BrowserHTMLInputElementConstructor,
    type BrowserHTMLSelectElementConstructor,
    type BrowserHTMLTextAreaElementConstructor,
    getBrowserDocument,
    getBrowserHTMLButtonElement,
    getBrowserHTMLInputElement,
    getBrowserHTMLSelectElement,
    getBrowserHTMLTextAreaElement,
} from "../../runtime/browserRuntime.js";

type DisableableFormControl =
    | HTMLButtonElement
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement;

export interface SyncRendererLoadingRuntimeScope {
    readonly getDocument: (() => Document | undefined) | undefined;
    readonly getHTMLButtonElement:
        | (() => BrowserHTMLButtonElementConstructor | undefined)
        | undefined;
    readonly getHTMLInputElement:
        | (() => BrowserHTMLInputElementConstructor | undefined)
        | undefined;
    readonly getHTMLSelectElement:
        | (() => BrowserHTMLSelectElementConstructor | undefined)
        | undefined;
    readonly getHTMLTextAreaElement:
        | (() => BrowserHTMLTextAreaElementConstructor | undefined)
        | undefined;
}

export interface SyncRendererLoadingRuntime {
    readonly getLoadingOverlay: () => HTMLElement | null;
    readonly getInteractiveElements: () => Element[];
    readonly isDisableableFormControl: (
        element: Readonly<Element>
    ) => element is DisableableFormControl;
    readonly setBodyLoading: (loading: boolean) => void;
}

const defaultSyncRendererLoadingRuntimeScope: SyncRendererLoadingRuntimeScope =
    {
        getDocument: getBrowserDocument,
        getHTMLButtonElement: getBrowserHTMLButtonElement,
        getHTMLInputElement: getBrowserHTMLInputElement,
        getHTMLSelectElement: getBrowserHTMLSelectElement,
        getHTMLTextAreaElement: getBrowserHTMLTextAreaElement,
    };

function getDocument(scope: SyncRendererLoadingRuntimeScope): Document {
    const getRuntimeDocument = scope.getDocument;
    if (!getRuntimeDocument) {
        throw new TypeError("syncRendererLoading requires a document provider");
    }

    const runtimeDocument = getRuntimeDocument();
    if (!runtimeDocument) {
        throw new TypeError("syncRendererLoading requires a document runtime");
    }

    return runtimeDocument;
}

function getConstructor(
    scope: SyncRendererLoadingRuntimeScope,
    name:
        | "HTMLButtonElement"
        | "HTMLInputElement"
        | "HTMLSelectElement"
        | "HTMLTextAreaElement"
):
    | BrowserHTMLButtonElementConstructor
    | BrowserHTMLInputElementConstructor
    | BrowserHTMLSelectElementConstructor
    | BrowserHTMLTextAreaElementConstructor
    | undefined {
    switch (name) {
        case "HTMLButtonElement": {
            return getConstructorProvider(scope.getHTMLButtonElement, name)();
        }
        case "HTMLInputElement": {
            return getConstructorProvider(scope.getHTMLInputElement, name)();
        }
        case "HTMLSelectElement": {
            return getConstructorProvider(scope.getHTMLSelectElement, name)();
        }
        case "HTMLTextAreaElement": {
            return getConstructorProvider(scope.getHTMLTextAreaElement, name)();
        }
    }
}

function getConstructorProvider<
    T extends
        | BrowserHTMLButtonElementConstructor
        | BrowserHTMLInputElementConstructor
        | BrowserHTMLSelectElementConstructor
        | BrowserHTMLTextAreaElementConstructor,
>(
    provider: (() => T | undefined) | undefined,
    name:
        | "HTMLButtonElement"
        | "HTMLInputElement"
        | "HTMLSelectElement"
        | "HTMLTextAreaElement"
): () => T | undefined {
    if (!provider) {
        throw new TypeError(`syncRendererLoading requires a ${name} provider`);
    }

    return provider;
}

function isInstanceOfConstructor(
    scope: SyncRendererLoadingRuntimeScope,
    element: Readonly<Element>,
    name:
        | "HTMLButtonElement"
        | "HTMLInputElement"
        | "HTMLSelectElement"
        | "HTMLTextAreaElement"
): boolean {
    const Constructor = getConstructor(scope, name);
    return typeof Constructor === "function" && element instanceof Constructor;
}

export function getSyncRendererLoadingRuntime(
    scope: SyncRendererLoadingRuntimeScope = defaultSyncRendererLoadingRuntimeScope
): SyncRendererLoadingRuntime {
    return {
        getInteractiveElements(): Element[] {
            return [
                ...getDocument(scope).querySelectorAll(
                    "button, input, select, textarea"
                ),
            ];
        },
        getLoadingOverlay(): HTMLElement | null {
            return querySelectorByIdFlexible(
                getDocument(scope),
                "#loading_overlay"
            );
        },
        isDisableableFormControl(
            element: Readonly<Element>
        ): element is DisableableFormControl {
            return (
                isInstanceOfConstructor(scope, element, "HTMLButtonElement") ||
                isInstanceOfConstructor(scope, element, "HTMLInputElement") ||
                isInstanceOfConstructor(scope, element, "HTMLSelectElement") ||
                isInstanceOfConstructor(scope, element, "HTMLTextAreaElement")
            );
        },
        setBodyLoading(loading: boolean): void {
            const { body } = getDocument(scope);
            body.style.cursor = loading ? "wait" : "";
            body.setAttribute("aria-busy", String(loading));
        },
    };
}
