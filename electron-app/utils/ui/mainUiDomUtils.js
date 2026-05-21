/**
 * DOM utilities used by the main UI and drag-and-drop handlers.
 */
import { getElementByIdFlexible } from "./dom/elementIdUtils.js";
const eventListeners = [];
/**
 * Add an event listener and register it for cleanup.
 */
export function addEventListenerWithCleanup(element, type, handler, options) {
    const abortController = new AbortController();
    try {
        if (typeof options === "boolean") {
            element.addEventListener(type, handler, {
                capture: options,
                signal: abortController.signal,
            });
        } else {
            element.addEventListener(type, handler, {
                ...options,
                signal: abortController.signal,
            });
        }
        eventListeners.push({ abortController, element, handler, type });
    } catch (error) {
        console.warn(
            `[main-ui] Failed to add event listener for ${type}`,
            error
        );
    }
}
/**
 * Remove all tracked event listeners.
 */
export function cleanupEventListeners() {
    for (const entry of eventListeners) {
        try {
            entry.abortController.abort();
        } catch {
            /* ignore */
        }
    }
    eventListeners.length = 0;
}
/**
 * Validate Electron API availability for FIT decoding.
 */
export function validateElectronAPI() {
    const candidate = globalThis;
    return typeof candidate.electronAPI?.decodeFitFile === "function";
}
/**
 * Fetch an element by id and warn if missing.
 */
export function validateElement(id) {
    const element = getElementByIdFlexible(document, id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
}
