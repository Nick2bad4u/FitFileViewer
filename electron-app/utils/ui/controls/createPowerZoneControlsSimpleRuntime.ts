import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserLocalStorage,
} from "../../runtime/browserRuntime.js";

type PowerZoneControlsSimpleStorage = Pick<Storage, "getItem" | "setItem">;
type PowerZoneControlsSimpleRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface PowerZoneControlsSimpleRuntimeScope {
    readonly getAbortController: PowerZoneControlsSimpleRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: PowerZoneControlsSimpleRuntimeProvider<Document>;
    readonly getHTMLElement: PowerZoneControlsSimpleRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getLocalStorage: PowerZoneControlsSimpleRuntimeProvider<PowerZoneControlsSimpleStorage>;
}

export interface PowerZoneControlsSimpleRuntime {
    createAbortController: () => AbortController;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    getStorageItem: (key: string) => string | null;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    querySelector: <E extends Element = Element>(selector: string) => E | null;
    setStorageItem: (key: string, value: string) => void;
}

const defaultPowerZoneControlsSimpleRuntimeScope: PowerZoneControlsSimpleRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getHTMLElement: getBrowserHTMLElement,
        getLocalStorage: getBrowserLocalStorage,
    };

function getRequiredProvider<T>(
    provider: PowerZoneControlsSimpleRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `createPowerZoneControlsSimple requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getScopeDocument(
    scope: PowerZoneControlsSimpleRuntimeScope
): Document | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
}

function getAbortControllerConstructor(
    scope: PowerZoneControlsSimpleRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createPowerZoneControlsSimple requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: PowerZoneControlsSimpleRuntimeScope): Document {
    const runtimeDocument = getScopeDocument(scope);
    if (!runtimeDocument) {
        throw new TypeError(
            "createPowerZoneControlsSimple requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: PowerZoneControlsSimpleRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "createPowerZoneControlsSimple requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function getLocalStorage(
    scope: PowerZoneControlsSimpleRuntimeScope
): PowerZoneControlsSimpleStorage {
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
            "createPowerZoneControlsSimple requires a localStorage runtime"
        );
    }

    return storage;
}

export function getPowerZoneControlsSimpleRuntime(
    scope: PowerZoneControlsSimpleRuntimeScope = defaultPowerZoneControlsSimpleRuntimeScope
): PowerZoneControlsSimpleRuntime {
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
