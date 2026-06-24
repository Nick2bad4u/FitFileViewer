export type ShownFilesListTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

export interface ShownFilesListViewport {
    readonly height: number;
    readonly width: number;
}

export type ShownFilesListMouseMoveListener = (
    event: Readonly<MouseEvent>
) => void;

type ShownFilesListClearTimeout = typeof globalThis.clearTimeout;
type ShownFilesListListenerOptions = Readonly<
    AddEventListenerOptions & { readonly signal: AbortSignal }
>;
type ShownFilesListSetTimeout = (
    callback: () => void,
    timeout: number
) => ShownFilesListTimerHandle;

interface ShownFilesListMouseMoveEventTarget {
    readonly addEventListener: (
        type: "mousemove",
        listener: ShownFilesListMouseMoveListener,
        options?: Readonly<AddEventListenerOptions> | boolean
    ) => void;
}

export interface ShownFilesListRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => ShownFilesListClearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getEventTarget?:
        | (() => ShownFilesListMouseMoveEventTarget | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => ShownFilesListSetTimeout | undefined)
        | undefined;
    readonly getViewport?:
        | (() => ShownFilesListViewport | undefined)
        | undefined;
}

export interface ShownFilesListRuntime {
    readonly addBodyThemeChangeListener: (
        listener: EventListener,
        options: ShownFilesListListenerOptions
    ) => void;
    readonly addMouseMoveListener: (
        listener: ShownFilesListMouseMoveListener,
        options: ShownFilesListListenerOptions
    ) => void;
    readonly clearTimeout: (handle: ShownFilesListTimerHandle) => void;
    readonly createAbortController: () => AbortController;
    readonly appendToBody: (element: HTMLElement) => void;
    readonly createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    readonly getViewport: () => ShownFilesListViewport;
    readonly isHTMLElement: (value: unknown) => value is HTMLElement;
    readonly isDarkTheme: () => boolean;
    readonly querySelectorAll: (selector: string) => Iterable<Element>;
    readonly setTimeout: (
        callback: () => void,
        timeout: number
    ) => ShownFilesListTimerHandle;
}

const defaultShownFilesListRuntimeScope: ShownFilesListRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getEventTarget: () => globalThis,
    getHTMLElement: () => globalThis.HTMLElement,
    getSetTimeout: () => globalThis.setTimeout,
    getViewport: () => ({
        height: globalThis.innerHeight,
        width: globalThis.innerWidth,
    }),
};

function getRequiredDocument(scope: ShownFilesListRuntimeScope): Document {
    const documentRef = scope.getDocument?.();
    if (!documentRef) {
        throw new TypeError("shownFilesList requires a document runtime");
    }

    return documentRef;
}

function getHTMLElementConstructor(
    scope: ShownFilesListRuntimeScope
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor =
        scope.getHTMLElement?.() ??
        scope.getDocument?.()?.defaultView?.HTMLElement;
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError("shownFilesList requires an HTMLElement runtime");
    }

    return HTMLElementConstructor;
}

export function getShownFilesListRuntime(
    scope: ShownFilesListRuntimeScope = defaultShownFilesListRuntimeScope
): ShownFilesListRuntime {
    return {
        addBodyThemeChangeListener(
            listener: EventListener,
            options: ShownFilesListListenerOptions
        ): void {
            const body = scope.getDocument?.()?.body;
            if (!body) {
                throw new TypeError(
                    "shownFilesList requires a document body runtime"
                );
            }

            body.addEventListener("themechange", listener, {
                ...options,
                signal: options.signal,
            });
        },
        addMouseMoveListener(
            listener: ShownFilesListMouseMoveListener,
            options: ShownFilesListListenerOptions
        ): void {
            const eventTarget = scope.getEventTarget?.();
            if (!eventTarget) {
                throw new TypeError(
                    "shownFilesList requires an event target runtime"
                );
            }

            eventTarget.addEventListener("mousemove", listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "shownFilesList requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        appendToBody(element): void {
            getRequiredDocument(scope).body.append(element);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "shownFilesList requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            return getRequiredDocument(scope).createElement(tagName);
        },
        getViewport(): ShownFilesListViewport {
            const viewport = scope.getViewport?.();
            const width = viewport?.width;
            const height = viewport?.height;
            if (typeof width !== "number" || typeof height !== "number") {
                throw new TypeError(
                    "shownFilesList requires a viewport runtime"
                );
            }

            return { height, width };
        },
        isHTMLElement(value): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
        isDarkTheme(): boolean {
            return getRequiredDocument(scope).body.classList.contains(
                "theme-dark"
            );
        },
        querySelectorAll(selector): Iterable<Element> {
            return getRequiredDocument(scope).querySelectorAll(selector);
        },
        setTimeout(callback, timeout): ShownFilesListTimerHandle {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "shownFilesList requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}
