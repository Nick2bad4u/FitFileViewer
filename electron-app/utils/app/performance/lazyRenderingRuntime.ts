import {
    getBrowserRequestIdleCallback,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type LazyRenderingTimeoutHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

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
        | (() => typeof HTMLElement | undefined)
        | undefined;
    readonly getInnerHeight?: (() => number | undefined) | undefined;
    readonly getInnerWidth?: (() => number | undefined) | undefined;
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
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
    getInnerHeight: () => globalThis.innerHeight,
    getInnerWidth: () => globalThis.innerWidth,
    getIntersectionObserver: () => globalThis.IntersectionObserver,
    getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
    getRequestIdleCallback: getBrowserRequestIdleCallback,
    getSetTimeout: getBrowserSetTimeout,
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
            return {
                height: resolveViewportDimension(
                    scope.getInnerHeight?.(),
                    document?.documentElement?.clientHeight
                ),
                width: resolveViewportDimension(
                    scope.getInnerWidth?.(),
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
