import { getElementByIdFlexible } from "../dom/elementIdUtils.js";

export interface FileBrowserTabRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof HTMLElement | undefined)
        | undefined;
}

export interface FileBrowserTabRuntime {
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createAbortController: () => AbortController;
    getElement: <TElement extends Element = Element>(
        selector: string
    ) => TElement | null;
    getElementById: (id: string) => HTMLElement | null;
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

const defaultFileBrowserTabRuntimeScope: FileBrowserTabRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
};

function getAbortControllerConstructor(
    scope: FileBrowserTabRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "fileBrowserTab requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getRequiredDocument(scope: FileBrowserTabRuntimeScope): Document {
    const documentRef = scope.getDocument?.();
    if (!documentRef) {
        throw new TypeError("fileBrowserTab requires a document runtime");
    }

    return documentRef;
}

function getHTMLElementConstructor(
    scope: FileBrowserTabRuntimeScope
): typeof HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError("fileBrowserTab requires an HTMLElement runtime");
    }

    return HTMLElementConstructor;
}

export function getFileBrowserTabRuntime(
    scope: FileBrowserTabRuntimeScope = defaultFileBrowserTabRuntimeScope
): FileBrowserTabRuntime {
    return {
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getRequiredDocument(scope).createElement(tagName);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        getElement<TElement extends Element = Element>(
            selector: string
        ): TElement | null {
            return getRequiredDocument(scope).querySelector<TElement>(selector);
        },
        getElementById(id): HTMLElement | null {
            return getElementByIdFlexible(getRequiredDocument(scope), id);
        },
        isHTMLElement(value): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
    };
}
