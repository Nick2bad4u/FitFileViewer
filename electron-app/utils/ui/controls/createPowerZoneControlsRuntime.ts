import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserLocalStorage,
} from "../../runtime/browserRuntime.js";

type PowerZoneControlsStorage = Pick<Storage, "getItem" | "setItem">;
type PowerZoneControlsRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface PowerZoneControlsRuntimeScope {
    readonly getAbortController: PowerZoneControlsRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: PowerZoneControlsRuntimeProvider<Document>;
    readonly getHTMLElement: PowerZoneControlsRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getLocalStorage: PowerZoneControlsRuntimeProvider<PowerZoneControlsStorage>;
}

export interface PowerZoneControlsRuntime {
    createAbortController: () => AbortController;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    getStorageItem: (key: string) => string | null;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    querySelector: <E extends Element = Element>(selector: string) => E | null;
    setStorageItem: (key: string, value: string) => void;
}

const defaultPowerZoneControlsRuntimeScope: PowerZoneControlsRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getLocalStorage: getBrowserLocalStorage,
};

function getRequiredProvider<T>(
    provider: PowerZoneControlsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `createPowerZoneControls requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getScopeDocument(
    scope: PowerZoneControlsRuntimeScope
): Document | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
}

function getAbortControllerConstructor(
    scope: PowerZoneControlsRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createPowerZoneControls requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: PowerZoneControlsRuntimeScope): Document {
    const runtimeDocument = getScopeDocument(scope);
    if (!runtimeDocument) {
        throw new TypeError(
            "createPowerZoneControls requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: PowerZoneControlsRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "createPowerZoneControls requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function getLocalStorage(
    scope: PowerZoneControlsRuntimeScope
): PowerZoneControlsStorage {
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
            "createPowerZoneControls requires a localStorage runtime"
        );
    }

    return storage;
}

export function getPowerZoneControlsRuntime(
    scope: PowerZoneControlsRuntimeScope = defaultPowerZoneControlsRuntimeScope
): PowerZoneControlsRuntime {
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
