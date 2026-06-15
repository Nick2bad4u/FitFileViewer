type HRZoneControlsStorage = Pick<Storage, "getItem" | "setItem">;

export interface HRZoneControlsRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly localStorage?: HRZoneControlsStorage | undefined;
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
    scope: HRZoneControlsRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor =
        scope.AbortController ?? scope.document?.defaultView?.AbortController;
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "createHRZoneControls requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocument(scope: HRZoneControlsRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("createHRZoneControls requires a document runtime");
    }

    return runtimeDocument;
}

function getHTMLElementConstructor(
    scope: HRZoneControlsRuntimeScope
): typeof HTMLElement {
    const HTMLElementConstructor =
        scope.HTMLElement ?? scope.document?.defaultView?.HTMLElement;
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
    const storage = scope.localStorage ?? scope.document?.defaultView?.localStorage;
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
