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
const CENTER_MAIN_MAX_ATTEMPTS = 8;
const MAIN_POLYLINE_HIGHLIGHT_COLOR = "#1976d2";

function getMapActionButtonsGlobal(): MapActionButtonsGlobal {
    return globalThis;
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

function clearCenterRetryTimer(w: MapActionButtonsGlobal): void {
    if (w.__centerRetryHandle) {
        globalThis.clearTimeout(w.__centerRetryHandle);
    }
    w.__centerRetryHandle = null;
}

function scheduleCenterMapRetry(w: MapActionButtonsGlobal): void {
    clearCenterRetryTimer(w);
    w.__centerRetryHandle = globalThis.setTimeout(() => {
        w.__centerRetryHandle = null;
        _centerMapOnMainFile();
    }, 150);
}

function getCenterMapAttempts(w: MapActionButtonsGlobal): number {
    return typeof w.__centerMainAttempts === "number" &&
        Number.isInteger(w.__centerMainAttempts)
        ? w.__centerMainAttempts
        : 0;
}

function getMainPolyline(w: MapActionButtonsGlobal): MapPolyline | null {
    if (w._mainPolyline) {
        return w._mainPolyline;
    }

    const overlayCollection = w._overlayPolylines;
    return overlayCollection?.[0] ?? overlayCollection?.["0"] ?? null;
}

function hasValidMainPolylineBounds(w: MapActionButtonsGlobal): boolean {
    return Boolean(
        w._mainPolylineOriginalBounds?.isValid &&
        w._mainPolylineOriginalBounds.isValid()
    );
}

function resetCenterMapState(w: MapActionButtonsGlobal): void {
    clearCenterRetryTimer(w);
    w.__centerMainAttempts = 0;
    w.__centerStatusNotified = 0;
}

function handleMissingMainPolyline(
    w: MapActionButtonsGlobal,
    attempts: number
): void {
    if (attempts === 0) {
        w.__centerStatusNotified = Date.now();
        void showNotification("Centering map on main track...", "info");
    }

    if (w._leafletMapInstance && attempts < CENTER_MAIN_MAX_ATTEMPTS) {
        w.__centerMainAttempts = attempts + 1;
        scheduleCenterMapRetry(w);
        return;
    }

    resetCenterMapState(w);

    const noMap = !w._leafletMapInstance;
    const logFn = noMap ? console.info : console.warn;
    const message = noMap
        ? "Map not ready for centering"
        : "No main track to center on";
    logFn(`[mapActionButtons] ${message}`);
    void showNotification(message, "warning");
}

function bringAssociatedMarkersToFront(
    w: MapActionButtonsGlobal,
    polyline: MapPolyline
): void {
    const circleMarker = w.L?.CircleMarker;
    if (!circleMarker || !polyline._map?._layers) {
        return;
    }

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

function highlightMainPolyline(
    w: MapActionButtonsGlobal,
    polyline: MapPolyline
): void {
    const polyElem = polyline.getElement?.();
    if (!polyElem) {
        return;
    }

    const color = polyline.options?.color ?? MAIN_POLYLINE_HIGHLIGHT_COLOR;
    polyElem.style.transition = "filter 0.2s";
    polyElem.style.filter = `drop-shadow(0 0 16px ${color})`;

    const highlightToken = Date.now();
    w.__mainPolylineHighlightToken = highlightToken;

    scheduleMapActionTimeout(() => {
        const w2 = getMapActionButtonsGlobal();
        if (w2.__mainPolylineHighlightToken === highlightToken) {
            polyElem.style.filter = `drop-shadow(0 0 8px ${color})`;
        }
    }, 250);
}

function getMainPolylineBounds(
    w: MapActionButtonsGlobal,
    polyline: MapPolyline,
    hasValidBounds: boolean
): MapBounds | null | undefined {
    if (hasValidBounds) {
        console.log("[mapActionButtons] Using stored main polyline bounds");
        return w._mainPolylineOriginalBounds;
    }

    if (polyline.getBounds) {
        console.warn("[mapActionButtons] Using polyline getBounds as fallback");
        return polyline.getBounds();
    }

    return null;
}

function logMapCenterAfterFit(w: MapActionButtonsGlobal): void {
    scheduleMapActionTimeout(() => {
        try {
            const center = w._leafletMapInstance?.getCenter?.();
            const zoom = w._leafletMapInstance?.getZoom?.();
            const latitude = center ? String(center.lat) : "unknown";
            const longitude = center ? String(center.lng) : "unknown";
            const zoomText =
                typeof zoom === "number" ? String(zoom) : "unknown";
            console.log(
                `[mapActionButtons] Map centered at ${latitude}, ${longitude}, zoom: ${zoomText}`
            );
        } catch {
            console.warn(
                "[mapActionButtons] Error getting map state after centering (details suppressed)"
            );
        }
    }, 200);
}

function fitMapToMainPolyline(
    w: MapActionButtonsGlobal,
    polyline: MapPolyline,
    hasValidBounds: boolean
): void {
    if (!w._leafletMapInstance) {
        console.warn("[mapActionButtons] Leaflet map instance not available");
        void showNotification("Map not ready for centering", "warning");
        return;
    }

    const bounds = getMainPolylineBounds(w, polyline, hasValidBounds);
    if (bounds?.isValid?.()) {
        console.log("[mapActionButtons] Fitting map to bounds");
        w._leafletMapInstance.fitBounds(bounds, { padding: [20, 20] });
        logMapCenterAfterFit(w);
        return;
    }

    console.warn("[mapActionButtons] No valid bounds found for main polyline");
    void showNotification("Could not determine track bounds", "warning");
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

        const attempts = getCenterMapAttempts(w);
        const mainPolyline = getMainPolyline(w);
        const hasValidBounds = hasValidMainPolylineBounds(w);

        if (!mainPolyline) {
            handleMissingMainPolyline(w, attempts);
            return;
        }

        clearCenterRetryTimer(w);
        w.__centerMainAttempts = 0;
        const statusPending = Boolean(w.__centerStatusNotified);
        w.__centerStatusNotified = 0;

        const polyline = mainPolyline;

        // Bring polyline to front
        polyline.bringToFront?.();

        // Bring associated markers to front
        bringAssociatedMarkersToFront(w, polyline);

        // Add visual highlighting effect
        highlightMainPolyline(w, polyline);

        // Fit map bounds to main polyline only
        fitMapToMainPolyline(w, polyline, hasValidBounds);

        if (statusPending) {
            void showNotification("Centered on main track.", "success");
        }
    } catch (error) {
        console.error(
            "[mapActionButtons] Error centering map on main file:",
            error
        );
        void showNotification("Failed to center map on main file", "error");
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
        );
        if (!activeFileName) {
            console.log(
                "[mapActionButtons] #active_file_name not found in DOM"
            );
            return;
        }

        // Configure element appearance and behavior
        activeFileName.style.cursor = "pointer";
        activeFileName.title = "Center map on main file";
        activeFileName.setAttribute("role", "button");
        activeFileName.setAttribute("tabindex", "0");
        activeFileName.setAttribute("aria-label", "Center map on main file");

        // Remove any previous listeners to avoid stacking
        const activeFileNameElement = activeFileName as ActiveFileNameElement;
        activeFileNameElement.__ffvMapActionCleanup?.();

        function centerMapFromActiveFileName(): void {
            try {
                console.log("[mapActionButtons] Active file name activated");

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
                    "[mapActionButtons] Error in active filename activation:",
                    error
                );
                // Correct argument order: (message, type)
                void showNotification("Failed to center map on file", "error");
            }
        }

        const cleanupCallbacks: Array<() => void> = [
            addEventListenerWithCleanup(
                activeFileName,
                "click",
                centerMapFromActiveFileName
            ),

            addEventListenerWithCleanup(activeFileName, "keydown", (event) => {
                if (
                    event instanceof KeyboardEvent &&
                    (event.key === "Enter" || event.key === " ")
                ) {
                    event.preventDefault();
                    centerMapFromActiveFileName();
                }
            }),

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
            }),

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
            }),
        ];

        activeFileNameElement.__ffvMapActionCleanup = () => {
            for (const cleanup of cleanupCallbacks) {
                cleanup();
            }
            delete activeFileNameElement.__ffvMapActionCleanup;
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
                    () => {
                        initializeActiveFileName();
                    },
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

        w.updateShownFilesList = function updateShownFilesList(
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
export function createMapThemeToggle(): HTMLElement {
    return createMapThemeToggleImplementation();
}
