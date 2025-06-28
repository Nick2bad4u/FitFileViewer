/**
 * Sets up a tab button by assigning a click event handler to it.
 *
 * @param {string} id - The ID of the button element.
 * @param {Function} handler - The event handler function to be executed on click.
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

    const cache = setupTabButton.cache || (setupTabButton.cache = new Map());
    let btn = cache.get(id);

    if (!btn) {
        btn = document.getElementById(id);
        if (btn) {
            cache.set(id, btn);
        } else {
            console.warn(`Button with id "${id}" not found. Ensure the element exists in the DOM.`);
            return;
        }
    } else {
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
    }

    // Clean up any existing handlers to prevent memory leaks
    // Store the handler reference for potential cleanup
    if (btn._setupTabButtonHandler) {
        btn.removeEventListener("click", btn._setupTabButtonHandler);
    }

    // Store handler reference for cleanup and add new listener
    btn._setupTabButtonHandler = handler;
    btn.addEventListener("click", handler);
}

/**
 * Clears the cache and removes all event handlers
 * Useful for cleanup during page navigation or testing
 */
export function clearTabButtonCache() {
    const cache = setupTabButton.cache;
    if (cache) {
        // Clean up event handlers before clearing cache
        cache.forEach((btn) => {
            if (btn._setupTabButtonHandler) {
                btn.removeEventListener("click", btn._setupTabButtonHandler);
                delete btn._setupTabButtonHandler;
            }
        });
        cache.clear();
    }
}
