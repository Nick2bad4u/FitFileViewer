export type UnifiedControlBarTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type UnifiedControlBarEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

type UnifiedControlBarMutationObserverConstructor = new (
    callback: MutationCallback
) => MutationObserver;

export interface UnifiedControlBarRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly clearTimeout?:
        | ((handle: UnifiedControlBarTimerHandle) => void)
        | undefined;
    readonly document?: Document | undefined;
    readonly eventTarget?: UnifiedControlBarEventTarget | undefined;
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly MutationObserver?:
        | UnifiedControlBarMutationObserverConstructor
        | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout?: number
          ) => UnifiedControlBarTimerHandle)
        | undefined;
}

export interface UnifiedControlBarRuntime {
    addResizeListener: (
        listener: EventListener,
        options: AddEventListenerOptions
    ) => void;
    clearTimeout: (handle: UnifiedControlBarTimerHandle) => void;
    createAbortController: () => AbortController;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createMutationObserver: (callback: MutationCallback) => MutationObserver;
    getBody: () => HTMLElement;
    isHTMLElement: (element: Element | null) => element is HTMLElement;
    querySelector: (selector: string) => HTMLElement | null;
    removeResizeListener: (listener: EventListener) => void;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => UnifiedControlBarTimerHandle;
}

function getDocument(scope: UnifiedControlBarRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new Error("unifiedControlBar requires a document-like runtime");
    }

    return runtimeDocument;
}

function getEventTarget(
    scope: UnifiedControlBarRuntimeScope
): UnifiedControlBarEventTarget {
    const runtimeEventTarget = scope.eventTarget;
    if (!runtimeEventTarget) {
        throw new Error("unifiedControlBar requires an event-target runtime");
    }

    return runtimeEventTarget;
}

function isHTMLElement(
    scope: UnifiedControlBarRuntimeScope,
    element: Element | null
): element is HTMLElement {
    const HTMLElementConstructor = scope.HTMLElement;
    return (
        typeof HTMLElementConstructor === "function" &&
        element instanceof HTMLElementConstructor
    );
}

export function getUnifiedControlBarRuntime(
    scope: UnifiedControlBarRuntimeScope = globalThis
): UnifiedControlBarRuntime {
    return {
        addResizeListener(
            listener: EventListener,
            options: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Matching removal is exposed through removeResizeListener; callers also pass an AbortSignal.
            getEventTarget(scope).addEventListener("resize", listener, options);
        },
        clearTimeout(handle: UnifiedControlBarTimerHandle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "unifiedControlBar requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
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
            const Observer = scope.MutationObserver;
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
        isHTMLElement(element: Element | null): element is HTMLElement {
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
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "unifiedControlBar requires a setTimeout runtime"
                );
            }
            return setTimeoutRef(callback, timeout);
        },
    };
}
