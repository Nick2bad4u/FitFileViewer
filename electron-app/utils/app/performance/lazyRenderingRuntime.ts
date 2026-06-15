export type LazyRenderingTimeoutHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type LazyRenderingRequestAnimationFrame = (
    callback: FrameRequestCallback
) => number;

type LazyRenderingRequestIdleCallback = (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
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
    readonly document?: LazyRenderingRuntimeDocument | undefined;
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
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly innerHeight?: number | undefined;
    readonly innerWidth?: number | undefined;
    readonly IntersectionObserver?: typeof IntersectionObserver | undefined;
    readonly requestAnimationFrame?:
        | LazyRenderingRequestAnimationFrame
        | undefined;
    readonly requestIdleCallback?: LazyRenderingRequestIdleCallback | undefined;
    readonly setTimeout?: LazyRenderingSetTimeout | undefined;
}

export interface LazyRenderingViewport {
    readonly height: number;
    readonly width: number;
}

export interface LazyRenderingRuntime {
    createIntersectionObserver: (
        callback: IntersectionObserverCallback,
        options: IntersectionObserverInit
    ) => IntersectionObserver | undefined;
    getViewport: () => LazyRenderingViewport;
    isHTMLElement: (element: Element) => element is HTMLElement;
    requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => number | undefined;
    requestIdleCallback: (
        callback: IdleRequestCallback,
        options: IdleRequestOptions
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
    getRequestIdleCallback: () => globalThis.requestIdleCallback,
    getSetTimeout: () => globalThis.setTimeout,
};

function getScopeDocument(
    scope: LazyRenderingRuntimeScope
): LazyRenderingRuntimeDocument | undefined {
    return scope.getDocument?.() ?? scope.document;
}

function getScopeHTMLElement(
    scope: LazyRenderingRuntimeScope
): typeof HTMLElement | undefined {
    return scope.getHTMLElement?.() ?? scope.HTMLElement;
}

function getScopeInnerHeight(
    scope: LazyRenderingRuntimeScope
): number | undefined {
    return scope.getInnerHeight?.() ?? scope.innerHeight;
}

function getScopeInnerWidth(
    scope: LazyRenderingRuntimeScope
): number | undefined {
    return scope.getInnerWidth?.() ?? scope.innerWidth;
}

function getScopeIntersectionObserver(
    scope: LazyRenderingRuntimeScope
): typeof IntersectionObserver | undefined {
    return scope.getIntersectionObserver?.() ?? scope.IntersectionObserver;
}

function getScopeRequestAnimationFrame(
    scope: LazyRenderingRuntimeScope
): LazyRenderingRequestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.() ?? scope.requestAnimationFrame;
}

function getScopeRequestIdleCallback(
    scope: LazyRenderingRuntimeScope
): LazyRenderingRequestIdleCallback | undefined {
    return scope.getRequestIdleCallback?.() ?? scope.requestIdleCallback;
}

function getScopeSetTimeout(
    scope: LazyRenderingRuntimeScope
): LazyRenderingSetTimeout | undefined {
    return scope.getSetTimeout?.() ?? scope.setTimeout;
}

export function getLazyRenderingRuntime(
    scope: LazyRenderingRuntimeScope = defaultLazyRenderingRuntimeScope
): LazyRenderingRuntime {
    return {
        createIntersectionObserver(
            callback: IntersectionObserverCallback,
            options: IntersectionObserverInit
        ): IntersectionObserver | undefined {
            const Observer = getScopeIntersectionObserver(scope);
            if (typeof Observer !== "function") {
                return undefined;
            }

            return new Observer(callback, options);
        },
        getViewport(): LazyRenderingViewport {
            const document = getScopeDocument(scope);
            return {
                height: resolveViewportDimension(
                    getScopeInnerHeight(scope),
                    document?.documentElement?.clientHeight
                ),
                width: resolveViewportDimension(
                    getScopeInnerWidth(scope),
                    document?.documentElement?.clientWidth
                ),
            };
        },
        isHTMLElement(element: Element): element is HTMLElement {
            const HTMLElementConstructor = getScopeHTMLElement(scope);
            return (
                typeof HTMLElementConstructor === "function" &&
                element instanceof HTMLElementConstructor
            );
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            const requestAnimationFrame = getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrame !== "function") {
                return undefined;
            }

            return requestAnimationFrame(callback);
        },
        requestIdleCallback(
            callback: IdleRequestCallback,
            options: IdleRequestOptions
        ): number | undefined {
            const requestIdleCallback = getScopeRequestIdleCallback(scope);
            if (typeof requestIdleCallback !== "function") {
                return undefined;
            }

            return requestIdleCallback(callback, options);
        },
        setTimeout(callback: () => void): LazyRenderingTimeoutHandle {
            const timeout = getScopeSetTimeout(scope);
            if (typeof timeout !== "function") {
                throw new TypeError("lazyRenderingRuntime requires setTimeout");
            }

            return timeout(callback, 0);
        },
    };
}
