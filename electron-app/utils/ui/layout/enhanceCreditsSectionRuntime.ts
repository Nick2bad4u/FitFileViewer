import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLElementConstructor,
    getBrowserAbortController,
    getBrowserCancelAnimationFrame,
    getBrowserDocument,
    getBrowserEventTarget,
    getBrowserHTMLElement,
    getBrowserMutationObserver,
    getBrowserRequestAnimationFrame,
    getBrowserResizeObserver,
} from "../../runtime/browserRuntime.js";

export type CreditsMarqueeAnimationFrameHandle = number;

type CreditsMarqueeEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

type CreditsResizeObserverConstructor = new (
    callback: ResizeObserverCallback
) => ResizeObserver;

type CreditsMutationObserverConstructor = new (
    callback: MutationCallback
) => MutationObserver;
type CreditsCancelAnimationFrame = (
    handle: CreditsMarqueeAnimationFrameHandle
) => void;
type CreditsRequestAnimationFrame = (
    callback: FrameRequestCallback
) => CreditsMarqueeAnimationFrameHandle;

type CreditsMarqueeRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface CreditsMarqueeRuntimeScope {
    readonly getAbortController: CreditsMarqueeRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getCancelAnimationFrame: CreditsMarqueeRuntimeProvider<CreditsCancelAnimationFrame>;
    readonly getDocument: CreditsMarqueeRuntimeProvider<Document>;
    readonly getEventTarget: CreditsMarqueeRuntimeProvider<CreditsMarqueeEventTarget>;
    readonly getHTMLElement: CreditsMarqueeRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getMutationObserver: CreditsMarqueeRuntimeProvider<CreditsMutationObserverConstructor>;
    readonly getRequestAnimationFrame: CreditsMarqueeRuntimeProvider<CreditsRequestAnimationFrame>;
    readonly getResizeObserver: CreditsMarqueeRuntimeProvider<CreditsResizeObserverConstructor>;
}

export interface CreditsMarqueeRuntime {
    addResizeListener: (
        listener: EventListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    cancelAnimationFrame: (handle: CreditsMarqueeAnimationFrameHandle) => void;
    createAbortController: () => AbortController;
    createMutationObserver: (callback: MutationCallback) => MutationObserver;
    createResizeObserver: (
        callback: ResizeObserverCallback
    ) => ResizeObserver | undefined;
    isHTMLElement: (
        element: Readonly<Element> | null
    ) => element is HTMLElement;
    queryCreditsSections: (selector: string) => Element[];
    removeResizeListener: (listener: EventListener) => void;
    requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => CreditsMarqueeAnimationFrameHandle | undefined;
}

const defaultCreditsMarqueeRuntimeScope: CreditsMarqueeRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getCancelAnimationFrame: getBrowserCancelAnimationFrame,
    getDocument: getBrowserDocument,
    getEventTarget: getBrowserEventTarget,
    getHTMLElement: getBrowserHTMLElement,
    getMutationObserver: getBrowserMutationObserver,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
    getResizeObserver: getBrowserResizeObserver,
};

function getDocument(
    getDocumentProvider: () => Document | undefined
): Document {
    const runtimeDocument = getDocumentProvider();
    if (!runtimeDocument) {
        throw new TypeError("credits marquee requires a document-like runtime");
    }

    return runtimeDocument;
}

function getEventTarget(
    getEventTargetProvider: () => CreditsMarqueeEventTarget | undefined
): CreditsMarqueeEventTarget {
    const eventTarget = getEventTargetProvider();
    if (!eventTarget) {
        throw new TypeError("credits marquee requires an event target runtime");
    }

    return eventTarget;
}

function isHTMLElement(
    getHTMLElement: () => BrowserHTMLElementConstructor | undefined,
    element: Readonly<Element> | null
): element is HTMLElement {
    const HTMLElementConstructor = getHTMLElement();
    return (
        typeof HTMLElementConstructor === "function" &&
        element instanceof HTMLElementConstructor
    );
}

export function getCreditsMarqueeRuntime(
    scope: CreditsMarqueeRuntimeScope = defaultCreditsMarqueeRuntimeScope
): CreditsMarqueeRuntime {
    const getAbortController = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    );
    const getCancelAnimationFrame = getRequiredProvider(
        scope.getCancelAnimationFrame,
        "cancelAnimationFrame"
    );
    const getDocumentProvider = getRequiredProvider(
        scope.getDocument,
        "document"
    );
    const getEventTargetProvider = getRequiredProvider(
        scope.getEventTarget,
        "event target"
    );
    const getHTMLElement = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    );
    const getMutationObserver = getRequiredProvider(
        scope.getMutationObserver,
        "MutationObserver"
    );
    const getRequestAnimationFrame = getRequiredProvider(
        scope.getRequestAnimationFrame,
        "requestAnimationFrame"
    );
    const getResizeObserver = getRequiredProvider(
        scope.getResizeObserver,
        "ResizeObserver"
    );

    return {
        addResizeListener(
            listener: EventListener,
            options: Readonly<AddEventListenerOptions>
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Matching removal is exposed through removeResizeListener; callers also pass an AbortSignal.
            getEventTarget(getEventTargetProvider).addEventListener(
                "resize",
                listener,
                options
            );
        },
        cancelAnimationFrame(handle: CreditsMarqueeAnimationFrameHandle): void {
            const cancelAnimationFrame = getCancelAnimationFrame();
            if (typeof cancelAnimationFrame === "function") {
                cancelAnimationFrame(handle);
            }
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "credits marquee requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createMutationObserver(callback: MutationCallback): MutationObserver {
            const Observer = getMutationObserver();
            if (typeof Observer !== "function") {
                throw new TypeError(
                    "credits marquee requires a MutationObserver runtime"
                );
            }

            return new Observer(callback);
        },
        createResizeObserver(
            callback: ResizeObserverCallback
        ): ResizeObserver | undefined {
            const Observer = getResizeObserver();
            if (typeof Observer !== "function") {
                return undefined;
            }

            return new Observer(callback);
        },
        isHTMLElement(
            element: Readonly<Element> | null
        ): element is HTMLElement {
            return isHTMLElement(getHTMLElement, element);
        },
        queryCreditsSections(selector: string): Element[] {
            return [
                ...getDocument(getDocumentProvider).querySelectorAll(selector),
            ];
        },
        removeResizeListener(listener: EventListener): void {
            getEventTarget(getEventTargetProvider).removeEventListener(
                "resize",
                listener
            );
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): CreditsMarqueeAnimationFrameHandle | undefined {
            const requestAnimationFrame = getRequestAnimationFrame();
            if (typeof requestAnimationFrame !== "function") {
                return undefined;
            }

            return requestAnimationFrame(callback);
        },
    };
}

function getRequiredProvider<T>(
    provider: CreditsMarqueeRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `credits marquee requires ${providerName} provider`
        );
    }

    return provider;
}
