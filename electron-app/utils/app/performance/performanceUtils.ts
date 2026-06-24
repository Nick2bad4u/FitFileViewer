/**
 * Performance utilities for optimizing rendering and operations.
 */

import {
    getPerformanceUtilsRuntime,
    type PerformanceUtilsRuntime,
    type PerformanceUtilsIdleCallbackHandle,
    type PerformanceUtilsTimerHandle,
} from "./performanceUtilsRuntime.js";

type TimerHandle = PerformanceUtilsTimerHandle;
type IdleCallbackHandle = PerformanceUtilsIdleCallbackHandle;

type BatchOptions = {
    readonly maxItems?: number;
    readonly maxWait?: number;
};

type DebounceOptions = {
    readonly leading?: boolean;
    readonly trailing?: boolean;
};

type OptimizeEventHandlerOptions = {
    readonly debounce?: number;
    readonly passive?: boolean;
    readonly throttle?: number;
};

type DebouncedFunction<This, Args extends unknown[], Return> = ((
    this: This,
    ...args: Args
) => Return | undefined) & {
    cancel: () => void;
    flush: () => Return | undefined;
};

type MemoizedFunction<This, Args extends unknown[], Return> = ((
    this: This,
    ...args: Args
) => Return) & {
    cache: Map<string | undefined, Return>;
    clear: () => void;
};

type OptimizedEventHandler<T extends Event> = ((event: T) => void) & {
    _passive?: boolean;
};

function performanceUtilsRuntime(): PerformanceUtilsRuntime {
    return getPerformanceUtilsRuntime();
}

/**
 * Batch multiple operations together.
 */
export function batchOperations<T>(
    batchCallback: (items: T[]) => void,
    options: BatchOptions = {}
): (item: T) => void {
    const { maxItems = 100, maxWait = 50 } = options;
    const items: T[] = [];
    let timeoutId: TimerHandle | undefined;

    function flush(): void {
        if (items.length > 0) {
            const toProcess = items.splice(0);
            batchCallback(toProcess);
        }
        if (timeoutId !== undefined) {
            performanceUtilsRuntime().clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    }

    return function addItem(item: T): void {
        items.push(item);

        if (items.length >= maxItems) {
            flush();
        } else if (timeoutId === undefined) {
            timeoutId = performanceUtilsRuntime().setTimeout(flush, maxWait);
        }
    };
}

/**
 * Cancel an idle callback, falling back to timeout cancellation when the
 * browser idle-callback API is unavailable.
 */
export function cancelIdleCallback(id: IdleCallbackHandle): void {
    performanceUtilsRuntime().cancelIdleCallback(id);
}

/**
 * Debounce a callable.
 */
export function debounce<This, Args extends unknown[], Return>(
    func: (this: This, ...args: Args) => Return,
    wait: number,
    options: DebounceOptions = {}
): DebouncedFunction<This, Args, Return> {
    const { leading = false, trailing = true } = options;
    let timeoutId: TimerHandle | undefined;
    let lastArgs: Args | undefined;
    let lastThis: This | undefined;
    let result: Return | undefined;
    let lastCallTime: number | undefined;
    let lastInvokeTime = 0;

    function shouldInvoke(time: number): boolean {
        const timeSinceLastCall = time - (lastCallTime ?? 0);
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (
            lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            timeSinceLastInvoke >= wait
        );
    }

    function invokeFunc(time: number): Return | undefined {
        const args = lastArgs;
        const thisArg = lastThis;

        if (args === undefined) {
            return result;
        }

        lastArgs = undefined;
        lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg as This, args);
        return result;
    }

    function leadingEdge(time: number): Return | undefined {
        lastInvokeTime = time;
        timeoutId = performanceUtilsRuntime().setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
    }

    function remainingWait(time: number): number {
        const timeSinceLastCall = time - (lastCallTime ?? 0);
        const timeSinceLastInvoke = time - lastInvokeTime;
        const timeWaiting = wait - timeSinceLastCall;

        return Math.min(timeWaiting, wait - timeSinceLastInvoke);
    }

    function timerExpired(): Return | undefined {
        const time = performanceUtilsRuntime().now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        timeoutId = performanceUtilsRuntime().setTimeout(
            timerExpired,
            remainingWait(time)
        );
        return result;
    }

    function trailingEdge(time: number): Return | undefined {
        timeoutId = undefined;

        if (trailing && lastArgs !== undefined) {
            return invokeFunc(time);
        }
        lastArgs = undefined;
        lastThis = undefined;
        return result;
    }

    function cancel(): void {
        if (timeoutId !== undefined) {
            performanceUtilsRuntime().clearTimeout(timeoutId);
        }
        lastInvokeTime = 0;
        lastArgs = undefined;
        lastCallTime = undefined;
        lastThis = undefined;
        timeoutId = undefined;
    }

    function flush(): Return | undefined {
        return timeoutId === undefined
            ? result
            : trailingEdge(performanceUtilsRuntime().now());
    }

    function setLastThis(value: This): void {
        lastThis = value;
    }

    function debounced(this: This, ...args: Args): Return | undefined {
        const time = performanceUtilsRuntime().now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        setLastThis(this);
        lastCallTime = time;

        if (isInvoking && timeoutId === undefined) {
            return leadingEdge(lastCallTime);
        }
        if (timeoutId === undefined) {
            timeoutId = performanceUtilsRuntime().setTimeout(
                timerExpired,
                wait
            );
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
export function memoize<This, Args extends unknown[], Return>(
    func: (this: This, ...args: Args) => Return,
    keyGenerator?: (...args: Args) => string
): MemoizedFunction<This, Args, Return> {
    const cache = new Map<string | undefined, Return>();

    function memoized(this: This, ...args: Args): Return {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key) as Return;
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
export function optimizeEventHandler<T extends Event>(
    handler: (event: T) => void,
    options: OptimizeEventHandlerOptions = {}
): OptimizedEventHandler<T> {
    const {
        debounce: debounceMs,
        passive = true,
        throttle: throttleMs,
    } = options;

    let optimizedHandler: (event: T) => void = handler;

    if (throttleMs !== undefined) {
        optimizedHandler = throttle(handler, throttleMs);
    } else if (debounceMs !== undefined) {
        optimizedHandler = debounce(handler, debounceMs);
    }

    const handlerWithMetadata = optimizedHandler as OptimizedEventHandler<T>;
    handlerWithMetadata._passive = passive;

    return handlerWithMetadata;
}

/**
 * Request an idle callback with a timeout fallback.
 */
export function requestIdleCallback(
    callback: () => void,
    options?: IdleRequestOptions
): IdleCallbackHandle {
    return performanceUtilsRuntime().requestIdleCallback(callback, options);
}

/**
 * Throttle a callable.
 */
export function throttle<This, Args extends unknown[], Return>(
    func: (this: This, ...args: Args) => Return,
    wait: number
): DebouncedFunction<This, Args, Return> {
    return debounce(func, wait, { leading: true, trailing: true });
}
