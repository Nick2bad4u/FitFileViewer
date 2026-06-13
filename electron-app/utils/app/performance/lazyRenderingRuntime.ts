export type LazyRenderingTimeoutHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

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
    readonly HTMLElement?: typeof HTMLElement | undefined;
    readonly innerHeight?: number | undefined;
    readonly innerWidth?: number | undefined;
    readonly IntersectionObserver?: typeof IntersectionObserver | undefined;
    readonly requestAnimationFrame?:
        | ((callback: FrameRequestCallback) => number)
        | undefined;
    readonly requestIdleCallback?:
        | ((
              callback: IdleRequestCallback,
              options?: IdleRequestOptions
          ) => number)
        | undefined;
    readonly setTimeout?:
        | ((callback: () => void, timeout?: number) => LazyRenderingTimeoutHandle)
        | undefined;
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
    requestAnimationFrame: (callback: FrameRequestCallback) => number | undefined;
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

export function getLazyRenderingRuntime(
    scope: LazyRenderingRuntimeScope = globalThis
): LazyRenderingRuntime {
    return {
        createIntersectionObserver(
            callback: IntersectionObserverCallback,
            options: IntersectionObserverInit
        ): IntersectionObserver | undefined {
            const Observer = scope.IntersectionObserver;
            if (typeof Observer !== "function") {
                return undefined;
            }

            return new Observer(callback, options);
        },
        getViewport(): LazyRenderingViewport {
            return {
                height: resolveViewportDimension(
                    scope.innerHeight,
                    scope.document?.documentElement?.clientHeight
                ),
                width: resolveViewportDimension(
                    scope.innerWidth,
                    scope.document?.documentElement?.clientWidth
                ),
            };
        },
        isHTMLElement(element: Element): element is HTMLElement {
            const HTMLElementConstructor = scope.HTMLElement;
            return (
                typeof HTMLElementConstructor === "function" &&
                element instanceof HTMLElementConstructor
            );
        },
        requestAnimationFrame(
            callback: FrameRequestCallback
        ): number | undefined {
            if (typeof scope.requestAnimationFrame !== "function") {
                return undefined;
            }

            return scope.requestAnimationFrame(callback);
        },
        requestIdleCallback(
            callback: IdleRequestCallback,
            options: IdleRequestOptions
        ): number | undefined {
            if (typeof scope.requestIdleCallback !== "function") {
                return undefined;
            }

            return scope.requestIdleCallback(callback, options);
        },
        setTimeout(callback: () => void): LazyRenderingTimeoutHandle {
            const timeout = scope.setTimeout;
            if (typeof timeout !== "function") {
                throw new TypeError("lazyRenderingRuntime requires setTimeout");
            }

            return timeout(callback, 0);
        },
    };
}
