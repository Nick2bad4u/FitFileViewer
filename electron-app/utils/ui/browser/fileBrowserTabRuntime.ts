import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    type BrowserHTMLInputElementConstructor,
    type BrowserHTMLSelectElementConstructor,
    getBrowserAbortController,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserHTMLInputElement,
    getBrowserHTMLSelectElement,
    getBrowserLocalStorage,
} from "../../runtime/browserRuntime.js";
import { getElementByIdFlexible } from "../dom/elementIdUtils.js";

export interface FileBrowserTabRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getDateNow?: (() => (() => number) | undefined) | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => BrowserHTMLInputElementConstructor | undefined)
        | undefined;
    readonly getHTMLSelectElement?:
        | (() => BrowserHTMLSelectElementConstructor | undefined)
        | undefined;
    readonly getLocalStorage?: (() => Storage | undefined) | undefined;
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
    getStorageItem: (key: string) => string | null;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
    isHTMLSelectElement: (value: unknown) => value is HTMLSelectElement;
    setStorageItem: (key: string, value: string) => void;
}

const defaultFileBrowserTabRuntimeScope: FileBrowserTabRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getDateNow: getBrowserDateNow,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getHTMLInputElement: getBrowserHTMLInputElement,
    getHTMLSelectElement: getBrowserHTMLSelectElement,
    getLocalStorage: getBrowserLocalStorage,
};

function getAbortControllerConstructor(
    scope: FileBrowserTabRuntimeScope
): BrowserAbortControllerConstructor {
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
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError("fileBrowserTab requires an HTMLElement runtime");
    }

    return HTMLElementConstructor;
}

function getHTMLInputElementConstructor(
    scope: FileBrowserTabRuntimeScope
): BrowserHTMLInputElementConstructor {
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
): BrowserHTMLSelectElementConstructor {
    const HTMLSelectElementConstructor = scope.getHTMLSelectElement?.();
    if (typeof HTMLSelectElementConstructor !== "function") {
        throw new TypeError(
            "fileBrowserTab requires an HTMLSelectElement runtime"
        );
    }

    return HTMLSelectElementConstructor;
}

function getRequiredLocalStorage(scope: FileBrowserTabRuntimeScope): Storage {
    const storage = scope.getLocalStorage?.();
    if (!storage) {
        throw new TypeError("fileBrowserTab requires a localStorage runtime");
    }

    return storage;
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
        getStorageItem(key): string | null {
            return getRequiredLocalStorage(scope).getItem(key);
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
        setStorageItem(key, value): void {
            getRequiredLocalStorage(scope).setItem(key, value);
        },
    };
}
