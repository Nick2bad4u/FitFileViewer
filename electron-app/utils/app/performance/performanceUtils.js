/**
 * Provides debouncing, throttling, memoization, and idle callback utilities
 *
 * @file Performance utilities for optimizing rendering and operations
 */

/**
 * Batch multiple operations together
 *
 * @template T
 *
 * @param {(items: T[]) => void} callback - Callback to execute with batched
 *   items
 * @param {Object} [options] - Options
 * @param {number} [options.maxWait=50] - Maximum wait time. Default is `50`
 * @param {number} [options.maxItems=100] - Maximum items to batch. Default is
 *   `100`
 *
 * @returns {(item: T) => void} Function to add items to batch
 */
export function batchOperations(callback, options = {}) {
    const { maxItems = 100, maxWait = 50 } = options;
    const items = [];
    let timeoutId;

    function flush() {
        if (items.length > 0) {
            const toProcess = items.splice(0);
            callback(toProcess);
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    }

    return function addItem(item) {
        items.push(item);

        if (items.length >= maxItems) {
            flush();
        } else if (!timeoutId) {
            timeoutId = setTimeout(flush, maxWait);
        }
    };
}

/**
 * Cancel idle callback
 *
 * @param {number} id - Request ID
 */
export function cancelIdleCallback(id) {
    if (typeof globalThis.cancelIdleCallback === "function") {
        globalThis.cancelIdleCallback(id);
    } else {
        clearTimeout(id);
    }
}

/**
 * Debounce a function
 *
 * @template {(...args: any[]) => any} T
 *
 * @param {T} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {Object} [options] - Options
 * @param {boolean} [options.leading=false] - Execute on leading edge. Default
 *   is `false`
 * @param {boolean} [options.trailing=true] - Execute on trailing edge. Default
 *   is `true`
 *
 * @returns {T & { cancel: () => void; flush: () => void }} Debounced function
 *   with cancel and flush methods
 */
export function debounce(func, wait, options = {}) {
    const { leading = false, trailing = true } = options;
    let timeoutId;
    let lastArgs;
    let lastThis;
    let result;
    let lastCallTime;
    let lastInvokeTime = 0;

    /**
     * @param {number} time
     *
     * @returns {boolean}
     */
    function shouldInvoke(time) {
        const timeSinceLastCall = time - (lastCallTime || 0);
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (
            lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            timeSinceLastInvoke >= wait
        );
    }

    function invokeFunc(time) {
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
    }

    function leadingEdge(time) {
        lastInvokeTime = time;
        timeoutId = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
    }

    function remainingWait(time) {
        const timeSinceLastCall = time - (lastCallTime || 0);
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;

        return Math.min(timeWaiting, wait - timeSinceLastInvoke);
    }

    function timerExpired() {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        timeoutId = setTimeout(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
        timeoutId = undefined;

        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
    }

    function cancel() {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timeoutId = undefined;
    }

    function flush() {
        return timeoutId === undefined ? result : trailingEdge(Date.now());
    }

    /**
     * @this {any}
     *
     * @param {...any} args
     */
    function debounced(...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking && timeoutId === undefined) {
            return leadingEdge(lastCallTime);
        }
        if (timeoutId === undefined) {
            timeoutId = setTimeout(timerExpired, wait);
        }
        return result;
    }

    debounced.cancel = cancel;
    debounced.flush = flush;

    return /** @type {any} */ (debounced);
}

/**
 * Memoize a function
 *
 * @template {(...args: any[]) => any} T
 *
 * @param {T} func - Function to memoize
 * @param {(...args: any[]) => string} [keyGenerator] - Optional key generator
 *
 * @returns {T & { cache: Map<string, any>; clear: () => void }} Memoized
 *   function
 */
export function memoize(func, keyGenerator) {
    const cache = new Map();

    /**
     * @this {any}
     *
     * @param {...any} args
     */
    function memoized(...args) {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = func.apply(this, args);
        cache.set(key, result);
        return result;
    }

    memoized.cache = cache;
    memoized.clear = () => cache.clear();

    return /** @type {any} */ (memoized);
}

/**
 * Create a performance-optimized event handler
 *
 * @template {Event} T
 *
 * @param {(event: T) => void} handler - Event handler
 * @param {Object} [options] - Options
 * @param {boolean} [options.passive=true] - Use passive event listener. Default
 *   is `true`
 * @param {number} [options.throttle] - Throttle delay
 * @param {number} [options.debounce] - Debounce delay
 *
 * @returns {(event: T) => void} Optimized handler
 */
export function optimizeEventHandler(handler, options = {}) {
    const {
        debounce: debounceMs,
        passive = true,
        throttle: throttleMs,
    } = options;

    let optimizedHandler = handler;

    if (throttleMs) {
        optimizedHandler = throttle(handler, throttleMs);
    } else if (debounceMs) {
        optimizedHandler = debounce(handler, debounceMs);
    }

    // Add passive flag hint (actual passive flag is set when addEventListener is called)
    /** @type {any} */ (optimizedHandler)._passive = passive;

    return optimizedHandler;
}

/**
 * Request idle callback with fallback to setTimeout
 *
 * @param {() => void} callback - Callback to execute
 * @param {Object} [options] - Options
 * @param {number} [options.timeout] - Maximum time to wait
 *
 * @returns {number} Request ID
 */
export function requestIdleCallback(callback, options) {
    if (typeof globalThis.requestIdleCallback === "function") {
        return globalThis.requestIdleCallback(callback, options);
    }

    // Fallback to setTimeout
    const timeout = options?.timeout || 1;
    return setTimeout(callback, timeout);
}

/**
 * Throttle a function
 *
 * @template {(...args: any[]) => any} T
 *
 * @param {T} func - Function to throttle
 * @param {number} wait - Wait time in milliseconds
 *
 * @returns {T & { cancel: () => void }} Throttled function
 */
export function throttle(func, wait) {
    return debounce(func, wait, { leading: true, trailing: true });
}
