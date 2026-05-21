/**
 * Performance utilities for optimizing rendering and operations.
 */
/**
 * Batch multiple operations together.
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
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    }
    return function addItem(item) {
        items.push(item);
        if (items.length >= maxItems) {
            flush();
        } else if (timeoutId === undefined) {
            timeoutId = setTimeout(flush, maxWait);
        }
    };
}
/**
 * Cancel an idle callback, falling back to timeout cancellation when the
 * browser idle-callback API is unavailable.
 */
export function cancelIdleCallback(id) {
    if (
        typeof id === "number" &&
        typeof globalThis.cancelIdleCallback === "function"
    ) {
        globalThis.cancelIdleCallback(id);
        return;
    }
    clearTimeout(id);
}
/**
 * Debounce a callable.
 */
export function debounce(func, wait, options = {}) {
    const { leading = false, trailing = true } = options;
    let timeoutId;
    let lastArgs;
    let lastThis;
    let result;
    let lastCallTime;
    let lastInvokeTime = 0;
    function shouldInvoke(time) {
        const timeSinceLastCall = time - (lastCallTime ?? 0);
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
        if (args === undefined) {
            return result;
        }
        lastArgs = undefined;
        lastThis = undefined;
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
        const timeSinceLastCall = time - (lastCallTime ?? 0);
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
        return result;
    }
    function trailingEdge(time) {
        timeoutId = undefined;
        if (trailing && lastArgs !== undefined) {
            return invokeFunc(time);
        }
        lastArgs = undefined;
        lastThis = undefined;
        return result;
    }
    function cancel() {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        lastInvokeTime = 0;
        lastArgs = undefined;
        lastCallTime = undefined;
        lastThis = undefined;
        timeoutId = undefined;
    }
    function flush() {
        return timeoutId === undefined ? result : trailingEdge(Date.now());
    }
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
    return debounced;
}
/**
 * Memoize a callable.
 */
export function memoize(func, keyGenerator) {
    const cache = new Map();
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
    memoized.clear = () => {
        cache.clear();
    };
    return memoized;
}
/**
 * Create a performance-optimized event handler.
 */
export function optimizeEventHandler(handler, options = {}) {
    const {
        debounce: debounceMs,
        passive = true,
        throttle: throttleMs,
    } = options;
    let optimizedHandler = handler;
    if (throttleMs !== undefined) {
        optimizedHandler = throttle(handler, throttleMs);
    } else if (debounceMs !== undefined) {
        optimizedHandler = debounce(handler, debounceMs);
    }
    const handlerWithMetadata = optimizedHandler;
    handlerWithMetadata._passive = passive;
    return handlerWithMetadata;
}
/**
 * Request an idle callback with a timeout fallback.
 */
export function requestIdleCallback(callback, options) {
    if (typeof globalThis.requestIdleCallback === "function") {
        return globalThis.requestIdleCallback(callback, options);
    }
    return setTimeout(callback, options?.timeout ?? 1);
}
/**
 * Throttle a callable.
 */
export function throttle(func, wait) {
    return debounce(func, wait, { leading: true, trailing: true });
}
