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

export interface ListenersResizeRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getCancelAnimationFrame?:
        | (() => BrowserCancelAnimationFrame | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getDocument?:
        | (() => ListenersResizeRuntimeDocument | undefined)
        | undefined;
    readonly getElement?:
        | (() => BrowserElementConstructor | undefined)
        | undefined;
    readonly getHTMLCanvasElement?:
        | (() => BrowserHTMLCanvasElementConstructor | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => BrowserRequestAnimationFrame | undefined)
        | undefined;
    readonly getResizeTarget?:
        | (() => ListenersResizeRuntimeWindow | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
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

function getOptionalElementProperty(
    target: object,
    propertyKey: string,
    ElementConstructor: ListenersResizeElementConstructor | undefined
): Element | null {
    const value: unknown = Reflect.get(target, propertyKey);
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

function getAbortController(
    scope: ListenersResizeRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return scope.getAbortController?.();
}

function getCancelAnimationFrame(
    scope: ListenersResizeRuntimeScope
): BrowserCancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getClearTimeout(
    scope: ListenersResizeRuntimeScope
): BrowserClearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getDocument(
    scope: ListenersResizeRuntimeScope
): ListenersResizeRuntimeDocument | undefined {
    return scope.getDocument?.();
}

function getElement(
    scope: ListenersResizeRuntimeScope
): BrowserElementConstructor | undefined {
    return scope.getElement?.();
}

function getHTMLCanvasElement(
    scope: ListenersResizeRuntimeScope
): BrowserHTMLCanvasElementConstructor | undefined {
    return scope.getHTMLCanvasElement?.();
}

function getRequestAnimationFrame(
    scope: ListenersResizeRuntimeScope
): BrowserRequestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getResizeTarget(
    scope: ListenersResizeRuntimeScope
): ListenersResizeRuntimeWindow | undefined {
    return scope.getResizeTarget?.();
}

function getSetTimeout(
    scope: ListenersResizeRuntimeScope
): BrowserSetTimeout | undefined {
    return scope.getSetTimeout?.();
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
                getOptionalElementProperty(
                    runtimeDocument,
                    "webkitFullscreenElement",
                    ElementConstructor
                ) ||
                getOptionalElementProperty(
                    runtimeDocument,
                    "mozFullScreenElement",
                    ElementConstructor
                ) ||
                getOptionalElementProperty(
                    runtimeDocument,
                    "msFullscreenElement",
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
