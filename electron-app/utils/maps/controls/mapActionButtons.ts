/**
 * Map action buttons utilities for FitFileViewer.
 *
 * This module provides functions to create interactive map controls and manage
 * FIT file overlays. Features include:
 *
 * - Print/export buttons for map visualization
 * - Elevation profile modal with theme-aware styling
 * - FIT file overlay management with drag-and-drop support
 * - Marker count selector for performance optimization
 * - Loading overlays with progress tracking
 * - CSS-based theming that integrates with the application's theme system
 *
 * All components use CSS custom properties and classes for theming, ensuring
 * consistent styling that automatically adapts to theme changes. The module
 * follows modern ES6+ patterns with proper documentation and modular
 * architecture.
 */

import { createMapThemeToggle as createMapThemeToggleImplementation } from "../../theming/specific/createMapThemeToggle.js";
import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { addEventListenerWithCleanup } from "../../ui/events/eventListenerManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

type MapBounds = {
    isValid?: () => boolean;
};

type MapLayer = {
    bringToFront?: () => void;
    options?: {
        color?: string;
    };
};

type MapPolyline = MapLayer & {
    _map?: {
        _layers?: Record<string, unknown>;
    };
    getBounds?: () => MapBounds | null;
    getElement?: () => HTMLElement | SVGElement | null;
};

type OverlayPolylineCollection = {
    [index: number]: MapPolyline | null | undefined;
    [key: string]: MapPolyline | null | undefined;
};

type LeafletMapInstance = {
    fitBounds: (
        bounds: MapBounds,
        options: { padding: [number, number] }
    ) => void;
    getCenter?: () => { lat: number; lng: number };
    getZoom?: () => number;
};

type CircleMarkerConstructor = abstract new (...args: never[]) => object;

type MapActionButtonsGlobal = typeof globalThis & {
    __centerMainAttempts?: number;
    __centerRetryHandle?: ReturnType<typeof setTimeout> | null;
    __centerStatusNotified?: number;
    __mainPolylineHighlightToken?: number;
    _highlightedOverlayIdx?: null | number;
    _leafletMapInstance?: LeafletMapInstance | null;
    _mainPolyline?: MapPolyline | null;
    _mainPolylineOriginalBounds?: MapBounds | null;
    _overlayPolylines?: OverlayPolylineCollection;
    _setupActiveFileNameMapActions?: () => void;
    L?: {
        CircleMarker?: CircleMarkerConstructor;
    };
    updateOverlayHighlights?: () => void;
    updateShownFilesList?: (...args: unknown[]) => unknown;
};

type ActiveFileNameElement = HTMLElement & {
    __ffvMapActionCleanup?: () => void;
};

const activeTimers = new Set<ReturnType<typeof setTimeout>>();

function getMapActionButtonsGlobal(): MapActionButtonsGlobal {
    return globalThis as MapActionButtonsGlobal;
}

function isMapLayer(value: unknown): value is MapLayer {
    return typeof value === "object" && value !== null;
}

function scheduleMapActionTimeout(callback: () => void, delayMs: number): void {
    const handle = setTimeout(() => {
        activeTimers.delete(handle);
        callback();
    }, delayMs);
    activeTimers.add(handle);
}

/**
 * Hides the global map loading overlay.
 */
export function hideLoadingOverlay(): void {
    LoadingOverlay.hide();
}

// Export loading functions for backward compatibility
/**
 * Show a global loading overlay on the map.
 *
 * @param progressText - Overlay progress message.
 * @param fileName - Optional file name to show in the overlay.
 */
export function showLoadingOverlay(progressText: string, fileName = ""): void {
    LoadingOverlay.show(progressText, fileName);
}

// Export map theme toggle for map controls

/**
 * Center the map viewport on the main (index 0) polyline if available. Provides
 * fallbacks and defensive guards for optional globals.
 */
function _centerMapOnMainFile(): void {
    try {
        console.log("[mapActionButtons] Attempting to zoom to main polyline");
        const w = getMapActionButtonsGlobal();

        const MAX_ATTEMPTS = 8;

        const clearRetryTimer = (): void => {
            if (
                w.__centerRetryHandle &&
                typeof globalThis.clearTimeout === "function"
            ) {
                globalThis.clearTimeout(w.__centerRetryHandle);
            }
            w.__centerRetryHandle = null;
        };

        const scheduleRetry = (): void => {
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

        const attempts =
            typeof w.__centerMainAttempts === "number" &&
            Number.isInteger(w.__centerMainAttempts)
            ? w.__centerMainAttempts
            : 0;

        let mainPolyline = w._mainPolyline;
        if (!mainPolyline && w._overlayPolylines) {
            const overlayCollection = w._overlayPolylines;
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
        polyline.bringToFront?.();

        // Bring associated markers to front
        const circleMarker = w.L?.CircleMarker;
        if (
            circleMarker &&
            polyline?._map &&
            polyline._map._layers
        ) {
            for (const layer of Object.values(polyline._map._layers)) {
                try {
                    if (
                        layer instanceof circleMarker &&
                        isMapLayer(layer) &&
                        layer.options?.color === polyline.options?.color
                    ) {
                        layer.bringToFront?.();
                    }
                } catch {
                    // Ignore bringToFront issues
                }
            }
        }

        // Add visual highlighting effect
        const polyElem = polyline.getElement?.();
        if (polyElem) {
            polyElem.style.transition = "filter 0.2s";
            polyElem.style.filter = `drop-shadow(0 0 16px ${polyline.options?.color || "#1976d2"})`;

            const highlightToken = Date.now();
            w.__mainPolylineHighlightToken = highlightToken;

            scheduleMapActionTimeout(() => {
                const w2 = getMapActionButtonsGlobal();
                if (w2.__mainPolylineHighlightToken === highlightToken) {
                    polyElem.style.filter = `drop-shadow(0 0 8px ${polyline.options?.color || "#1976d2"})`;
                }
            }, 250);
        }

        // Fit map bounds to main polyline only
        if (w._leafletMapInstance) {
            let bounds: MapBounds | null | undefined;

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

            if (bounds?.isValid?.()) {
                console.log("[mapActionButtons] Fitting map to bounds");
                w._leafletMapInstance.fitBounds(bounds, { padding: [20, 20] });

                scheduleMapActionTimeout(() => {
                    try {
                        const center = w._leafletMapInstance?.getCenter?.(),
                            zoom = w._leafletMapInstance?.getZoom?.();
                        console.log(
                            `[mapActionButtons] Map centered at ${center?.lat}, ${center?.lng}, zoom: ${zoom}`
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
 */
/**
 * Adds click/hover actions to the active file name element allowing centering
 * and highlighting on the primary (index 0) map overlay. Safely guards all
 * window global usages with casts to avoid type errors under checkJs.
 */
function setupActiveFileNameMapActions(): void {
    try {
        const activeFileName = querySelectorByIdFlexible(
            document,
            "#active_file_name"
        ) as ActiveFileNameElement | null;
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
        activeFileName.__ffvMapActionCleanup?.();

        const cleanupCallbacks: Array<() => void> = [];

        // Click handler - center map on main file
        cleanupCallbacks.push(
            addEventListenerWithCleanup(activeFileName, "click", () => {
                try {
                    console.log("[mapActionButtons] Active file name clicked");

                    // Always switch to map tab (even if already active, to ensure map is visible)
                    const mapTabBtn = querySelectorByIdFlexible(
                        document,
                        "#tab_map"
                    );
                    if (mapTabBtn instanceof HTMLElement) {
                        console.log("[mapActionButtons] Switching to map tab");
                        mapTabBtn.click();

                        // Center on main file with a slight delay to ensure tab switch completes
                        scheduleMapActionTimeout(() => {
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
            })
        );

        // Hover handlers for visual feedback using CSS classes
        cleanupCallbacks.push(
            addEventListenerWithCleanup(activeFileName, "mouseenter", () => {
                try {
                    console.log("[mapActionButtons] Active file name hover");
                    activeFileName.classList.add("highlighted");
                    const w = getMapActionButtonsGlobal();
                    w._highlightedOverlayIdx = 0;
                    if (w.updateOverlayHighlights) {
                        w.updateOverlayHighlights();
                    }
                } catch (error) {
                    console.error(
                        "[mapActionButtons] Error in mouseenter:",
                        error
                    );
                }
            })
        );

        cleanupCallbacks.push(
            addEventListenerWithCleanup(activeFileName, "mouseleave", () => {
                try {
                    console.log("[mapActionButtons] Active file name unhover");
                    activeFileName.classList.remove("highlighted");
                    const w = getMapActionButtonsGlobal();
                    w._highlightedOverlayIdx = null;
                    if (w.updateOverlayHighlights) {
                        w.updateOverlayHighlights();
                    }
                } catch (error) {
                    console.error(
                        "[mapActionButtons] Error in mouseleave:",
                        error
                    );
                }
            })
        );

        activeFileName.__ffvMapActionCleanup = () => {
            for (const cleanup of cleanupCallbacks) {
                cleanup();
            }
            delete activeFileName.__ffvMapActionCleanup;
        };
    } catch (error) {
        console.error(
            "[mapActionButtons] Error setting up active filename actions:",
            error
        );
    }
}

// Initialize active filename functionality with mutation observer
(function initializeActiveFileName(): void {
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
                addEventListenerWithCleanup(
                    document,
                    "DOMContentLoaded",
                    initializeActiveFileName,
                    { once: true }
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
getMapActionButtonsGlobal()._setupActiveFileNameMapActions =
    setupActiveFileNameMapActions;

// Patch updateShownFilesList to always maintain active filename functionality
(function patchUpdateShownFilesList(): void {
    try {
        const w = getMapActionButtonsGlobal(),
            origUpdateShownFilesList = w.updateShownFilesList;

        w.updateShownFilesList = function (
            this: unknown,
            ...args: unknown[]
        ): void {
            try {
                if (typeof origUpdateShownFilesList === "function") {
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

/**
 * Creates the map theme toggle control used by the map toolbar.
 */
export const createMapThemeToggle = createMapThemeToggleImplementation;
