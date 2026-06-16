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
              options?: AddEventListenerOptions | boolean
          ) => void)
        | undefined;
}

export interface ListenersResizeRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly cancelAnimationFrame?: ((handle: number) => void) | undefined;
    readonly clearTimeout?:
        | ((handle: ListenersResizeTimerHandle) => void)
        | undefined;
    readonly document?: ListenersResizeRuntimeDocument | undefined;
    readonly Element?: typeof Element | undefined;
    readonly HTMLCanvasElement?: typeof HTMLCanvasElement | undefined;
    readonly requestAnimationFrame?:
        | ((callback: FrameRequestCallback) => number)
        | undefined;
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
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout?: number
          ) => ListenersResizeTimerHandle)
        | undefined;
    readonly resizeTarget?: ListenersResizeRuntimeWindow | undefined;
}

export interface ListenersResizeRuntime {
    addResizeListener: (
        listener: EventListenerOrEventListenerObject,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
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
    ElementConstructor: typeof Element | undefined
): Element | null {
    const value: unknown = Reflect.get(target, propertyKey);
    return typeof ElementConstructor === "function" &&
        value instanceof ElementConstructor
        ? value
        : null;
}

const defaultListenersResizeRuntimeScope: ListenersResizeRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
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
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getCancelAnimationFrame(
    scope: ListenersResizeRuntimeScope
): ((handle: number) => void) | undefined {
    return scope.getCancelAnimationFrame?.() ?? scope.cancelAnimationFrame;
}

function getClearTimeout(
    scope: ListenersResizeRuntimeScope
): ((handle: ListenersResizeTimerHandle) => void) | undefined {
    return scope.getClearTimeout?.() ?? scope.clearTimeout;
}

function getDocument(
    scope: ListenersResizeRuntimeScope
): ListenersResizeRuntimeDocument | undefined {
    return scope.getDocument?.() ?? scope.document;
}

function getElement(
    scope: ListenersResizeRuntimeScope
): typeof Element | undefined {
    return scope.getElement?.() ?? scope.Element;
}

function getHTMLCanvasElement(
    scope: ListenersResizeRuntimeScope
): typeof HTMLCanvasElement | undefined {
    return scope.getHTMLCanvasElement?.() ?? scope.HTMLCanvasElement;
}

function getRequestAnimationFrame(
    scope: ListenersResizeRuntimeScope
): ((callback: FrameRequestCallback) => number) | undefined {
    return scope.getRequestAnimationFrame?.() ?? scope.requestAnimationFrame;
}

function getResizeTarget(
    scope: ListenersResizeRuntimeScope
): ListenersResizeRuntimeWindow | undefined {
    return scope.getResizeTarget?.() ?? scope.resizeTarget;
}

function getSetTimeout(
    scope: ListenersResizeRuntimeScope
):
    | ((callback: () => void, timeout?: number) => ListenersResizeTimerHandle)
    | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
}

export function getListenersResizeRuntime(
    scope: ListenersResizeRuntimeScope = defaultListenersResizeRuntimeScope
): ListenersResizeRuntime {
    return {
        addResizeListener(
            listener: EventListenerOrEventListenerObject,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
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
