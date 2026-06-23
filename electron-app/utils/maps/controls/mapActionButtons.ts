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

import { registerShownFilesListAfterUpdate } from "../../rendering/components/shownFilesListUpdater.js";
import { createMapThemeToggle as createMapThemeToggleImplementation } from "../../theming/specific/createMapThemeToggle.js";
import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { addEventListenerWithCleanup } from "../../ui/events/eventListenerManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { resolveLeafletRuntime } from "../core/leafletRuntime.js";
import { setHighlightedOverlayIndex } from "../layers/mapDrawLaps.js";
import { getRegisteredLeafletMapInstance } from "../state/mapLeafletInstanceState.js";
import {
    getMainMapPolyline,
    getMainMapPolylineOriginalBounds,
    getOverlayMapPolyline,
} from "../state/mapPolylineRegistryState.js";
import {
    getMapActionButtonsRuntime,
    type MapActionButtonTimer,
} from "./mapActionButtonsRuntime.js";

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

type LeafletMapInstance = {
    fitBounds: (
        bounds: MapBounds,
        options: { padding: [number, number] }
    ) => void;
    getCenter?: () => { lat: number; lng: number };
    getZoom?: () => number;
};

type CircleMarkerConstructor = abstract new (...args: never[]) => object;
type MapActionLeafletRuntime = {
    CircleMarker?: CircleMarkerConstructor;
};

const activeTimers = new Set<MapActionButtonTimer>();
const activeFileNameCleanupCallbacks = new WeakMap<HTMLElement, () => void>();
const trackedActiveFileNameElements = new Set<HTMLElement>();
const CENTER_MAIN_MAX_ATTEMPTS = 8;
const MAIN_POLYLINE_HIGHLIGHT_COLOR = "#1976d2";
let centerMainAttempts = 0;
let centerRetryHandle: MapActionButtonTimer | null = null;
let centerStatusNotified = 0;
let mainPolylineHighlightToken = 0;

function isMapLayer(value: unknown): value is MapLayer {
    return typeof value === "object" && value !== null;
}

function isMapActionLeafletRuntime(
    value: unknown
): value is MapActionLeafletRuntime {
    return (
        typeof value === "object" && value !== null && "CircleMarker" in value
    );
}

function scheduleMapActionTimeout(callback: () => void, delayMs: number): void {
    const runtime = getMapActionButtonsRuntime();
    const handle = runtime.setTimeout(() => {
        activeTimers.delete(handle);
        callback();
    }, delayMs);
    activeTimers.add(handle);
}

function clearCenterRetryTimer(): void {
    if (centerRetryHandle) {
        getMapActionButtonsRuntime().clearTimeout(centerRetryHandle);
    }
    centerRetryHandle = null;
}

function scheduleCenterMapRetry(): void {
    clearCenterRetryTimer();
    centerRetryHandle = getMapActionButtonsRuntime().setTimeout(() => {
        centerRetryHandle = null;
        _centerMapOnMainFile();
    }, 150);
}

function getCenterMapAttempts(): number {
    return centerMainAttempts;
}

function getMainPolyline(): MapPolyline | null {
    return (
        getMainMapPolyline<MapPolyline>() ??
        getOverlayMapPolyline<MapPolyline>(0) ??
        null
    );
}

function hasValidMainPolylineBounds(): boolean {
    const bounds = getMainMapPolylineOriginalBounds<MapBounds>();
    return Boolean(bounds?.isValid && bounds.isValid());
}

function resetCenterMapState(): void {
    clearCenterRetryTimer();
    centerMainAttempts = 0;
    centerStatusNotified = 0;
}

function clearActiveMapActionTimers(): void {
    const runtime = getMapActionButtonsRuntime();
    for (const timer of activeTimers) {
        runtime.clearTimeout(timer);
    }
    activeTimers.clear();
}

function cleanupActiveFileNameMapActions(activeFileName: HTMLElement): void {
    const existingCleanup = activeFileNameCleanupCallbacks.get(activeFileName);
    if (!existingCleanup) {
        return;
    }

    existingCleanup();
    activeFileNameCleanupCallbacks.delete(activeFileName);
    trackedActiveFileNameElements.delete(activeFileName);
}

export function resetMapActionButtonStateForTests(): void {
    for (const activeFileName of trackedActiveFileNameElements) {
        cleanupActiveFileNameMapActions(activeFileName);
    }
    trackedActiveFileNameElements.clear();
    clearActiveMapActionTimers();
    resetCenterMapState();
    mainPolylineHighlightToken = 0;
}

function handleMissingMainPolyline(attempts: number): void {
    if (attempts === 0) {
        centerStatusNotified = Date.now();
        void showNotification("Centering map on main track...", "info");
    }

    const mapInstance = getRegisteredLeafletMapInstance<LeafletMapInstance>();
    if (mapInstance && attempts < CENTER_MAIN_MAX_ATTEMPTS) {
        centerMainAttempts = attempts + 1;
        scheduleCenterMapRetry();
        return;
    }

    resetCenterMapState();

    const noMap = !mapInstance;
    const logFn = noMap ? console.info : console.warn;
    const message = noMap
        ? "Map not ready for centering"
        : "No main track to center on";
    logFn(`[mapActionButtons] ${message}`);
    void showNotification(message, "warning");
}

function bringAssociatedMarkersToFront(polyline: MapPolyline): void {
    const circleMarker = resolveLeafletRuntime(
        isMapActionLeafletRuntime
    )?.CircleMarker;
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

function highlightMainPolyline(polyline: MapPolyline): void {
    const polyElem = polyline.getElement?.();
    if (!polyElem) {
        return;
    }

    const color = polyline.options?.color ?? MAIN_POLYLINE_HIGHLIGHT_COLOR;
    polyElem.style.transition = "filter 0.2s";
    polyElem.style.filter = `drop-shadow(0 0 16px ${color})`;

    const highlightToken = Date.now();
    mainPolylineHighlightToken = highlightToken;

    scheduleMapActionTimeout(() => {
        if (mainPolylineHighlightToken === highlightToken) {
            polyElem.style.filter = `drop-shadow(0 0 8px ${color})`;
        }
    }, 250);
}

function getMainPolylineBounds(
    polyline: MapPolyline,
    hasValidBounds: boolean
): MapBounds | null | undefined {
    if (hasValidBounds) {
        console.log("[mapActionButtons] Using stored main polyline bounds");
        return getMainMapPolylineOriginalBounds<MapBounds>();
    }

    if (polyline.getBounds) {
        console.warn("[mapActionButtons] Using polyline getBounds as fallback");
        return polyline.getBounds();
    }

    return null;
}

function logMapCenterAfterFit(mapInstance: LeafletMapInstance): void {
    scheduleMapActionTimeout(() => {
        try {
            const center = mapInstance.getCenter?.();
            const zoom = mapInstance.getZoom?.();
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
    polyline: MapPolyline,
    hasValidBounds: boolean
): void {
    const mapInstance = getRegisteredLeafletMapInstance<LeafletMapInstance>();
    if (!mapInstance) {
        console.warn("[mapActionButtons] Leaflet map instance not available");
        void showNotification("Map not ready for centering", "warning");
        return;
    }

    const bounds = getMainPolylineBounds(polyline, hasValidBounds);
    if (bounds?.isValid?.() === true) {
        console.log("[mapActionButtons] Fitting map to bounds");
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
        logMapCenterAfterFit(mapInstance);
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
        const attempts = getCenterMapAttempts();
        const mainPolyline = getMainPolyline();
        const hasValidBounds = hasValidMainPolylineBounds();

        if (!mainPolyline) {
            handleMissingMainPolyline(attempts);
            return;
        }

        clearCenterRetryTimer();
        centerMainAttempts = 0;
        const statusPending = Boolean(centerStatusNotified);
        centerStatusNotified = 0;

        const polyline = mainPolyline;

        // Bring polyline to front
        polyline.bringToFront?.();

        // Bring associated markers to front
        bringAssociatedMarkersToFront(polyline);

        // Add visual highlighting effect
        highlightMainPolyline(polyline);

        // Fit map bounds to main polyline only
        fitMapToMainPolyline(polyline, hasValidBounds);

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
export function setupActiveFileNameMapActions(): void {
    try {
        const runtime = getMapActionButtonsRuntime();
        const runtimeDocument = runtime.getDocument();
        const activeFileName = querySelectorByIdFlexible(
            runtimeDocument,
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
        activeFileName.setAttribute("role", "button");
        activeFileName.setAttribute("tabindex", "0");
        activeFileName.setAttribute("aria-label", "Center map on main file");

        // Remove any previous listeners to avoid stacking
        cleanupActiveFileNameMapActions(activeFileName);

        function centerMapFromActiveFileName(): void {
            try {
                console.log("[mapActionButtons] Active file name activated");

                // Always switch to map tab (even if already active, to ensure map is visible)
                const mapTabBtn = querySelectorByIdFlexible(
                    runtimeDocument,
                    "#tab_map"
                );
                if (runtime.isHTMLElement(mapTabBtn)) {
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
                    setHighlightedOverlayIndex(0);
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
                    setHighlightedOverlayIndex(null);
                } catch (error) {
                    console.error(
                        "[mapActionButtons] Error in mouseleave:",
                        error
                    );
                }
            }),
        ];

        activeFileNameCleanupCallbacks.set(activeFileName, () => {
            for (const cleanup of cleanupCallbacks) {
                cleanup();
            }
            activeFileNameCleanupCallbacks.delete(activeFileName);
            trackedActiveFileNameElements.delete(activeFileName);
        });
        trackedActiveFileNameElements.add(activeFileName);
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
        const runtime = getMapActionButtonsRuntime();
        const runtimeDocument = runtime.getDocument();
        const targetElement = querySelectorByIdFlexible(
                runtimeDocument,
                "#active_file_name"
            ),
            parent = targetElement?.parentNode;

        if (!parent) {
            console.log(
                "[mapActionButtons] Active filename parent not found for observer"
            );
            // Try again after DOM loads
            if (runtimeDocument.readyState === "loading") {
                addEventListenerWithCleanup(
                    runtimeDocument,
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

registerShownFilesListAfterUpdate(() => {
    console.log(
        "[mapActionButtons] Files list updated, reapplying active filename setup"
    );
    setupActiveFileNameMapActions();
});

/**
 * Creates the map theme toggle control used by the map toolbar.
 */
export function createMapThemeToggle(): HTMLElement {
    return createMapThemeToggleImplementation();
}
