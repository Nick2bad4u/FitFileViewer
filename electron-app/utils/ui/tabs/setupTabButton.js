import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";

/**
 * Sets up a tab button by assigning a click event handler to it.
 *
 * @param {string} id - The ID of the button element.
 * @param {Function} handler - The event handler function to be executed on click.
 * @returns {Function|void} Cleanup function to remove the event listener, or void if setup failed
 * @throws {void} Logs a warning if the button with the given `id` is not found.
 */
export function setupTabButton(id, handler) {
    if (id == null || typeof id !== "string" || id.trim() === "") {
        console.warn("Invalid button id provided.");
        return;
    }

    if (typeof handler !== "function") {
        console.warn("Invalid handler provided. It must be a function.");
        return;
    }

    // Cast function to any to access/initialize lazy static cache property without TS checkJs error
    const fn = /** @type {any} */ (setupTabButton),
        cache = (fn.cache ||= new Map());
    let btn = cache.get(id);

    if (btn) {
        // Verify cached element is still in DOM
        if (!btn.isConnected) {
            console.warn(`Cached button with id "${id}" is no longer in DOM. Refreshing cache.`);
            cache.delete(id);
            btn = document.getElementById(id);
            if (btn) {
                cache.set(id, btn);
            } else {
                console.warn(`Button with id "${id}" not found after cache refresh.`);
                return;
            }
        }
    } else {
        btn = document.getElementById(id);
        if (btn) {
            cache.set(id, btn);
        } else {
            console.warn(`Button with id "${id}" not found. Ensure the element exists in the DOM.`);
            return;
        }
    }

    // Clean up any existing handlers to prevent memory leaks
    if (/** @type {any} */ (btn)._setupTabButtonCleanup) {
        /** @type {any} */ (btn)._setupTabButtonCleanup();
    }

    // Use centralized event listener manager for automatic cleanup tracking
    const cleanup = addEventListenerWithCleanup(btn, "click", handler);

    // Store cleanup function for potential manual cleanup
    /** @type {any} */ (btn)._setupTabButtonCleanup = cleanup;

    return cleanup;
}

/**
 * Internal cache map for button elements keyed by id.
 * @type {Map<string, HTMLElement> | undefined}
 */
// Initialize the cache property definition so TypeScript (checkJs) recognizes it
Object.assign(setupTabButton, {
    cache: /** @type {Map<string, HTMLElement>|undefined} */ (/** @type {any} */ (setupTabButton).cache),
});

/**
 * Clears the cache and removes all event handlers
 * Useful for cleanup during page navigation or testing
 */
export function clearTabButtonCache() {
    const { cache } = /** @type {Map<string, HTMLElement>|undefined} */ (/** @type {any} */ (setupTabButton));
    if (cache) {
        // Clean up event handlers before clearing cache
        for (const btn of cache.values()) {
            const anyBtn = /** @type {any} */ (btn);
            if (anyBtn._setupTabButtonCleanup) {
                anyBtn._setupTabButtonCleanup();
                delete anyBtn._setupTabButtonCleanup;
            }
        }
        cache.clear();
    }
}
