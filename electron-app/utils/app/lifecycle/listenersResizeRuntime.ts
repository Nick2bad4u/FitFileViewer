import {
    type BrowserAbortControllerConstructor,
    type BrowserCancelAnimationFrame,
    type BrowserClearTimeout,
    type BrowserElementConstructor,
    type BrowserHTMLCanvasElementConstructor,
    type BrowserRequestAnimationFrame,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserCancelAnimationFrame,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserElement,
    getBrowserEventTarget,
    getBrowserHTMLCanvasElement,
    getBrowserRequestAnimationFrame,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";

export type ListenersResizeTimerHandle = BrowserTimerHandle | number;

export interface ListenersResizeRuntimeDocument extends Document {
    readonly mozFullScreenElement?: Element | null | undefined;
    readonly msFullscreenElement?: Element | null | undefined;
    readonly webkitFullscreenElement?: Element | null | undefined;
}

export interface ListenersResizeRuntimeWindow {
    readonly addEventListener?:
        | ((
              type: string,
              listener: EventListenerOrEventListenerObject,
              options?: Readonly<AddEventListenerOptions> | boolean
          ) => void)
        | undefined;
}

type ListenersResizeElementConstructor = BrowserElementConstructor;
type ListenersResizeRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface ListenersResizeRuntimeScope {
    readonly getAbortController: ListenersResizeRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getCancelAnimationFrame: ListenersResizeRuntimeProvider<BrowserCancelAnimationFrame>;
    readonly getClearTimeout: ListenersResizeRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: ListenersResizeRuntimeProvider<ListenersResizeRuntimeDocument>;
    readonly getElement: ListenersResizeRuntimeProvider<BrowserElementConstructor>;
    readonly getHTMLCanvasElement: ListenersResizeRuntimeProvider<BrowserHTMLCanvasElementConstructor>;
    readonly getRequestAnimationFrame: ListenersResizeRuntimeProvider<BrowserRequestAnimationFrame>;
    readonly getResizeTarget: ListenersResizeRuntimeProvider<ListenersResizeRuntimeWindow>;
    readonly getSetTimeout: ListenersResizeRuntimeProvider<BrowserSetTimeout>;
}

export interface ListenersResizeRuntime {
    addResizeListener: (
        listener: EventListenerOrEventListenerObject,
        options: Readonly<AddEventListenerOptions> & {
            readonly signal: AbortSignal;
        }
    ) => void;
    cancelAnimationFrame: (handle: number) => void;
    clearTimeout: (handle: ListenersResizeTimerHandle) => void;
    createAbortController: () => AbortController;
    getFullscreenElement: () => Element | null;
    queryChartCanvases: () => HTMLCanvasElement[];
    queryChartTab: (selector: string) => Element | null;
    requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => number | undefined;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => ListenersResizeTimerHandle;
}

function getOptionalElement(
    value: unknown,
    ElementConstructor: ListenersResizeElementConstructor | undefined
): Element | null {
    return typeof ElementConstructor === "function" &&
        value instanceof ElementConstructor
        ? value
        : null;
}

const defaultListenersResizeRuntimeScope: ListenersResizeRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getCancelAnimationFrame: getBrowserCancelAnimationFrame,
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getElement: getBrowserElement,
    getHTMLCanvasElement: getBrowserHTMLCanvasElement,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
    getResizeTarget: getBrowserEventTarget,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredProvider<T>(
    provider: ListenersResizeRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `listenersResize requires ${providerName} provider`
        );
    }

    return provider;
}

function getAbortController(
    scope: ListenersResizeRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return getRequiredProvider(scope.getAbortController, "AbortController")();
}

function getCancelAnimationFrame(
    scope: ListenersResizeRuntimeScope
): BrowserCancelAnimationFrame | undefined {
    return getRequiredProvider(
        scope.getCancelAnimationFrame,
        "cancelAnimationFrame"
    )();
}

function getClearTimeout(
    scope: ListenersResizeRuntimeScope
): BrowserClearTimeout | undefined {
    return getRequiredProvider(scope.getClearTimeout, "clearTimeout")();
}

function getDocument(
    scope: ListenersResizeRuntimeScope
): ListenersResizeRuntimeDocument | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
}

function getElement(
    scope: ListenersResizeRuntimeScope
): BrowserElementConstructor | undefined {
    return getRequiredProvider(scope.getElement, "Element")();
}

function getHTMLCanvasElement(
    scope: ListenersResizeRuntimeScope
): BrowserHTMLCanvasElementConstructor | undefined {
    return getRequiredProvider(
        scope.getHTMLCanvasElement,
        "HTMLCanvasElement"
    )();
}

function getRequestAnimationFrame(
    scope: ListenersResizeRuntimeScope
): BrowserRequestAnimationFrame | undefined {
    return getRequiredProvider(
        scope.getRequestAnimationFrame,
        "requestAnimationFrame"
    )();
}

function getResizeTarget(
    scope: ListenersResizeRuntimeScope
): ListenersResizeRuntimeWindow | undefined {
    return getRequiredProvider(scope.getResizeTarget, "resizeTarget")();
}

function getSetTimeout(
    scope: ListenersResizeRuntimeScope
): BrowserSetTimeout | undefined {
    return getRequiredProvider(scope.getSetTimeout, "setTimeout")();
}

export function getListenersResizeRuntime(
    scope: ListenersResizeRuntimeScope = defaultListenersResizeRuntimeScope
): ListenersResizeRuntime {
    return {
        addResizeListener(
            listener: EventListenerOrEventListenerObject,
            options: Readonly<AddEventListenerOptions> & {
                readonly signal: AbortSignal;
            }
        ): void {
            getResizeTarget(scope)?.addEventListener?.("resize", listener, {
                ...options,
                signal: options.signal,
            });
        },
        cancelAnimationFrame(handle: number): void {
            getCancelAnimationFrame(scope)?.(handle);
        },
        clearTimeout(handle: ListenersResizeTimerHandle): void {
            const clearTimeoutRef = getClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "listenersResize requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "listenersResize requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getFullscreenElement(): Element | null {
            const runtimeDocument = getDocument(scope);
            if (!runtimeDocument) {
                return null;
            }

            const ElementConstructor = getElement(scope);

            return (
                runtimeDocument.fullscreenElement ||
                getOptionalElement(
                    runtimeDocument.webkitFullscreenElement,
                    ElementConstructor
                ) ||
                getOptionalElement(
                    runtimeDocument.mozFullScreenElement,
                    ElementConstructor
                ) ||
                getOptionalElement(
                    runtimeDocument.msFullscreenElement,
                    ElementConstructor
                )
            );
        },
        queryChartCanvases(): HTMLCanvasElement[] {
            const runtimeDocument = getDocument(scope);
            const CanvasConstructor = getHTMLCanvasElement(scope);
            if (!runtimeDocument || typeof CanvasConstructor !== "function") {
                return [];
            }

            return [
                ...runtimeDocument.querySelectorAll("canvas.chart-canvas"),
            ].filter(
                (canvas): canvas is HTMLCanvasElement =>
                    canvas instanceof CanvasConstructor
            );
        },
        queryChartTab(selector: string): Element | null {
            const runtimeDocument = getDocument(scope);
            return runtimeDocument
                ? querySelectorByIdFlexible(runtimeDocument, selector)
                : null;
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            const requestAnimationFrameRef = getRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef !== "function") {
                return undefined;
            }

            return requestAnimationFrameRef(callback);
        },
        setTimeout(
            callback: () => void,
            timeout: number
        ): ListenersResizeTimerHandle {
            const setTimeoutRef = getSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "listenersResize requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
