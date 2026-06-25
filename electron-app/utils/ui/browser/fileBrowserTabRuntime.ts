import { getBrowserAbortController } from "../../runtime/browserRuntime.js";
import { getElementByIdFlexible } from "../dom/elementIdUtils.js";

export interface FileBrowserTabRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof HTMLElement | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => typeof HTMLInputElement | undefined)
        | undefined;
    readonly getHTMLSelectElement?:
        | (() => typeof HTMLSelectElement | undefined)
        | undefined;
}

export interface FileBrowserTabRuntime {
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createTextNode: (data: string) => Text;
    createAbortController: () => AbortController;
    dateNow: () => number;
    getElement: <TElement extends Element = Element>(
        selector: string
    ) => TElement | null;
    getElementById: (id: string) => HTMLElement | null;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
    isHTMLSelectElement: (value: unknown) => value is HTMLSelectElement;
}

const defaultFileBrowserTabRuntimeScope: FileBrowserTabRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getDateNow: () => Date.now,
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
    getHTMLInputElement: () => globalThis.HTMLInputElement,
    getHTMLSelectElement: () => globalThis.HTMLSelectElement,
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

function getRequiredDateNow(scope: FileBrowserTabRuntimeScope): () => number {
    const dateNow = scope.getDateNow?.();
    if (typeof dateNow !== "function") {
        throw new TypeError("fileBrowserTab requires a date clock runtime");
    }

    return dateNow;
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

function getHTMLInputElementConstructor(
    scope: FileBrowserTabRuntimeScope
): typeof HTMLInputElement {
    const HTMLInputElementConstructor = scope.getHTMLInputElement?.();
    if (typeof HTMLInputElementConstructor !== "function") {
        throw new TypeError(
            "fileBrowserTab requires an HTMLInputElement runtime"
        );
    }

    return HTMLInputElementConstructor;
}

function getHTMLSelectElementConstructor(
    scope: FileBrowserTabRuntimeScope
): typeof HTMLSelectElement {
    const HTMLSelectElementConstructor = scope.getHTMLSelectElement?.();
    if (typeof HTMLSelectElementConstructor !== "function") {
        throw new TypeError(
            "fileBrowserTab requires an HTMLSelectElement runtime"
        );
    }

    return HTMLSelectElementConstructor;
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
        createTextNode(data): Text {
            return getRequiredDocument(scope).createTextNode(data);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        dateNow(): number {
            return getRequiredDateNow(scope)();
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
        isHTMLInputElement(value): value is HTMLInputElement {
            return value instanceof getHTMLInputElementConstructor(scope);
        },
        isHTMLSelectElement(value): value is HTMLSelectElement {
            return value instanceof getHTMLSelectElementConstructor(scope);
        },
    };
}
