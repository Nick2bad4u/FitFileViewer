/**
 * DOM utilities used by the main UI and drag-and-drop handlers.
 */

import { getElementByIdFlexible } from "./dom/elementIdUtils.js";

/**
 * @type {{
 *     element: EventTarget;
 *     type: string;
 *     handler: EventListenerOrEventListenerObject;
 *     options?: AddEventListenerOptions | boolean;
 * }[]}
 */
const eventListeners = [];

/**
 * Add an event listener and register it for cleanup.
 *
 * @param {EventTarget} element
 * @param {string} type
 * @param {EventListenerOrEventListenerObject} handler
 * @param {AddEventListenerOptions | boolean} [options]
 */
export function addEventListenerWithCleanup(element, type, handler, options) {
    try {
        element.addEventListener(type, handler, options);
        eventListeners.push({ element, type, handler, options });
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
            entry.element.removeEventListener(
                entry.type,
                entry.handler,
                entry.options
            );
        } catch {
            /* ignore */
        }
    }
    eventListeners.length = 0;
}

/**
 * Validate Electron API availability for FIT decoding.
 *
 * @returns {boolean}
 */
export function validateElectronAPI() {
    return (
        globalThis.electronAPI &&
        typeof globalThis.electronAPI.decodeFitFile === "function"
    );
}

/**
 * Fetch an element by id and warn if missing.
 *
 * @param {string} id
 *
 * @returns {HTMLElement | null}
 */
export function validateElement(id) {
    const element = getElementByIdFlexible(document, id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
}
