import {
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

export interface CreditsMarqueeRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getCancelAnimationFrame?:
        | (() => CreditsCancelAnimationFrame | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getEventTarget?:
        | (() => CreditsMarqueeEventTarget | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
        | undefined;
    readonly getMutationObserver?:
        | (() => CreditsMutationObserverConstructor | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => CreditsRequestAnimationFrame | undefined)
        | undefined;
    readonly getResizeObserver?:
        | (() => CreditsResizeObserverConstructor | undefined)
        | undefined;
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

function getDocument(scope: CreditsMarqueeRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("credits marquee requires a document-like runtime");
    }

    return runtimeDocument;
}

function getEventTarget(
    scope: CreditsMarqueeRuntimeScope
): CreditsMarqueeEventTarget {
    const eventTarget = scope.getEventTarget?.();
    if (!eventTarget) {
        throw new TypeError("credits marquee requires an event target runtime");
    }

    return eventTarget;
}

function isHTMLElement(
    scope: CreditsMarqueeRuntimeScope,
    element: Readonly<Element> | null
): element is HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
    return (
        typeof HTMLElementConstructor === "function" &&
        element instanceof HTMLElementConstructor
    );
}

export function getCreditsMarqueeRuntime(
    scope: CreditsMarqueeRuntimeScope = defaultCreditsMarqueeRuntimeScope
): CreditsMarqueeRuntime {
    return {
        addResizeListener(
            listener: EventListener,
            options: Readonly<AddEventListenerOptions>
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Matching removal is exposed through removeResizeListener; callers also pass an AbortSignal.
            getEventTarget(scope).addEventListener("resize", listener, options);
        },
        cancelAnimationFrame(handle: CreditsMarqueeAnimationFrameHandle): void {
            const cancelAnimationFrame = scope.getCancelAnimationFrame?.();
            if (typeof cancelAnimationFrame === "function") {
                cancelAnimationFrame(handle);
            }
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "credits marquee requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createMutationObserver(callback: MutationCallback): MutationObserver {
            const Observer = scope.getMutationObserver?.();
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
            const Observer = scope.getResizeObserver?.();
            if (typeof Observer !== "function") {
                return undefined;
            }

            return new Observer(callback);
        },
        isHTMLElement(
            element: Readonly<Element> | null
        ): element is HTMLElement {
            return isHTMLElement(scope, element);
        },
        queryCreditsSections(selector: string): Element[] {
            return [...getDocument(scope).querySelectorAll(selector)];
        },
        removeResizeListener(listener: EventListener): void {
            getEventTarget(scope).removeEventListener("resize", listener);
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): CreditsMarqueeAnimationFrameHandle | undefined {
            const requestAnimationFrame = scope.getRequestAnimationFrame?.();
            if (typeof requestAnimationFrame !== "function") {
                return undefined;
            }

            return requestAnimationFrame(callback);
        },
    };
}
