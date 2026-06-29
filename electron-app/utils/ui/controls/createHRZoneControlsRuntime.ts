import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserLocalStorage,
} from "../../runtime/browserRuntime.js";

type HRZoneControlsStorage = Pick<Storage, "getItem" | "setItem">;
type HRZoneControlsRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface HRZoneControlsRuntimeScope {
    readonly getAbortController: HRZoneControlsRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: HRZoneControlsRuntimeProvider<Document>;
    readonly getHTMLElement: HRZoneControlsRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getLocalStorage: HRZoneControlsRuntimeProvider<HRZoneControlsStorage>;
}

export interface HRZoneControlsRuntime {
    createAbortController: () => AbortController;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    getStorageItem: (key: string) => string | null;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    querySelector: <E extends Element = Element>(selector: string) => E | null;
    setStorageItem: (key: string, value: string) => void;
}

const defaultHRZoneControlsRuntimeScope: HRZoneControlsRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getLocalStorage: getBrowserLocalStorage,
};

function getRequiredProvider<T>(
    provider: HRZoneControlsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `createHRZoneControls requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getScopeDocument(
    scope: HRZoneControlsRuntimeScope
): Document | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
}

function getAbortControllerConstructor(
    scope: HRZoneControlsRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createHRZoneControls requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: HRZoneControlsRuntimeScope): Document {
    const runtimeDocument = getScopeDocument(scope);
    if (!runtimeDocument) {
        throw new TypeError("createHRZoneControls requires a document runtime");
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: HRZoneControlsRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "createHRZoneControls requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function getLocalStorage(
    scope: HRZoneControlsRuntimeScope
): HRZoneControlsStorage {
    const storage = getRequiredProvider(
        scope.getLocalStorage,
        "localStorage"
    )();
    if (
        !storage ||
        typeof storage.getItem !== "function" ||
        typeof storage.setItem !== "function"
    ) {
        throw new TypeError(
            "createHRZoneControls requires a localStorage runtime"
        );
    }

    return storage;
}

export function getHRZoneControlsRuntime(
    scope: HRZoneControlsRuntimeScope = defaultHRZoneControlsRuntimeScope
): HRZoneControlsRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getDocument(scope).createElement(tagName);
        },
        getStorageItem(key: string): string | null {
            return getLocalStorage(scope).getItem(key);
        },
        isHTMLElement(value: unknown): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
        querySelector<E extends Element = Element>(selector: string): E | null {
            return getDocument(scope).querySelector<E>(selector);
        },
        setStorageItem(key: string, value: string): void {
            getLocalStorage(scope).setItem(key, value);
        },
    };
}
