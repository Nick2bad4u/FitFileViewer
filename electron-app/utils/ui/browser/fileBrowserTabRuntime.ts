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
    readonly getAbortController: FileBrowserTabRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDateNow: FileBrowserTabRuntimeProvider<() => number>;
    readonly getDocument: FileBrowserTabRuntimeProvider<Document>;
    readonly getHTMLElement: FileBrowserTabRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getHTMLInputElement: FileBrowserTabRuntimeProvider<BrowserHTMLInputElementConstructor>;
    readonly getHTMLSelectElement: FileBrowserTabRuntimeProvider<BrowserHTMLSelectElementConstructor>;
    readonly getLocalStorage: FileBrowserTabRuntimeProvider<Storage>;
}

type FileBrowserTabRuntimeProvider<T> = (() => T | undefined) | undefined;

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

function getRequiredProvider<T>(
    provider: FileBrowserTabRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `fileBrowserTab requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: FileBrowserTabRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "fileBrowserTab requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getRequiredDateNow(scope: FileBrowserTabRuntimeScope): () => number {
    const dateNow = getRequiredProvider(scope.getDateNow, "date clock")();
    if (typeof dateNow !== "function") {
        throw new TypeError("fileBrowserTab requires a date clock runtime");
    }

    return dateNow;
}

function getRequiredDocument(scope: FileBrowserTabRuntimeScope): Document {
    const documentRef = getRequiredProvider(scope.getDocument, "document")();
    if (!documentRef) {
        throw new TypeError("fileBrowserTab requires a document runtime");
    }

    return documentRef;
}

function getHTMLElementConstructor(
    scope: FileBrowserTabRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError("fileBrowserTab requires an HTMLElement runtime");
    }

    return HTMLElementConstructor;
}

function getHTMLInputElementConstructor(
    scope: FileBrowserTabRuntimeScope
): BrowserHTMLInputElementConstructor {
    const HTMLInputElementConstructor = getRequiredProvider(
        scope.getHTMLInputElement,
        "HTMLInputElement"
    )();
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
    const HTMLSelectElementConstructor = getRequiredProvider(
        scope.getHTMLSelectElement,
        "HTMLSelectElement"
    )();
    if (typeof HTMLSelectElementConstructor !== "function") {
        throw new TypeError(
            "fileBrowserTab requires an HTMLSelectElement runtime"
        );
    }

    return HTMLSelectElementConstructor;
}

function getRequiredLocalStorage(scope: FileBrowserTabRuntimeScope): Storage {
    const storage = getRequiredProvider(
        scope.getLocalStorage,
        "localStorage"
    )();
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
