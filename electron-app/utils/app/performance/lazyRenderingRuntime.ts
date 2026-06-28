import {
    type BrowserHTMLElementConstructor,
    type BrowserTimerHandle,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserIntersectionObserver,
    getBrowserRequestAnimationFrame,
    getBrowserRequestIdleCallback,
    getBrowserSetTimeout,
    getBrowserViewport,
} from "../../runtime/browserRuntime.js";

export type LazyRenderingTimeoutHandle = BrowserTimerHandle | number;

type LazyRenderingRequestAnimationFrame = (
    callback: FrameRequestCallback
) => number;

type LazyRenderingRequestIdleCallback = (
    callback: IdleRequestCallback,
    options?: Readonly<IdleRequestOptions>
) => number;

type LazyRenderingSetTimeout = (
    callback: () => void,
    timeout?: number
) => LazyRenderingTimeoutHandle;

export interface LazyRenderingRuntimeDocument {
    readonly documentElement?:
        | {
              readonly clientHeight?: number | undefined;
              readonly clientWidth?: number | undefined;
          }
        | undefined;
}

export interface LazyRenderingRuntimeScope {
    readonly getDocument?:
        | (() => LazyRenderingRuntimeDocument | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getIntersectionObserver?:
        | (() => typeof IntersectionObserver | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => LazyRenderingRequestAnimationFrame | undefined)
        | undefined;
    readonly getRequestIdleCallback?:
        | (() => LazyRenderingRequestIdleCallback | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => LazyRenderingSetTimeout | undefined)
        | undefined;
    readonly getViewport?: (() => LazyRenderingViewport | undefined) | undefined;
}

export interface LazyRenderingViewport {
    readonly height: number;
    readonly width: number;
}

export interface LazyRenderingRuntime {
    createIntersectionObserver: (
        callback: IntersectionObserverCallback,
        options: Readonly<IntersectionObserverInit>
    ) => IntersectionObserver | undefined;
    getViewport: () => LazyRenderingViewport;
    isHTMLElement: (element: Readonly<Element>) => element is HTMLElement;
    requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => number | undefined;
    requestIdleCallback: (
        callback: IdleRequestCallback,
        options: Readonly<IdleRequestOptions>
    ) => number | undefined;
    setTimeout: (callback: () => void) => LazyRenderingTimeoutHandle;
}

function resolveViewportDimension(
    primary: number | undefined,
    fallback: number | undefined
): number {
    if (primary !== undefined && primary !== 0 && !Number.isNaN(primary)) {
        return primary;
    }

    if (fallback !== undefined && fallback !== 0 && !Number.isNaN(fallback)) {
        return fallback;
    }

    return 0;
}

const defaultLazyRenderingRuntimeScope: LazyRenderingRuntimeScope = {
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getIntersectionObserver: getBrowserIntersectionObserver,
    getRequestAnimationFrame: getBrowserRequestAnimationFrame,
    getRequestIdleCallback: getBrowserRequestIdleCallback,
    getSetTimeout: getBrowserSetTimeout,
    getViewport: getBrowserViewport,
};

export function getLazyRenderingRuntime(
    scope: LazyRenderingRuntimeScope = defaultLazyRenderingRuntimeScope
): LazyRenderingRuntime {
    return {
        createIntersectionObserver(
            callback: IntersectionObserverCallback,
            options: Readonly<IntersectionObserverInit>
        ): IntersectionObserver | undefined {
            const Observer = scope.getIntersectionObserver?.();
            if (typeof Observer !== "function") {
                return undefined;
            }

            return new Observer(callback, options);
        },
        getViewport(): LazyRenderingViewport {
            const document = scope.getDocument?.();
            const viewport = scope.getViewport?.();
            return {
                height: resolveViewportDimension(
                    viewport?.height,
                    document?.documentElement?.clientHeight
                ),
                width: resolveViewportDimension(
                    viewport?.width,
                    document?.documentElement?.clientWidth
                ),
            };
        },
        isHTMLElement(element: Readonly<Element>): element is HTMLElement {
            const HTMLElementConstructor = scope.getHTMLElement?.();
            return (
                typeof HTMLElementConstructor === "function" &&
                element instanceof HTMLElementConstructor
            );
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            const requestAnimationFrame = scope.getRequestAnimationFrame?.();
            if (typeof requestAnimationFrame !== "function") {
                return undefined;
            }

            return requestAnimationFrame(callback);
        },
        requestIdleCallback(
            callback: IdleRequestCallback,
            options: Readonly<IdleRequestOptions>
        ): number | undefined {
            const requestIdleCallback = scope.getRequestIdleCallback?.();
            if (typeof requestIdleCallback !== "function") {
                return undefined;
            }

            return requestIdleCallback(callback, options);
        },
        setTimeout(callback: () => void): LazyRenderingTimeoutHandle {
            const timeout = scope.getSetTimeout?.();
            if (typeof timeout !== "function") {
                throw new TypeError("lazyRenderingRuntime requires setTimeout");
            }

            return timeout(callback, 0);
        },
    };
}
