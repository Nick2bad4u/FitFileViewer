/**
 * Fullscreen overlay removal configuration
 * @readonly
 */
const OVERLAY_CONFIG = {
    CSS_CLASS: "exit-fullscreen-overlay",
    MESSAGES: {
        INVALID_CONTAINER: "Container must be a valid DOM element",
        OVERLAY_NOT_FOUND: "No exit fullscreen overlay found in container",
        REMOVAL_FAILED: "Failed to remove exit fullscreen overlay:",
    },
},
    /**
     * Cache for storing overlay references to improve performance
     * Uses WeakMap for automatic garbage collection when containers are removed
     * @private
     */
    overlayCache = new WeakMap();

/**
 * Removes the fullscreen exit overlay element if it exists
 *
 * This function provides a safe and performant way to remove the fullscreen exit overlay
 * element from the DOM. It includes caching for improved performance.
 *
 * @returns {void}
 *
 * @example
 * // Remove the fullscreen exit overlay
 * removeExitFullscreenOverlay();
 *
 * @public
 * @since 1.0.0
 */
export function removeExitFullscreenOverlay(container) {
    // Input validation
    if (!container || !(container instanceof HTMLElement)) {
        throw new TypeError(OVERLAY_CONFIG.MESSAGES.INVALID_CONTAINER);
    }

    try {
        const overlay = findOverlay(container);

        if (overlay) {
            removeOverlayElement(overlay);
            overlayCache.delete(container);
        } else {
            console.debug(`[removeExitFullscreenOverlay] ${OVERLAY_CONFIG.MESSAGES.OVERLAY_NOT_FOUND}`);
        }
    } catch (error) {
        console.error(`[removeExitFullscreenOverlay] ${OVERLAY_CONFIG.MESSAGES.REMOVAL_FAILED}`, error);
        throw error;
    }
}

/**
 * Finds the overlay element in the container using cache optimization
 * @param {HTMLElement} container - The container to search in
 * @returns {HTMLElement|null} The overlay element or null if not found
 * @private
 */
function findOverlay(container) {
    // Check cache first for performance
    let overlay = overlayCache.get(container);

    if (!overlay) {
        // Search DOM if not in cache
        overlay = container.querySelector(`.${OVERLAY_CONFIG.CSS_CLASS}`);

        if (overlay) {
            overlayCache.set(container, overlay);
        }
    }

    return overlay;
}

/**
 * Removes the overlay element using the modern remove() method
 * @param {HTMLElement} overlay - The overlay element to remove
 * @private
 */
function removeOverlayElement(overlay) {
    overlay.remove();
}
