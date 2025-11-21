/**
 * @fileoverview Performance utilities for optimizing rendering and operations
 * @description Provides debouncing, throttling, memoization, and idle callback utilities
 */
/**
 * Batch multiple operations together
 * @template T
 * @param {(items: T[]) => void} callback - Callback to execute with batched items
 * @param {Object} [options] - Options
 * @param {number} [options.maxWait=50] - Maximum wait time
 * @param {number} [options.maxItems=100] - Maximum items to batch
 * @returns {(item: T) => void} Function to add items to batch
 */
export function batchOperations<T>(
    callback: (items: T[]) => void,
    options?: {
        maxWait?: number | undefined;
        maxItems?: number | undefined;
    }
): (item: T) => void;
/**
 * Cancel idle callback
 * @param {number} id - Request ID
 */
export function cancelIdleCallback(id: number): void;
/**
 * Debounce a function
 * @template {(...args: any[]) => any} T
 * @param {T} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {Object} [options] - Options
 * @param {boolean} [options.leading=false] - Execute on leading edge
 * @param {boolean} [options.trailing=true] - Execute on trailing edge
 * @returns {T & { cancel: () => void, flush: () => void }} Debounced function with cancel and flush methods
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options?: {
        leading?: boolean | undefined;
        trailing?: boolean | undefined;
    }
): T & {
    cancel: () => void;
    flush: () => void;
};
/**
 * Memoize a function
 * @template {(...args: any[]) => any} T
 * @param {T} func - Function to memoize
 * @param {(...args: any[]) => string} [keyGenerator] - Optional key generator
 * @returns {T & { cache: Map<string, any>, clear: () => void }} Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: any[]) => string
): T & {
    cache: Map<string, any>;
    clear: () => void;
};
/**
 * Create a performance-optimized event handler
 * @template {Event} T
 * @param {(event: T) => void} handler - Event handler
 * @param {Object} [options] - Options
 * @param {boolean} [options.passive=true] - Use passive event listener
 * @param {number} [options.throttle] - Throttle delay
 * @param {number} [options.debounce] - Debounce delay
 * @returns {(event: T) => void} Optimized handler
 */
export function optimizeEventHandler<T extends Event>(
    handler: (event: T) => void,
    options?: {
        passive?: boolean | undefined;
        throttle?: number | undefined;
        debounce?: number | undefined;
    }
): (event: T) => void;
/**
 * Request idle callback with fallback to setTimeout
 * @param {() => void} callback - Callback to execute
 * @param {Object} [options] - Options
 * @param {number} [options.timeout] - Maximum time to wait
 * @returns {number} Request ID
 */
export function requestIdleCallback(
    callback: () => void,
    options?: {
        timeout?: number | undefined;
    }
): number;
/**
 * Throttle a function
 * @template {(...args: any[]) => any} T
 * @param {T} func - Function to throttle
 * @param {number} wait - Wait time in milliseconds
 * @returns {T & { cancel: () => void }} Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): T & {
    cancel: () => void;
};
//# sourceMappingURL=performanceUtils.d.ts.map
