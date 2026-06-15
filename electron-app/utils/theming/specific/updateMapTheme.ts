/**
 * Map theme utility for FitFileViewer.
 *
 * This module handles map theme updates with support for independent map theme
 * control. Users can toggle between dark and light maps independently from the
 * application theme.
 */

import { getMapThemeInverted } from "./createMapThemeToggle.js";
import { MAP_THEME_EVENTS } from "./mapThemeToggleState.js";
import { getUpdateMapThemeRuntime } from "./updateMapThemeRuntime.js";

let updateMapThemeListener: (() => void) | null = null;

let updateMapThemeAbortController: AbortController | null = null;

let mapThemeListenersInstalled = false;

/**
 * Install document-level listeners that keep the map tiles in sync when:
 *
 * - The UI theme changes (themechange)
 * - The map theme preference changes (MAP_THEME_EVENTS.CHANGED)
 *
 * This is intentionally NOT executed at module import time to avoid
 * side-effects when the module is imported in tests or non-map contexts.
 */
export function installUpdateMapThemeListeners(): void {
    if (mapThemeListenersInstalled) {
        return;
    }

    mapThemeListenersInstalled = true;
    const runtime = getUpdateMapThemeRuntime();
    updateMapThemeAbortController = runtime.createAbortController();
    updateMapThemeListener = () => {
        updateMapTheme();
    };
    const listenerOptions = {
        signal: updateMapThemeAbortController.signal,
    };

    // themechange is dispatched on body in some places, but it bubbles and document receives it.
    runtime.addDocumentListener(
        "themechange",
        updateMapThemeListener,
        listenerOptions
    );
    runtime.addDocumentListener(
        MAP_THEME_EVENTS.CHANGED,
        updateMapThemeListener,
        listenerOptions
    );
    runtime.addWindowBeforeUnloadListener(
        uninstallUpdateMapThemeListeners,
        listenerOptions
    );
}

/**
 * Remove previously-installed listeners. Useful for cleanup and for test
 * isolation.
 */
export function uninstallUpdateMapThemeListeners(): void {
    if (!mapThemeListenersInstalled || updateMapThemeListener === null) {
        updateMapThemeAbortController?.abort();
        updateMapThemeAbortController = null;
        mapThemeListenersInstalled = false;
        updateMapThemeListener = null;
        return;
    }

    updateMapThemeAbortController?.abort();

    mapThemeListenersInstalled = false;
    updateMapThemeListener = null;
    updateMapThemeAbortController = null;
}

/**
 * Updates the Leaflet map theme based on user's map theme preference. Applies
 * dark theme (inversion filter) when user prefers dark maps, regardless of UI
 * theme.
 */
export function updateMapTheme(): void {
    try {
        const runtime = getUpdateMapThemeRuntime(),
            leafletMap = runtime.queryLeafletMap(),
            mapShouldBeDark = getMapThemeInverted();

        if (leafletMap) {
            // Expose the current map theme state to CSS (used for selectively inverting
            // scale/attribution/minimap UI elements without filtering the whole map container).
            leafletMap.classList.toggle("ffv-map-inverted", mapShouldBeDark);

            // IMPORTANT:
            // Previously we applied an inversion filter to the entire map container (#leaflet-map).
            // That also inverts Leaflet controls (layers selector), custom controls (lap selector),
            // and all tooltips/popups, which makes the UI unreadable and breaks theme styling.
            //
            // Correct behavior: apply the filter ONLY to the basemap tiles.
            // Leaflet tiles render inside `.leaflet-tile-pane`.
            const filter = mapShouldBeDark
                ? "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)"
                : "none";

            // Ensure we never accidentally filter the full container.
            if (runtime.isHTMLElement(leafletMap)) {
                leafletMap.style.filter = "none";
            }

            // Apply to all tile panes within this map container (includes minimap tile panes).
            for (const tilePane of leafletMap.querySelectorAll(
                ".leaflet-tile-pane"
            )) {
                if (runtime.isHTMLElement(tilePane)) {
                    tilePane.style.filter = filter;
                }
            }

            console.log(
                `[updateMapTheme] Map theme updated - Map dark: ${mapShouldBeDark}`
            );
        }
    } catch (error) {
        console.error("[updateMapTheme] Error updating map theme:", error);
    }
}
