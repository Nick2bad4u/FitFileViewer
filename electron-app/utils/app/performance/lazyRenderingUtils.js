/**
 * @fileoverview Lazy Rendering Utilities
 * @description Provides utilities for deferring rendering until elements are visible
 */

/**
 * Batch DOM reads to avoid layout thrashing
 * @template T
 * @param {() => T[]} readCallback - Callback that reads from DOM
 * @returns {Promise<T[]>} Promise with read results
 */
export function batchDOMReads(readCallback) {
    return new Promise((resolve) => {
        if (typeof globalThis.requestAnimationFrame === "function") {
            globalThis.requestAnimationFrame(() => {
                try {
                    const results = readCallback();
                    resolve(results);
                } catch (error) {
                    console.error("[BatchDOMReads] Read error:", error);
                    resolve([]);
                }
            });
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
 * @param {() => void} writeCallback - Callback that writes to DOM
 * @returns {Promise<void>}
 */
export function batchDOMWrites(writeCallback) {
    return new Promise((resolve) => {
        if (typeof globalThis.requestAnimationFrame === "function") {
            globalThis.requestAnimationFrame(() => {
                try {
                    writeCallback();
                    resolve();
                } catch (error) {
                    console.error("[BatchDOMWrites] Write error:", error);
                    resolve();
                }
            });
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
 * @param {HTMLElement} element - Element to observe
 * @param {() => void | Promise<void>} renderCallback - Callback to execute when visible
 * @param {Object} [options] - Options
 * @param {number} [options.threshold=0.1] - Intersection threshold (0-1)
 * @param {string} [options.rootMargin='0px'] - Root margin
 * @param {boolean} [options.once=true] - Only trigger once
 * @returns {{ disconnect: () => void, observe: () => void }} Observer controls
 */
export function createLazyRenderer(element, renderCallback, options = {}) {
    const { once = true, rootMargin = "0px", threshold = 0.1 } = options;

    let hasRendered = false;
    let observer = null;

    const handleIntersection = (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting && (!once || !hasRendered)) {
                hasRendered = true;
                console.log("[LazyRenderer] Element visible, triggering render");

                // Execute callback
                try {
                    const result = renderCallback();
                    if (result instanceof Promise) {
                        result.catch((error) => {
                            console.error("[LazyRenderer] Render callback error:", error);
                        });
                    }
                } catch (error) {
                    console.error("[LazyRenderer] Render callback error:", error);
                }

                // Disconnect if once=true
                if (once && observer) {
                    observer.disconnect();
                }
            }
        }
    };

    const observe = () => {
        if (typeof IntersectionObserver === "undefined") {
            // Fallback: immediately execute if IntersectionObserver not available
            console.warn("[LazyRenderer] IntersectionObserver not available, rendering immediately");
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

    const disconnect = () => {
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
 * @param {() => void | Promise<void>} callback - Callback to execute
 * @param {Object} [options] - Options
 * @param {number} [options.timeout=2000] - Maximum timeout
 * @returns {number} Request ID
 */
export function deferUntilIdle(callback, options = {}) {
    const { timeout = 2000 } = options;

    if (typeof globalThis.requestIdleCallback === "function") {
        return globalThis.requestIdleCallback(
            () => {
                try {
                    callback();
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
            callback();
        } catch (error) {
            console.error("[DeferUntilIdle] Callback error:", error);
        }
    }, 0);
}

/**
 * Check if element is visible in viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} [threshold=0] - Threshold (0-1)
 * @returns {boolean} True if visible
 */
export function isElementVisible(element, threshold = 0) {
    if (!element || !(element instanceof HTMLElement)) {
        return false;
    }

    const rect = element.getBoundingClientRect();
    const viewportHeight = globalThis.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = globalThis.innerWidth || document.documentElement.clientWidth;

    const verticalVisible = rect.bottom >= viewportHeight * threshold && rect.top <= viewportHeight * (1 - threshold);

    const horizontalVisible = rect.right >= viewportWidth * threshold && rect.left <= viewportWidth * (1 - threshold);

    return verticalVisible && horizontalVisible;
}
