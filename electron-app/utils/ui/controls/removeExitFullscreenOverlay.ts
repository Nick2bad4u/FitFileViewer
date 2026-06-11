import { getRemoveExitFullscreenOverlayRuntime } from "./removeExitFullscreenOverlayRuntime.js";

/**
 * Fullscreen overlay removal configuration.
 */
const OVERLAY_CONFIG = {
    CSS_CLASS: "exit-fullscreen-overlay",
    MESSAGES: {
        INVALID_CONTAINER: "Container must be a valid DOM element",
        OVERLAY_NOT_FOUND: "No exit fullscreen overlay found in container",
        REMOVAL_FAILED: "Failed to remove exit fullscreen overlay:",
    },
} as const;

/**
 * Cache for storing overlay references to improve performance. WeakMap allows
 * automatic garbage collection when containers are removed.
 */
const overlayCache = new WeakMap<HTMLElement, HTMLElement>();

/**
 * Removes the exit fullscreen overlay button from the specified container.
 *
 * Uses caching for improved performance and automatically cleans up cache
 * entries when overlays are removed.
 *
 * @example // Remove exit fullscreen overlay from a chart container
 * removeExitFullscreenOverlay(document.getElementById("chart-container"));
 *
 * @throws TypeError If container is not a valid DOM element.
 */
export function removeExitFullscreenOverlay(
    container: HTMLElement | null | undefined
): void {
    const runtime = getRemoveExitFullscreenOverlayRuntime();

    // Input validation
    if (!container || !runtime.isHTMLElement(container)) {
        throw new TypeError(OVERLAY_CONFIG.MESSAGES.INVALID_CONTAINER);
    }

    try {
        const overlay = findOverlay(container);

        if (overlay) {
            removeOverlayElement(overlay);
            overlayCache.delete(container);
        } else {
            console.debug(
                `[removeExitFullscreenOverlay] ${OVERLAY_CONFIG.MESSAGES.OVERLAY_NOT_FOUND}`
            );
        }
    } catch (error) {
        console.error(
            `[removeExitFullscreenOverlay] ${OVERLAY_CONFIG.MESSAGES.REMOVAL_FAILED}`,
            error
        );
        throw error;
    }
}

/**
 * Finds the overlay element in the container using cache optimization.
 */
function findOverlay(container: HTMLElement): HTMLElement | null {
    // Check cache first for performance
    let overlay = overlayCache.get(container) ?? null;

    if (!overlay) {
        // Search DOM if not in cache
        overlay = container.querySelector<HTMLElement>(
            `.${OVERLAY_CONFIG.CSS_CLASS}`
        );

        if (overlay) {
            overlayCache.set(container, overlay);
        }
    }

    return overlay;
}

/**
 * Removes the overlay element using the appropriate method.
 *
 * @throws Error If the overlay cannot be removed.
 */
function removeOverlayElement(overlay: HTMLElement): void {
    if (typeof overlay.remove === "function") {
        overlay.remove();
        return;
    }

    overlay.parentNode?.removeChild(overlay);
}
