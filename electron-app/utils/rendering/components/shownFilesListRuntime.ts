import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserHTMLElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserEventTarget,
    getBrowserHTMLElement,
    getBrowserSetTimeout,
    getBrowserViewport,
} from "../../runtime/browserRuntime.js";

export type ShownFilesListTimerHandle = BrowserTimerHandle | number;

export interface ShownFilesListViewport {
    readonly height: number;
    readonly width: number;
}

export type ShownFilesListMouseMoveListener = (
    event: Readonly<MouseEvent>
) => void;

type ShownFilesListListenerOptions = Readonly<
    AddEventListenerOptions & { readonly signal: AbortSignal }
>;

interface ShownFilesListMouseMoveEventTarget {
    readonly addEventListener: (
        type: "mousemove",
        listener: ShownFilesListMouseMoveListener,
        options?: Readonly<AddEventListenerOptions> | boolean
    ) => void;
}

export interface ShownFilesListRuntimeScope {
    readonly getAbortController:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDocument: (() => Document | undefined) | undefined;
    readonly getEventTarget:
        | (() => ShownFilesListMouseMoveEventTarget | undefined)
        | undefined;
    readonly getHTMLElement:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getSetTimeout: (() => BrowserSetTimeout | undefined) | undefined;
    readonly getViewport:
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

function getShownFilesListEventTarget():
    | ShownFilesListMouseMoveEventTarget
    | undefined {
    const eventTarget = getBrowserEventTarget();
    if (!eventTarget) {
        return undefined;
    }

    return {
        addEventListener(type, listener, options): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The runtime call site requires and forwards the caller-owned AbortSignal.
            eventTarget.addEventListener(
                type,
                listener as EventListener,
                options
            );
        },
    };
}

const defaultShownFilesListRuntimeScope: ShownFilesListRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getEventTarget: getShownFilesListEventTarget,
    getHTMLElement: getBrowserHTMLElement,
    getSetTimeout: getBrowserSetTimeout,
    getViewport: getBrowserViewport,
};

function getRequiredDocument(scope: ShownFilesListRuntimeScope): Document {
    const documentRef = getScopeDocument(scope);
    if (!documentRef) {
        throw new TypeError("shownFilesList requires a document runtime");
    }

    return documentRef;
}

function getHTMLElementConstructor(
    scope: ShownFilesListRuntimeScope
): BrowserHTMLElementConstructor {
    const getHTMLElement = scope.getHTMLElement;
    if (typeof getHTMLElement !== "function") {
        throw new TypeError("shownFilesList requires an HTMLElement provider");
    }

    const HTMLElementConstructor = getHTMLElement();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError("shownFilesList requires an HTMLElement runtime");
    }

    return HTMLElementConstructor;
}

function getScopeDocument(
    scope: ShownFilesListRuntimeScope
): Document | undefined {
    const getDocument = scope.getDocument;
    if (typeof getDocument !== "function") {
        throw new TypeError("shownFilesList requires a document provider");
    }

    return getDocument();
}

export function getShownFilesListRuntime(
    scope: ShownFilesListRuntimeScope = defaultShownFilesListRuntimeScope
): ShownFilesListRuntime {
    return {
        addBodyThemeChangeListener(
            listener: EventListener,
            options: ShownFilesListListenerOptions
        ): void {
            const body = getScopeDocument(scope)?.body;
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
            const getEventTarget = scope.getEventTarget;
            if (typeof getEventTarget !== "function") {
                throw new TypeError(
                    "shownFilesList requires an event target provider"
                );
            }

            const eventTarget = getEventTarget();
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
            const getClearTimeout = scope.getClearTimeout;
            if (typeof getClearTimeout !== "function") {
                throw new TypeError(
                    "shownFilesList requires a clearTimeout provider"
                );
            }

            const clearTimeoutRef = getClearTimeout();
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
            const getAbortController = scope.getAbortController;
            if (typeof getAbortController !== "function") {
                throw new TypeError(
                    "shownFilesList requires an AbortController provider"
                );
            }

            const AbortControllerConstructor = getAbortController();
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
            const getViewport = scope.getViewport;
            if (typeof getViewport !== "function") {
                throw new TypeError(
                    "shownFilesList requires a viewport provider"
                );
            }

            const viewport = getViewport();
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
            const getSetTimeout = scope.getSetTimeout;
            if (typeof getSetTimeout !== "function") {
                throw new TypeError(
                    "shownFilesList requires a setTimeout provider"
                );
            }

            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "shownFilesList requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}
