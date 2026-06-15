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
    readonly cancelAnimationFrame?:
        | ((handle: number) => void)
        | undefined;
    readonly clearTimeout?:
        | ((handle: ListenersResizeTimerHandle) => void)
        | undefined;
    readonly document?: ListenersResizeRuntimeDocument | undefined;
    readonly Element?: typeof Element | undefined;
    readonly HTMLCanvasElement?: typeof HTMLCanvasElement | undefined;
    readonly requestAnimationFrame?:
        | ((callback: FrameRequestCallback) => number)
        | undefined;
    readonly setTimeout?:
        | ((
              callback: () => void,
              timeout?: number
          ) => ListenersResizeTimerHandle)
        | undefined;
    readonly window?: ListenersResizeRuntimeWindow | undefined;
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
    requestAnimationFrame: (callback: FrameRequestCallback) => number | undefined;
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

export function getListenersResizeRuntime(
    scope: ListenersResizeRuntimeScope = globalThis
): ListenersResizeRuntime {
    return {
        addResizeListener(
            listener: EventListenerOrEventListenerObject,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            scope.window?.addEventListener?.("resize", listener, {
                ...options,
                signal: options.signal,
            });
        },
        cancelAnimationFrame(handle: number): void {
            scope.cancelAnimationFrame?.(handle);
        },
        clearTimeout(handle: ListenersResizeTimerHandle): void {
            const clearTimeoutRef = scope.clearTimeout;
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "listenersResize requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "listenersResize requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        getFullscreenElement(): Element | null {
            const runtimeDocument = scope.document;
            if (!runtimeDocument) {
                return null;
            }

            return (
                runtimeDocument.fullscreenElement ||
                getOptionalElementProperty(
                    runtimeDocument,
                    "webkitFullscreenElement",
                    scope.Element
                ) ||
                getOptionalElementProperty(
                    runtimeDocument,
                    "mozFullScreenElement",
                    scope.Element
                ) ||
                getOptionalElementProperty(
                    runtimeDocument,
                    "msFullscreenElement",
                    scope.Element
                )
            );
        },
        queryChartCanvases(): HTMLCanvasElement[] {
            const runtimeDocument = scope.document;
            const CanvasConstructor = scope.HTMLCanvasElement;
            if (!runtimeDocument || typeof CanvasConstructor !== "function") {
                return [];
            }

            return [...runtimeDocument.querySelectorAll("canvas.chart-canvas")]
                .filter(
                    (canvas): canvas is HTMLCanvasElement =>
                        canvas instanceof CanvasConstructor
                );
        },
        queryChartTab(selector: string): Element | null {
            const runtimeDocument = scope.document;
            return runtimeDocument
                ? querySelectorByIdFlexible(runtimeDocument, selector)
                : null;
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            if (typeof scope.requestAnimationFrame !== "function") {
                return undefined;
            }

            return scope.requestAnimationFrame(callback);
        },
        setTimeout(
            callback: () => void,
            timeout: number
        ): ListenersResizeTimerHandle {
            const setTimeoutRef = scope.setTimeout;
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "listenersResize requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
