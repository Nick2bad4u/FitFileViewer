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
export function batchDOMReads<T>(readCallback: () => T[]): Promise<T[]>;
/**
 * Batch DOM writes to avoid layout thrashing
 * @param {() => void} writeCallback - Callback that writes to DOM
 * @returns {Promise<void>}
 */
export function batchDOMWrites(writeCallback: () => void): Promise<void>;
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
export function createLazyRenderer(
    element: HTMLElement,
    renderCallback: () => void | Promise<void>,
    options?: {
        threshold?: number | undefined;
        rootMargin?: string | undefined;
        once?: boolean | undefined;
    }
): {
    disconnect: () => void;
    observe: () => void;
};
/**
 * Defer execution until browser is idle
 * @param {() => void | Promise<void>} callback - Callback to execute
 * @param {Object} [options] - Options
 * @param {number} [options.timeout=2000] - Maximum timeout
 * @returns {number} Request ID
 */
export function deferUntilIdle(
    callback: () => void | Promise<void>,
    options?: {
        timeout?: number | undefined;
    }
): number;
/**
 * Check if element is visible in viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} [threshold=0] - Threshold (0-1)
 * @returns {boolean} True if visible
 */
export function isElementVisible(element: HTMLElement, threshold?: number): boolean;
