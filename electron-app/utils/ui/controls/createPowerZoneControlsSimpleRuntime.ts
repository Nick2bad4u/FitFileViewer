type PowerZoneControlsSimpleStorage = Pick<Storage, "getItem" | "setItem">;

export interface PowerZoneControlsSimpleRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly localStorage?: PowerZoneControlsSimpleStorage | undefined;
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
        get AbortController() {
            return globalThis.AbortController;
        },
        get document() {
            return globalThis.document;
        },
        get HTMLElement() {
            return globalThis.HTMLElement;
        },
        get localStorage() {
            return globalThis.localStorage;
        },
    };

function getAbortControllerConstructor(
    scope: PowerZoneControlsSimpleRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ?? scope.document?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createPowerZoneControlsSimple requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: PowerZoneControlsSimpleRuntimeScope): Document {
    const runtimeDocument = scope.document;
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
    const HTMLElementConstructor =
        scope.HTMLElement ?? scope.document?.defaultView?.HTMLElement;
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
    const storage =
        scope.localStorage ?? scope.document?.defaultView?.localStorage;
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
        querySelector<E extends Element = Element>(
            selector: string
        ): E | null {
            return getDocument(scope).querySelector<E>(selector);
        },
        setStorageItem(key: string, value: string): void {
            getLocalStorage(scope).setItem(key, value);
        },
    };
}
