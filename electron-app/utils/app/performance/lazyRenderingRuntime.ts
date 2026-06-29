import {
    type BrowserHTMLElementConstructor,
    type BrowserSetTimeout,
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

export interface LazyRenderingRuntimeDocument {
    readonly documentElement?:
        | {
              readonly clientHeight?: number | undefined;
              readonly clientWidth?: number | undefined;
          }
        | undefined;
}

type LazyRenderingRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface LazyRenderingRuntimeScope {
    readonly getDocument: LazyRenderingRuntimeProvider<LazyRenderingRuntimeDocument>;
    readonly getHTMLElement: LazyRenderingRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getIntersectionObserver: LazyRenderingRuntimeProvider<
        typeof IntersectionObserver
    >;
    readonly getRequestAnimationFrame: LazyRenderingRuntimeProvider<LazyRenderingRequestAnimationFrame>;
    readonly getRequestIdleCallback: LazyRenderingRuntimeProvider<LazyRenderingRequestIdleCallback>;
    readonly getSetTimeout: LazyRenderingRuntimeProvider<BrowserSetTimeout>;
    readonly getViewport: LazyRenderingRuntimeProvider<LazyRenderingViewport>;
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

function getRequiredProvider<T>(
    provider: LazyRenderingRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (provider === undefined) {
        throw new TypeError(
            `lazyRenderingRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

export function getLazyRenderingRuntime(
    scope: LazyRenderingRuntimeScope = defaultLazyRenderingRuntimeScope
): LazyRenderingRuntime {
    return {
        createIntersectionObserver(
            callback: IntersectionObserverCallback,
            options: Readonly<IntersectionObserverInit>
        ): IntersectionObserver | undefined {
            const Observer = getRequiredProvider(
                scope.getIntersectionObserver,
                "IntersectionObserver"
            )();
            if (typeof Observer !== "function") {
                return undefined;
            }

            return new Observer(callback, options);
        },
        getViewport(): LazyRenderingViewport {
            const document = getRequiredProvider(
                scope.getDocument,
                "document"
            )();
            const viewport = getRequiredProvider(
                scope.getViewport,
                "viewport"
            )();
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
            const HTMLElementConstructor = getRequiredProvider(
                scope.getHTMLElement,
                "HTMLElement"
            )();
            return (
                typeof HTMLElementConstructor === "function" &&
                element instanceof HTMLElementConstructor
            );
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            const requestAnimationFrame = getRequiredProvider(
                scope.getRequestAnimationFrame,
                "requestAnimationFrame"
            )();
            if (typeof requestAnimationFrame !== "function") {
                return undefined;
            }

            return requestAnimationFrame(callback);
        },
        requestIdleCallback(
            callback: IdleRequestCallback,
            options: Readonly<IdleRequestOptions>
        ): number | undefined {
            const requestIdleCallback = getRequiredProvider(
                scope.getRequestIdleCallback,
                "requestIdleCallback"
            )();
            if (typeof requestIdleCallback !== "function") {
                return undefined;
            }

            return requestIdleCallback(callback, options);
        },
        setTimeout(callback: () => void): LazyRenderingTimeoutHandle {
            const timeout = getRequiredProvider(
                scope.getSetTimeout,
                "setTimeout"
            )();
            if (typeof timeout !== "function") {
                throw new TypeError("lazyRenderingRuntime requires setTimeout");
            }

            return timeout(callback, 0);
        },
    };
}
