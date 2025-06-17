/**
 * @fileoverview Map action buttons utilities for FitFileViewer
 *
 * This module provides functions to create interactive map controls and manage FIT file overlays.
 * Features include:
 * - Print/export buttons for map visualization
 * - Elevation profile modal with theme-aware styling
 * - FIT file overlay management with drag-and-drop support
 * - Marker count selector for performance optimization
 * - Loading overlays with progress tracking
 * - CSS-based theming that integrates with the application's theme system
 *
 * All components use CSS custom properties and classes for theming, ensuring
 * consistent styling that automatically adapts to theme changes. The module
 * follows modern ES6+ patterns with proper JSDoc documentation and modular architecture.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

import { showNotification } from "./showNotification.js";
import { LoadingOverlay } from "./LoadingOverlay.js";
import { createMapThemeToggle } from "./createMapThemeToggle.js";

// Export loading functions for backward compatibility
export function showLoadingOverlay(progressText, fileName = "") {
    LoadingOverlay.show(progressText, fileName);
}

export function hideLoadingOverlay() {
    LoadingOverlay.hide();
}

// Export map theme toggle for map controls
export { createMapThemeToggle };

/**
 * Sets up interactive functionality for the active file name element
 * Makes the file name clickable to center map on the main file
 * @private
 */
function setupActiveFileNameMapActions() {
    try {
        const activeFileName = document.getElementById("activeFileName");
        if (!activeFileName) {
            console.log("[mapActionButtons] #activeFileName not found in DOM");
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
        activeFileName.onclick = () => {
            try {
                console.log("[mapActionButtons] Active file name clicked");

                // Switch to map tab if not active
                const mapTabBtn = document.querySelector('[data-tab="map"]');
                if (mapTabBtn && !mapTabBtn.classList.contains("active")) {
                    console.log("[mapActionButtons] Switching to map tab");
                    mapTabBtn.click();
                }

                // Center on main file with a slight delay to ensure tab switch completes
                setTimeout(() => {
                    _centerMapOnMainFile();
                }, 100);
            } catch (error) {
                console.error("[mapActionButtons] Error in active filename click:", error);
                showNotification("Error", "Failed to center map on file", "error");
            }
        };

        // Hover handlers for visual feedback using CSS classes
        activeFileName.onmouseenter = () => {
            try {
                console.log("[mapActionButtons] Active file name hover");
                activeFileName.classList.add("highlighted");
                window._highlightedOverlayIdx = 0;
                if (window.updateOverlayHighlights) {
                    window.updateOverlayHighlights();
                }
            } catch (error) {
                console.error("[mapActionButtons] Error in mouseenter:", error);
            }
        };

        activeFileName.onmouseleave = () => {
            try {
                console.log("[mapActionButtons] Active file name unhover");
                activeFileName.classList.remove("highlighted");
                window._highlightedOverlayIdx = null;
                if (window.updateOverlayHighlights) {
                    window.updateOverlayHighlights();
                }
            } catch (error) {
                console.error("[mapActionButtons] Error in mouseleave:", error);
            }
        };
    } catch (error) {
        console.error("[mapActionButtons] Error setting up active filename actions:", error);
    }
}

/**
 * Centers the map on the main file's track
 * @private
 */
function _centerMapOnMainFile() {
    try {
        const idx = 0; // Main file is always index 0
        console.log("[mapActionButtons] Attempting to zoom to main polyline");

        if (!window._overlayPolylines || !window._overlayPolylines[idx]) {
            console.warn("[mapActionButtons] No main polyline found");
            showNotification("Info", "No main track to center on", "info");
            return;
        }

        const polyline = window._overlayPolylines[idx];
        window._highlightedOverlayIdx = idx;

        if (window.updateOverlayHighlights) {
            window.updateOverlayHighlights();
        }

        // Bring polyline to front
        if (polyline.bringToFront) {
            polyline.bringToFront();
        }

        // Bring associated markers to front
        if (window.L && window.L.CircleMarker && polyline._map && polyline._map._layers) {
            Object.values(polyline._map._layers).forEach((layer) => {
                if (
                    layer instanceof window.L.CircleMarker &&
                    layer.options &&
                    polyline.options &&
                    layer.options.color === polyline.options.color
                ) {
                    if (layer.bringToFront) {
                        layer.bringToFront();
                    }
                }
            });
        }

        // Add visual highlighting effect
        const polyElem = polyline.getElement && polyline.getElement();
        if (polyElem) {
            polyElem.style.transition = "filter 0.2s";
            polyElem.style.filter = `drop-shadow(0 0 16px ${polyline.options.color || "#1976d2"})`;

            setTimeout(() => {
                if (window._highlightedOverlayIdx === idx) {
                    polyElem.style.filter = `drop-shadow(0 0 8px ${polyline.options.color || "#1976d2"})`;
                }
            }, 250);
        }

        // Fit map bounds to main polyline only
        if (window._leafletMapInstance) {
            let bounds = null;

            if (
                window._mainPolylineOriginalBounds &&
                window._mainPolylineOriginalBounds.isValid &&
                window._mainPolylineOriginalBounds.isValid()
            ) {
                bounds = window._mainPolylineOriginalBounds;
                console.log("[mapActionButtons] Using stored main polyline bounds");
            } else if (polyline.getBounds) {
                bounds = polyline.getBounds();
                console.warn("[mapActionButtons] Using polyline getBounds as fallback");
            }

            if (bounds && bounds.isValid && bounds.isValid()) {
                console.log("[mapActionButtons] Fitting map to bounds");
                window._leafletMapInstance.fitBounds(bounds, { padding: [20, 20] });

                setTimeout(() => {
                    try {
                        const center = window._leafletMapInstance.getCenter();
                        const zoom = window._leafletMapInstance.getZoom();
                        console.log(`[mapActionButtons] Map centered at ${center.lat}, ${center.lng}, zoom: ${zoom}`);
                    } catch (err) {
                        console.warn("[mapActionButtons] Error getting map state after centering:", err);
                    }
                }, 200);
            } else {
                console.warn("[mapActionButtons] No valid bounds found for main polyline");
                showNotification("Warning", "Could not determine track bounds", "warning");
            }
        } else {
            console.warn("[mapActionButtons] Leaflet map instance not available");
            showNotification("Warning", "Map not ready for centering", "warning");
        }
    } catch (error) {
        console.error("[mapActionButtons] Error centering map on main file:", error);
        showNotification("Error", "Failed to center map on main file", "error");
    }
}

// Initialize active filename functionality with mutation observer
(function initializeActiveFileName() {
    try {
        const targetElement = document.getElementById("activeFileName");
        const parent = targetElement?.parentNode;

        if (!parent) {
            console.log("[mapActionButtons] Active filename parent not found for observer");
            // Try again after DOM loads
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", initializeActiveFileName);
            }
            return;
        }

        // Set up mutation observer to handle dynamic content changes
        const observer = new MutationObserver(() => {
            console.log("[mapActionButtons] Active filename element changed, reapplying setup");
            setupActiveFileNameMapActions();
        });

        observer.observe(parent, { childList: true, subtree: false });

        // Initial setup
        setupActiveFileNameMapActions();
    } catch (error) {
        console.error("[mapActionButtons] Error initializing active filename:", error);
    }
})();

// Export setup function for external use
window._setupActiveFileNameMapActions = setupActiveFileNameMapActions;

// Patch updateShownFilesList to always maintain active filename functionality
(function patchUpdateShownFilesList() {
    try {
        const origUpdateShownFilesList = window.updateShownFilesList;

        window.updateShownFilesList = function () {
            try {
                if (origUpdateShownFilesList) {
                    origUpdateShownFilesList.apply(this, arguments);
                }
                console.log("[mapActionButtons] Files list updated, reapplying active filename setup");
                setupActiveFileNameMapActions();
            } catch (error) {
                console.error("[mapActionButtons] Error in patched updateShownFilesList:", error);
            }
        };
    } catch (error) {
        console.error("[mapActionButtons] Error patching updateShownFilesList:", error);
    }
})();
