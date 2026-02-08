/**
 * @file Map action buttons utilities for FitFileViewer
 *
 *   This module provides functions to create interactive map controls and manage
 *   FIT file overlays. Features include:
 *
 *   - Print/export buttons for map visualization
 *   - Elevation profile modal with theme-aware styling
 *   - FIT file overlay management with drag-and-drop support
 *   - Marker count selector for performance optimization
 *   - Loading overlays with progress tracking
 *   - CSS-based theming that integrates with the application's theme system
 *
 *   All components use CSS custom properties and classes for theming, ensuring
 *   consistent styling that automatically adapts to theme changes. The module
 *   follows modern ES6+ patterns with proper JSDoc documentation and modular
 *   architecture.
 *
 * @author FitFileViewer Team
 *
 * @since 1.0.0
 */

import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

export function hideLoadingOverlay() {
    LoadingOverlay.hide();
}

// Export loading functions for backward compatibility
/**
 * Show a global loading overlay on the map.
 *
 * @param {string} progressText
 * @param {string} [fileName]
 */
export function showLoadingOverlay(progressText, fileName = "") {
    LoadingOverlay.show(progressText, fileName);
}

// Export map theme toggle for map controls

/**
 * Centers the map on the main file's track
 *
 * @private
 */
/**
 * Center the map viewport on the main (index 0) polyline if available. Provides
 * fallbacks and defensive guards for optional globals.
 *
 * @private
 */
function _centerMapOnMainFile() {
    try {
        console.log("[mapActionButtons] Attempting to zoom to main polyline");
        const w = /** @type {any} */ (globalThis);

        const MAX_ATTEMPTS = 8;

        const clearRetryTimer = () => {
            if (
                w.__centerRetryHandle &&
                typeof globalThis.clearTimeout === "function"
            ) {
                globalThis.clearTimeout(w.__centerRetryHandle);
            }
            w.__centerRetryHandle = null;
        };

        const scheduleRetry = () => {
            if (typeof globalThis.setTimeout === "function") {
                clearRetryTimer();
                w.__centerRetryHandle = globalThis.setTimeout(() => {
                    w.__centerRetryHandle = null;
                    _centerMapOnMainFile();
                }, 150);
            } else {
                queueMicrotask(() => {
                    _centerMapOnMainFile();
                });
            }
        };

        const attempts = Number.isInteger(w.__centerMainAttempts)
            ? w.__centerMainAttempts
            : 0;

        let mainPolyline = /** @type {any} */ (w._mainPolyline);
        if (!mainPolyline && w._overlayPolylines) {
            const overlayCollection = /** @type {any} */ (w._overlayPolylines);
            mainPolyline =
                overlayCollection?.[0] ?? overlayCollection?.["0"] ?? null;
        }
        const hasValidBounds = Boolean(
            w._mainPolylineOriginalBounds &&
            typeof w._mainPolylineOriginalBounds.isValid === "function" &&
            w._mainPolylineOriginalBounds.isValid()
        );

        if (!mainPolyline) {
            if (attempts === 0) {
                w.__centerStatusNotified = Date.now();
                showNotification("Centering map on main track…", "info");
            }

            if (w._leafletMapInstance && attempts < MAX_ATTEMPTS) {
                w.__centerMainAttempts = attempts + 1;
                scheduleRetry();
                return;
            }

            clearRetryTimer();
            w.__centerMainAttempts = 0;
            w.__centerStatusNotified = 0;

            const noMap = !w._leafletMapInstance;
            const logFn = noMap ? console.info : console.warn;
            const message = noMap
                ? "Map not ready for centering"
                : "No main track to center on";
            logFn(`[mapActionButtons] ${message}`);
            showNotification(message, "warning");
            return;
        }

        clearRetryTimer();
        w.__centerMainAttempts = 0;
        const statusPending = Boolean(w.__centerStatusNotified);
        w.__centerStatusNotified = 0;

        const polyline = mainPolyline;

        // Bring polyline to front
        if (polyline.bringToFront) {
            polyline.bringToFront();
        }

        // Bring associated markers to front
        if (
            w.L &&
            w.L.CircleMarker &&
            polyline?._map &&
            polyline._map._layers
        ) {
            for (const layer of Object.values(polyline._map._layers)) {
                try {
                    if (
                        layer instanceof w.L.CircleMarker &&
                        layer.options &&
                        polyline.options &&
                        layer.options.color === polyline.options.color &&
                        layer.bringToFront
                    ) {
                        layer.bringToFront();
                    }
                } catch {
                    // Ignore bringToFront issues
                }
            }
        }

        // Add visual highlighting effect
        const polyElem = polyline.getElement && polyline.getElement();
        if (polyElem) {
            polyElem.style.transition = "filter 0.2s";
            polyElem.style.filter = `drop-shadow(0 0 16px ${polyline.options.color || "#1976d2"})`;

            const highlightToken = Date.now();
            w.__mainPolylineHighlightToken = highlightToken;

            setTimeout(() => {
                const w2 = /** @type {any} */ (globalThis);
                if (w2.__mainPolylineHighlightToken === highlightToken) {
                    polyElem.style.filter = `drop-shadow(0 0 8px ${polyline.options.color || "#1976d2"})`;
                }
            }, 250);
        }

        // Fit map bounds to main polyline only
        if (w._leafletMapInstance) {
            let bounds = null;

            if (hasValidBounds) {
                bounds = w._mainPolylineOriginalBounds;
                console.log(
                    "[mapActionButtons] Using stored main polyline bounds"
                );
            } else if (polyline.getBounds) {
                bounds = polyline.getBounds();
                console.warn(
                    "[mapActionButtons] Using polyline getBounds as fallback"
                );
            }

            if (bounds && bounds.isValid && bounds.isValid()) {
                console.log("[mapActionButtons] Fitting map to bounds");
                w._leafletMapInstance.fitBounds(bounds, { padding: [20, 20] });

                setTimeout(() => {
                    try {
                        const center = w._leafletMapInstance.getCenter(),
                            zoom = w._leafletMapInstance.getZoom();
                        console.log(
                            `[mapActionButtons] Map centered at ${center.lat}, ${center.lng}, zoom: ${zoom}`
                        );
                    } catch {
                        console.warn(
                            "[mapActionButtons] Error getting map state after centering (details suppressed)"
                        );
                    }
                }, 200);
            } else {
                console.warn(
                    "[mapActionButtons] No valid bounds found for main polyline"
                );
                showNotification("Could not determine track bounds", "warning");
            }
        } else {
            console.warn(
                "[mapActionButtons] Leaflet map instance not available"
            );
            showNotification("Map not ready for centering", "warning");
        }

        if (statusPending) {
            showNotification("Centered on main track.", "success");
        }
    } catch (error) {
        console.error(
            "[mapActionButtons] Error centering map on main file:",
            error
        );
        showNotification("Failed to center map on main file", "error");
    }
}

/**
 * Sets up interactive functionality for the active file name element Makes the
 * file name clickable to center map on the main file
 *
 * @private
 */
/**
 * Adds click/hover actions to the active file name element allowing centering
 * and highlighting on the primary (index 0) map overlay. Safely guards all
 * window global usages with casts to avoid type errors under checkJs.
 */
function setupActiveFileNameMapActions() {
    try {
        const activeFileName = querySelectorByIdFlexible(
            document,
            "#active_file_name"
        );
        if (!activeFileName) {
            console.log(
                "[mapActionButtons] #active_file_name not found in DOM"
            );
            return;
        }

        // Configure element appearance and behavior
        activeFileName.style.cursor = "pointer";
        activeFileName.title = "Click to center map on main file";

        // Remove any previous listeners to avoid stacking
        activeFileName.onclick = null;
        activeFileName.onmouseenter = null;
        activeFileName.onmouseleave = null;

        // Click handler - center map on main file
        activeFileName.addEventListener("click", () => {
            try {
                console.log("[mapActionButtons] Active file name clicked");

                // Always switch to map tab (even if already active, to ensure map is visible)
                const mapTabBtn = document.querySelector("#tab_map");
                if (mapTabBtn instanceof HTMLElement) {
                    console.log("[mapActionButtons] Switching to map tab");
                    mapTabBtn.click();

                    // Center on main file with a slight delay to ensure tab switch completes
                    setTimeout(() => {
                        _centerMapOnMainFile();
                    }, 100);
                } else {
                    // If map tab button not found, still try to center
                    console.warn(
                        "[mapActionButtons] Map tab button not found, attempting to center anyway"
                    );
                    _centerMapOnMainFile();
                }
            } catch (error) {
                console.error(
                    "[mapActionButtons] Error in active filename click:",
                    error
                );
                // Correct argument order: (message, type)
                showNotification("Failed to center map on file", "error");
            }
        });

        // Hover handlers for visual feedback using CSS classes
        activeFileName.addEventListener("mouseenter", () => {
            try {
                console.log("[mapActionButtons] Active file name hover");
                activeFileName.classList.add("highlighted");
                const w = /** @type {any} */ (globalThis);
                w._highlightedOverlayIdx = 0;
                if (w.updateOverlayHighlights) {
                    w.updateOverlayHighlights();
                }
            } catch (error) {
                console.error("[mapActionButtons] Error in mouseenter:", error);
            }
        });

        activeFileName.addEventListener("mouseleave", () => {
            try {
                console.log("[mapActionButtons] Active file name unhover");
                activeFileName.classList.remove("highlighted");
                const w = /** @type {any} */ (globalThis);
                w._highlightedOverlayIdx = null;
                if (w.updateOverlayHighlights) {
                    w.updateOverlayHighlights();
                }
            } catch (error) {
                console.error("[mapActionButtons] Error in mouseleave:", error);
            }
        });
    } catch (error) {
        console.error(
            "[mapActionButtons] Error setting up active filename actions:",
            error
        );
    }
}

// Initialize active filename functionality with mutation observer
(function initializeActiveFileName() {
    try {
        const targetElement = querySelectorByIdFlexible(
                document,
                "#active_file_name"
            ),
            parent = targetElement?.parentNode;

        if (!parent) {
            console.log(
                "[mapActionButtons] Active filename parent not found for observer"
            );
            // Try again after DOM loads
            if (document.readyState === "loading") {
                document.addEventListener(
                    "DOMContentLoaded",
                    initializeActiveFileName
                );
            }
            return;
        }

        // Set up mutation observer to handle dynamic content changes
        const observer = new MutationObserver(() => {
            console.log(
                "[mapActionButtons] Active filename element changed, reapplying setup"
            );
            setupActiveFileNameMapActions();
        });

        observer.observe(parent, { childList: true, subtree: false });

        // Initial setup
        setupActiveFileNameMapActions();
    } catch (error) {
        console.error(
            "[mapActionButtons] Error initializing active filename:",
            error
        );
    }
})();

// Export setup function for external use
// Expose setup method on window for external triggers (cast for global augmentation safety)
/** @type {any} */ (globalThis)._setupActiveFileNameMapActions =
    setupActiveFileNameMapActions;

// Patch updateShownFilesList to always maintain active filename functionality
(function patchUpdateShownFilesList() {
    try {
        const w = /** @type {any} */ (globalThis),
            origUpdateShownFilesList = w.updateShownFilesList;

        w.updateShownFilesList = function (...args) {
            try {
                if (origUpdateShownFilesList) {
                    Reflect.apply(origUpdateShownFilesList, this, args);
                }
                console.log(
                    "[mapActionButtons] Files list updated, reapplying active filename setup"
                );
                setupActiveFileNameMapActions();
            } catch (error) {
                console.error(
                    "[mapActionButtons] Error in patched updateShownFilesList:",
                    error
                );
            }
        };
    } catch (error) {
        console.error(
            "[mapActionButtons] Error patching updateShownFilesList:",
            error
        );
    }
})();
export { createMapThemeToggle } from "../../theming/specific/createMapThemeToggle.js";
