import { getBrowserAbortController } from "../../runtime/browserRuntime.js";

import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";

export type ListenersResizeTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

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

type ListenersResizeElementConstructor = abstract new (
    ...args: never[]
) => Element;

export interface ListenersResizeRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getCancelAnimationFrame?:
        | (() => ((handle: number) => void) | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => ((handle: ListenersResizeTimerHandle) => void) | undefined)
        | undefined;
    readonly getDocument?:
        | (() => ListenersResizeRuntimeDocument | undefined)
        | undefined;
    readonly getElement?: (() => typeof Element | undefined) | undefined;
    readonly getHTMLCanvasElement?:
        | (() => typeof HTMLCanvasElement | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => ((callback: FrameRequestCallback) => number) | undefined)
        | undefined;
    readonly getResizeTarget?:
        | (() => ListenersResizeRuntimeWindow | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() =>
              | ((
                    callback: () => void,
                    timeout?: number
                ) => ListenersResizeTimerHandle)
              | undefined)
        | undefined;
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
    getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getElement: () => globalThis.Element,
    getHTMLCanvasElement: () => globalThis.HTMLCanvasElement,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
    getResizeTarget: () => globalThis,
    getSetTimeout: () => globalThis.setTimeout,
};

function getAbortController(
    scope: ListenersResizeRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.();
}

function getCancelAnimationFrame(
    scope: ListenersResizeRuntimeScope
): ((handle: number) => void) | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getClearTimeout(
    scope: ListenersResizeRuntimeScope
): ((handle: ListenersResizeTimerHandle) => void) | undefined {
    return scope.getClearTimeout?.();
}

function getDocument(
    scope: ListenersResizeRuntimeScope
): ListenersResizeRuntimeDocument | undefined {
    return scope.getDocument?.();
}

function getElement(
    scope: ListenersResizeRuntimeScope
): typeof Element | undefined {
    return scope.getElement?.();
}

function getHTMLCanvasElement(
    scope: ListenersResizeRuntimeScope
): typeof HTMLCanvasElement | undefined {
    return scope.getHTMLCanvasElement?.();
}

function getRequestAnimationFrame(
    scope: ListenersResizeRuntimeScope
): ((callback: FrameRequestCallback) => number) | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getResizeTarget(
    scope: ListenersResizeRuntimeScope
): ListenersResizeRuntimeWindow | undefined {
    return scope.getResizeTarget?.();
}

function getSetTimeout(
    scope: ListenersResizeRuntimeScope
):
    | ((callback: () => void, timeout?: number) => ListenersResizeTimerHandle)
    | undefined {
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
