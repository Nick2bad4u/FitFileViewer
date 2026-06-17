import { querySelectorByIdFlexible } from "../dom/elementIdUtils.js";

type DisableableFormControl =
    | HTMLButtonElement
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement;

export interface SyncRendererLoadingRuntimeScope {
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLButtonElement?:
        | (() => typeof globalThis.HTMLButtonElement | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => typeof globalThis.HTMLInputElement | undefined)
        | undefined;
    readonly getHTMLSelectElement?:
        | (() => typeof globalThis.HTMLSelectElement | undefined)
        | undefined;
    readonly getHTMLTextAreaElement?:
        | (() => typeof globalThis.HTMLTextAreaElement | undefined)
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
        getDocument: () => globalThis.document,
        getHTMLButtonElement: () => globalThis.HTMLButtonElement,
        getHTMLInputElement: () => globalThis.HTMLInputElement,
        getHTMLSelectElement: () => globalThis.HTMLSelectElement,
        getHTMLTextAreaElement: () => globalThis.HTMLTextAreaElement,
    };

function getDocument(scope: SyncRendererLoadingRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
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
    | typeof globalThis.HTMLButtonElement
    | typeof globalThis.HTMLInputElement
    | typeof globalThis.HTMLSelectElement
    | typeof globalThis.HTMLTextAreaElement
    | undefined {
    switch (name) {
        case "HTMLButtonElement": {
            return scope.getHTMLButtonElement?.();
        }
        case "HTMLInputElement": {
            return scope.getHTMLInputElement?.();
        }
        case "HTMLSelectElement": {
            return scope.getHTMLSelectElement?.();
        }
        case "HTMLTextAreaElement": {
            return scope.getHTMLTextAreaElement?.();
        }
    }
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
