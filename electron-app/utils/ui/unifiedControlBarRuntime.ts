import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserHTMLElementConstructor,
    type BrowserMutationObserverConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserEventTarget,
    getBrowserHTMLElement,
    getBrowserMutationObserver,
    getBrowserSetTimeout,
} from "../runtime/browserRuntime.js";

export type UnifiedControlBarTimerHandle = BrowserTimerHandle | number;

type UnifiedControlBarEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

type UnifiedControlBarListenerOptions = Readonly<AddEventListenerOptions>;
type UnifiedControlBarRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface UnifiedControlBarRuntimeScope {
    readonly getAbortController: UnifiedControlBarRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: UnifiedControlBarRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: UnifiedControlBarRuntimeProvider<Document>;
    readonly getEventTarget: UnifiedControlBarRuntimeProvider<UnifiedControlBarEventTarget>;
    readonly getHTMLElement: UnifiedControlBarRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getMutationObserver: UnifiedControlBarRuntimeProvider<BrowserMutationObserverConstructor>;
    readonly getSetTimeout: UnifiedControlBarRuntimeProvider<BrowserSetTimeout>;
}

export interface UnifiedControlBarRuntime {
    addResizeListener: (
        listener: EventListener,
        options: UnifiedControlBarListenerOptions
    ) => void;
    clearTimeout: (handle: UnifiedControlBarTimerHandle) => void;
    createAbortController: () => AbortController;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createMutationObserver: (callback: MutationCallback) => MutationObserver;
    getBody: () => HTMLElement;
    isHTMLElement: (
        element: Readonly<Element> | null
    ) => element is HTMLElement;
    querySelector: (selector: string) => HTMLElement | null;
    removeResizeListener: (listener: EventListener) => void;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => UnifiedControlBarTimerHandle;
}

function getDefaultUnifiedControlBarRuntimeScope(): UnifiedControlBarRuntimeScope {
    return {
        getAbortController: getBrowserAbortController,
        getClearTimeout: getBrowserClearTimeout,
        getDocument: getBrowserDocument,
        getEventTarget: getBrowserEventTarget,
        getHTMLElement: getBrowserHTMLElement,
        getMutationObserver: getBrowserMutationObserver,
        getSetTimeout: getBrowserSetTimeout,
    };
}

function getDocument(getDocumentRef: () => Document | undefined): Document {
    const runtimeDocument = getDocumentRef();
    if (!runtimeDocument) {
        throw new Error("unifiedControlBar requires a document-like runtime");
    }

    return runtimeDocument;
}

function getEventTarget(
    getEventTargetRef: () => UnifiedControlBarEventTarget | undefined
): UnifiedControlBarEventTarget {
    const runtimeEventTarget = getEventTargetRef();
    if (!runtimeEventTarget) {
        throw new Error("unifiedControlBar requires an event-target runtime");
    }

    return runtimeEventTarget;
}

function isHTMLElement(
    getHTMLElementRef: () => BrowserHTMLElementConstructor | undefined,
    element: Readonly<Element> | null
): element is HTMLElement {
    const HTMLElementConstructor = getHTMLElementRef();
    return (
        typeof HTMLElementConstructor === "function" &&
        element instanceof HTMLElementConstructor
    );
}

export function getUnifiedControlBarRuntime(
    scope: UnifiedControlBarRuntimeScope = getDefaultUnifiedControlBarRuntimeScope()
): UnifiedControlBarRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "an AbortController"
    );
    const getClearTimeout = getRequiredProvider(
        scope.getClearTimeout,
        "a clearTimeout"
    );
    const getDocumentRef = getRequiredProvider(scope.getDocument, "a document");
    const getEventTargetRef = getRequiredProvider(
        scope.getEventTarget,
        "an event-target"
    );
    const getHTMLElementRef = getRequiredProvider(
        scope.getHTMLElement,
        "an HTMLElement"
    );
    const getMutationObserver = getRequiredProvider(
        scope.getMutationObserver,
        "a MutationObserver"
    );
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "a setTimeout"
    );

    return {
        addResizeListener(
            listener: EventListener,
            options: UnifiedControlBarListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Matching removal is exposed through removeResizeListener; callers also pass an AbortSignal.
            getEventTarget(getEventTargetRef).addEventListener(
                "resize",
                listener,
                options
            );
        },
        clearTimeout(handle: UnifiedControlBarTimerHandle): void {
            const clearTimeoutRef = getClearTimeout();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "unifiedControlBar requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "unifiedControlBar requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getDocument(getDocumentRef).createElement(tagName);
        },
        createMutationObserver(callback: MutationCallback): MutationObserver {
            const Observer = getMutationObserver();
            if (typeof Observer !== "function") {
                throw new TypeError(
                    "unifiedControlBar requires a MutationObserver runtime"
                );
            }

            return new Observer(callback);
        },
        getBody(): HTMLElement {
            return getDocument(getDocumentRef).body;
        },
        isHTMLElement(
            element: Readonly<Element> | null
        ): element is HTMLElement {
            return isHTMLElement(getHTMLElementRef, element);
        },
        querySelector(selector: string): HTMLElement | null {
            const element = getDocument(getDocumentRef).querySelector(selector);
            return isHTMLElement(getHTMLElementRef, element) ? element : null;
        },
        removeResizeListener(listener: EventListener): void {
            getEventTarget(getEventTargetRef).removeEventListener(
                "resize",
                listener
            );
        },
        setTimeout(
            callback: () => void,
            timeout: number
        ): UnifiedControlBarTimerHandle {
            const setTimeoutRef = getSetTimeout();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "unifiedControlBar requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}

function getRequiredProvider<T>(
    provider: UnifiedControlBarRuntimeProvider<T>,
    providerLabel: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `unifiedControlBar requires ${providerLabel} provider`
        );
    }

    return provider;
}
