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

export interface CreditsMarqueeRuntimeScope {
    readonly AbortController?: typeof globalThis.AbortController | undefined;
    readonly cancelAnimationFrame?:
        | ((handle: CreditsMarqueeAnimationFrameHandle) => void)
        | undefined;
    readonly document?: Document | undefined;
    readonly eventTarget?: CreditsMarqueeEventTarget | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly MutationObserver?: CreditsMutationObserverConstructor | undefined;
    readonly requestAnimationFrame?:
        | ((callback: FrameRequestCallback) => CreditsMarqueeAnimationFrameHandle)
        | undefined;
    readonly ResizeObserver?: CreditsResizeObserverConstructor | undefined;
}

export interface CreditsMarqueeRuntime {
    addResizeListener: (
        listener: EventListener,
        options: AddEventListenerOptions
    ) => void;
    cancelAnimationFrame: (
        handle: CreditsMarqueeAnimationFrameHandle
    ) => void;
    createAbortController: () => AbortController;
    createMutationObserver: (callback: MutationCallback) => MutationObserver;
    createResizeObserver: (
        callback: ResizeObserverCallback
    ) => ResizeObserver | undefined;
    isHTMLElement: (element: Element | null) => element is HTMLElement;
    queryCreditsSections: (selector: string) => Element[];
    removeResizeListener: (listener: EventListener) => void;
    requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => CreditsMarqueeAnimationFrameHandle | undefined;
}

const defaultCreditsMarqueeRuntimeScope: CreditsMarqueeRuntimeScope =
    globalThis;

function getDocument(scope: CreditsMarqueeRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("credits marquee requires a document-like runtime");
    }

    return runtimeDocument;
}

function getEventTarget(
    scope: CreditsMarqueeRuntimeScope
): CreditsMarqueeEventTarget {
    return scope.eventTarget ?? globalThis;
}

function isHTMLElement(
    scope: CreditsMarqueeRuntimeScope,
    element: Element | null
): element is HTMLElement {
    const HTMLElementConstructor = scope.HTMLElement;
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
            options: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Matching removal is exposed through removeResizeListener; callers also pass an AbortSignal.
            getEventTarget(scope).addEventListener("resize", listener, options);
        },
        cancelAnimationFrame(handle: CreditsMarqueeAnimationFrameHandle): void {
            if (typeof scope.cancelAnimationFrame === "function") {
                scope.cancelAnimationFrame(handle);
            }
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "credits marquee requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createMutationObserver(callback: MutationCallback): MutationObserver {
            const Observer = scope.MutationObserver;
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
            const Observer = scope.ResizeObserver;
            if (typeof Observer !== "function") {
                return undefined;
            }

            return new Observer(callback);
        },
        isHTMLElement(element: Element | null): element is HTMLElement {
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
            if (typeof scope.requestAnimationFrame !== "function") {
                return undefined;
            }

            return scope.requestAnimationFrame(callback);
        },
    };
}
