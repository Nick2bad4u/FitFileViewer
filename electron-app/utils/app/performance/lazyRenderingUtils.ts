/**
 * Provides utilities for deferring rendering until elements are visible
 */

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

type IdleRequestGlobal = typeof globalThis & {
    requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions
    ) => number;
};

/**
 * Batch DOM reads to avoid layout thrashing
 */
export function batchDOMReads<T>(readCallback: () => T[]): Promise<T[]> {
    return new Promise((resolve) => {
        if (typeof globalThis.requestAnimationFrame === "function") {
            const animationFrameHandle = globalThis.requestAnimationFrame(
                () => {
                    try {
                        const results = readCallback();
                        resolve(results);
                    } catch (error) {
                        console.error("[BatchDOMReads] Read error:", error);
                        resolve([]);
                    }
                }
            );
            void animationFrameHandle;
        } else {
            // Fallback to immediate execution
            try {
                const results = readCallback();
                resolve(results);
            } catch (error) {
                console.error("[BatchDOMReads] Read error:", error);
                resolve([]);
            }
        }
    });
}

/**
 * Batch DOM writes to avoid layout thrashing
 */
export function batchDOMWrites(writeCallback: () => void): Promise<void> {
    return new Promise((resolve) => {
        if (typeof globalThis.requestAnimationFrame === "function") {
            const animationFrameHandle = globalThis.requestAnimationFrame(
                () => {
                    try {
                        writeCallback();
                        resolve();
                    } catch (error) {
                        console.error("[BatchDOMWrites] Write error:", error);
                        resolve();
                    }
                }
            );
            void animationFrameHandle;
        } else {
            // Fallback to immediate execution
            try {
                writeCallback();
                resolve();
            } catch (error) {
                console.error("[BatchDOMWrites] Write error:", error);
                resolve();
            }
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

                // Execute callback
                try {
                    const result = renderCallback();
                    if (isPromiseLike(result)) {
                        void result.catch((error: unknown) => {
                            console.error(
                                "[LazyRenderer] Render callback error:",
                                error
                            );
                        });
                    }
                } catch (error) {
                    console.error(
                        "[LazyRenderer] Render callback error:",
                        error
                    );
                }

                // Disconnect if once=true
                if (once && observer) {
                    observer.disconnect();
                }
            }
        }
    };

    const observe = (): void => {
        if (typeof IntersectionObserver === "undefined") {
            // Fallback: immediately execute if IntersectionObserver not available
            console.warn(
                "[LazyRenderer] IntersectionObserver not available, rendering immediately"
            );
            try {
                renderCallback();
            } catch (error) {
                console.error("[LazyRenderer] Immediate render error:", error);
            }
            return;
        }

        observer = new IntersectionObserver(handleIntersection, {
            rootMargin,
            threshold,
        });

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
    const idleGlobal = globalThis as IdleRequestGlobal;

    if (typeof idleGlobal.requestIdleCallback === "function") {
        return idleGlobal.requestIdleCallback(
            () => {
                try {
                    void callback();
                } catch (error) {
                    console.error("[DeferUntilIdle] Callback error:", error);
                }
            },
            { timeout }
        );
    }

    // Fallback to setTimeout
    return setTimeout(() => {
        try {
            void callback();
        } catch (error) {
            console.error("[DeferUntilIdle] Callback error:", error);
        }
    }, 0);
}

/**
 * Check if element is visible in viewport
 */
export function isElementVisible(
    element: Element | null | undefined,
    threshold = 0
): element is HTMLElement {
    if (!element || !(element instanceof HTMLElement)) {
        return false;
    }

    const rect = element.getBoundingClientRect();
    const viewportHeight =
        globalThis.innerHeight || document.documentElement.clientHeight;
    const viewportWidth =
        globalThis.innerWidth || document.documentElement.clientWidth;

    const verticalVisible =
        rect.bottom >= viewportHeight * threshold &&
        rect.top <= viewportHeight * (1 - threshold);

    const horizontalVisible =
        rect.right >= viewportWidth * threshold &&
        rect.left <= viewportWidth * (1 - threshold);

    return verticalVisible && horizontalVisible;
}

function isPromiseLike(value: unknown): value is Promise<void> {
    return (
        typeof value === "object" &&
        value !== null &&
        "catch" in value &&
        typeof (value as { catch?: unknown }).catch === "function"
    );
}
