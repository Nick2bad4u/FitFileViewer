/**
 * Provides utilities for deferring rendering until elements are visible
 */

import { getLazyRenderingRuntime } from "./lazyRenderingRuntime.js";

type AsyncVoidCallback = () => Promise<void> | void;

type LazyRendererOptions = {
    once?: boolean;
    rootMargin?: string;
    threshold?: number | number[];
};

type LazyRendererControls = {
    disconnect: () => void;
    observe: () => void;
};

type IdleOptions = {
    timeout?: number;
};

function runAsyncVoidCallback(
    task: AsyncVoidCallback,
    errorPrefix: string
): void {
    try {
        const result = task();
        if (isPromiseLike(result)) {
            void result.catch((error: unknown) => {
                console.error(errorPrefix, error);
            });
        }
    } catch (error) {
        console.error(errorPrefix, error);
    }
}

/**
 * Batch DOM reads to avoid layout thrashing
 */
export async function batchDOMReads<T>(readCallback: () => T[]): Promise<T[]> {
    return new Promise((resolve) => {
        const animationFrameHandle =
            getLazyRenderingRuntime().requestAnimationFrame(() => {
                try {
                    const results = readCallback();
                    resolve(results);
                } catch (error) {
                    console.error("[BatchDOMReads] Read error:", error);
                    resolve([]);
                }
            });
        if (animationFrameHandle === undefined) {
            // Fallback to immediate execution
            try {
                const results = readCallback();
                resolve(results);
            } catch (error) {
                console.error("[BatchDOMReads] Read error:", error);
                resolve([]);
            }
        } else {
            void animationFrameHandle;
        }
    });
}

/**
 * Batch DOM writes to avoid layout thrashing
 */
export async function batchDOMWrites(writeCallback: () => void): Promise<void> {
    return new Promise((resolve) => {
        const animationFrameHandle =
            getLazyRenderingRuntime().requestAnimationFrame(() => {
                try {
                    writeCallback();
                    resolve();
                } catch (error) {
                    console.error("[BatchDOMWrites] Write error:", error);
                    resolve();
                }
            });
        if (animationFrameHandle === undefined) {
            // Fallback to immediate execution
            try {
                writeCallback();
                resolve();
            } catch (error) {
                console.error("[BatchDOMWrites] Write error:", error);
                resolve();
            }
        } else {
            void animationFrameHandle;
        }
    });
}

/**
 * Create a lazy renderer that only renders when element is visible
 */
export function createLazyRenderer(
    element: HTMLElement,
    renderCallback: AsyncVoidCallback,
    options: LazyRendererOptions = {}
): LazyRendererControls {
    const { once = true, rootMargin = "0px", threshold = 0.1 } = options;

    let hasRendered = false;
    let observer: IntersectionObserver | null = null;

    const handleIntersection: IntersectionObserverCallback = (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting && (!once || !hasRendered)) {
                hasRendered = true;
                console.log(
                    "[LazyRenderer] Element visible, triggering render"
                );

                runAsyncVoidCallback(
                    renderCallback,
                    "[LazyRenderer] Render callback error:"
                );

                // Disconnect if once=true
                if (once && observer) {
                    observer.disconnect();
                }
            }
        }
    };

    const observe = (): void => {
        const nextObserver =
            getLazyRenderingRuntime().createIntersectionObserver(
                handleIntersection,
                {
                    rootMargin,
                    threshold,
                }
            );

        if (!nextObserver) {
            // Fallback: immediately execute if IntersectionObserver not available
            console.warn(
                "[LazyRenderer] IntersectionObserver not available, rendering immediately"
            );
            runAsyncVoidCallback(
                renderCallback,
                "[LazyRenderer] Immediate render error:"
            );
            return;
        }

        observer = nextObserver;
        observer.observe(element);
    };

    const disconnect = (): void => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    };

    return {
        disconnect,
        observe,
    };
}

/**
 * Defer execution until browser is idle
 */
export function deferUntilIdle(
    callback: AsyncVoidCallback,
    options: IdleOptions = {}
): number | ReturnType<typeof setTimeout> {
    const { timeout = 2000 } = options;
    const runtime = getLazyRenderingRuntime();
    const idleRequestId = runtime.requestIdleCallback(
        () => {
            runAsyncVoidCallback(callback, "[DeferUntilIdle] Callback error:");
        },
        { timeout }
    );

    if (idleRequestId !== undefined) {
        return idleRequestId;
    }

    // Fallback to setTimeout
    return runtime.setTimeout(() => {
        runAsyncVoidCallback(callback, "[DeferUntilIdle] Callback error:");
    });
}

/**
 * Check if element is visible in viewport
 */
export function isElementVisible(
    element: Element | null | undefined,
    threshold = 0
): element is HTMLElement {
    const runtime = getLazyRenderingRuntime();
    if (!element || !runtime.isHTMLElement(element)) {
        return false;
    }

    const rect = element.getBoundingClientRect();
    const { height: viewportHeight, width: viewportWidth } =
        runtime.getViewport();

    const verticalVisible =
        rect.bottom >= viewportHeight * threshold &&
        rect.top <= viewportHeight * (1 - threshold);

    const horizontalVisible =
        rect.right >= viewportWidth * threshold &&
        rect.left <= viewportWidth * (1 - threshold);

    return verticalVisible && horizontalVisible;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPromiseLike(value: unknown): value is Promise<void> {
    return (
        isRecord(value) &&
        "catch" in value &&
        typeof value["catch"] === "function"
    );
}
