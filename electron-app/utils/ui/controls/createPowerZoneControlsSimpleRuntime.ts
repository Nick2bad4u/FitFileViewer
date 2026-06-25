import { getBrowserAbortController } from "../../runtime/browserRuntime.js";

type PowerZoneControlsSimpleStorage = Pick<Storage, "getItem" | "setItem">;

export interface PowerZoneControlsSimpleRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof HTMLElement | undefined)
        | undefined;
    readonly getLocalStorage?:
        | (() => PowerZoneControlsSimpleStorage | undefined)
        | undefined;
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
        getDocument: () => globalThis.document,
        getHTMLElement: () => globalThis.HTMLElement,
        getLocalStorage: () => globalThis.localStorage,
    };

function getScopeDocument(
    scope: PowerZoneControlsSimpleRuntimeScope
): Document | undefined {
    return scope.getDocument?.();
}

function getAbortControllerConstructor(
    scope: PowerZoneControlsSimpleRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
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
): typeof HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
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
    const storage = scope.getLocalStorage?.();
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
