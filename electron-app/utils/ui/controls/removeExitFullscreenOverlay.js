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
 * Removes the exit fullscreen overlay button from the specified container
 *
 * Uses caching for improved performance and supports both modern and legacy removal methods.
 * Automatically cleans up cache entries when overlays are removed.
 *
 * @param {HTMLElement} container - The DOM element from which to remove the overlay button
 * @throws {TypeError} If container is not a valid DOM element
 * @example
 * // Remove exit fullscreen overlay from a chart container
 * removeExitFullscreenOverlay(document.getElementById('chart-container'));
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
 * Removes the overlay element using the appropriate method
 * @param {HTMLElement} overlay - The overlay element to remove
 * @private
 */
function removeOverlayElement(overlay) {
    // Use modern remove() method if available
    if (typeof overlay.remove === "function") {
        overlay.remove();
    } else if (overlay.parentNode) {
        // Fallback to legacy removeChild for older browsers
        overlay.parentNode.removeChild(overlay);
    } else {
        throw new Error("Unable to remove overlay: no removal method available");
    }
}
