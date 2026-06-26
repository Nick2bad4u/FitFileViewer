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

export type UnifiedControlBarTimerHandle =
    | BrowserTimerHandle
    | number;

type UnifiedControlBarEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

type UnifiedControlBarListenerOptions = Readonly<AddEventListenerOptions>;

export interface UnifiedControlBarRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getEventTarget?:
        | (() => UnifiedControlBarEventTarget | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getMutationObserver?:
        | (() => BrowserMutationObserverConstructor | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => BrowserSetTimeout | undefined)
        | undefined;
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

function getDocument(scope: UnifiedControlBarRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new Error("unifiedControlBar requires a document-like runtime");
    }

    return runtimeDocument;
}

function getEventTarget(
    scope: UnifiedControlBarRuntimeScope
): UnifiedControlBarEventTarget {
    const runtimeEventTarget = scope.getEventTarget?.();
    if (!runtimeEventTarget) {
        throw new Error("unifiedControlBar requires an event-target runtime");
    }

    return runtimeEventTarget;
}

function isHTMLElement(
    scope: UnifiedControlBarRuntimeScope,
    element: Readonly<Element> | null
): element is HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    return (
        typeof HTMLElementConstructor === "function" &&
        element instanceof HTMLElementConstructor
    );
}

export function getUnifiedControlBarRuntime(
    scope: UnifiedControlBarRuntimeScope = getDefaultUnifiedControlBarRuntimeScope()
): UnifiedControlBarRuntime {
    return {
        addResizeListener(
            listener: EventListener,
            options: UnifiedControlBarListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Matching removal is exposed through removeResizeListener; callers also pass an AbortSignal.
            getEventTarget(scope).addEventListener("resize", listener, options);
        },
        clearTimeout(handle: UnifiedControlBarTimerHandle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "unifiedControlBar requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
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
            return getDocument(scope).createElement(tagName);
        },
        createMutationObserver(callback: MutationCallback): MutationObserver {
            const Observer = scope.getMutationObserver?.();
            if (typeof Observer !== "function") {
                throw new TypeError(
                    "unifiedControlBar requires a MutationObserver runtime"
                );
            }

            return new Observer(callback);
        },
        getBody(): HTMLElement {
            return getDocument(scope).body;
        },
        isHTMLElement(
            element: Readonly<Element> | null
        ): element is HTMLElement {
            return isHTMLElement(scope, element);
        },
        querySelector(selector: string): HTMLElement | null {
            const element = getDocument(scope).querySelector(selector);
            return isHTMLElement(scope, element) ? element : null;
        },
        removeResizeListener(listener: EventListener): void {
            getEventTarget(scope).removeEventListener("resize", listener);
        },
        setTimeout(
            callback: () => void,
            timeout: number
        ): UnifiedControlBarTimerHandle {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "unifiedControlBar requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}
