import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
/**
 * Sets up a tab button by assigning a click event handler to it.
 *
 * @param id - The ID of the button element.
 * @param handler - The event handler function to be executed on click.
 *
 * @returns Cleanup function to remove the event listener, or void if setup
 *   failed.
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
    const clickHandler = handler;
    const fn = setupTabButton,
        cache = (fn.cache ??= new Map());
    let btn = cache.get(id);
    if (btn) {
        // Verify cached element is still in DOM
        if (!btn.isConnected) {
            console.warn(
                `Cached button with id "${id}" is no longer in DOM. Refreshing cache.`
            );
            cache.delete(id);
            btn = document.getElementById(id);
            if (btn) {
                cache.set(id, btn);
            } else {
                console.warn(
                    `Button with id "${id}" not found after cache refresh.`
                );
                return;
            }
        }
    } else {
        btn = document.getElementById(id);
        if (btn) {
            cache.set(id, btn);
        } else {
            console.warn(
                `Button with id "${id}" not found. Ensure the element exists in the DOM.`
            );
            return;
        }
    }
    // Clean up any existing handlers to prevent memory leaks
    const tabButton = btn;
    if (tabButton._setupTabButtonCleanup) {
        tabButton._setupTabButtonCleanup();
    }
    // Use centralized event listener manager for automatic cleanup tracking
    const cleanup = addEventListenerWithCleanup(
        tabButton,
        "click",
        clickHandler
    );
    // Store cleanup function for potential manual cleanup
    tabButton._setupTabButtonCleanup = cleanup;
    return cleanup;
}
/**
 * Internal cache map for button elements keyed by id.
 */
// Initialize the cache property definition so TypeScript (checkJs) recognizes it
Object.assign(setupTabButton, {
    cache: setupTabButton.cache,
});
/**
 * Clears the cache and removes all event handlers Useful for cleanup during
 * page navigation or testing
 */
export function clearTabButtonCache() {
    const { cache } = setupTabButton;
    if (cache) {
        // Clean up event handlers before clearing cache
        for (const btn of cache.values()) {
            const tabButton = btn;
            if (tabButton._setupTabButtonCleanup) {
                tabButton._setupTabButtonCleanup();
                delete tabButton._setupTabButtonCleanup;
            }
        }
        cache.clear();
    }
}
