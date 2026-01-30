/**
 * @file Map theme utility for FitFileViewer
 *
 *   This module handles map theme updates with support for independent map theme
 *   control. Users can toggle between dark and light maps independently from
 *   the application theme.
 *
 * @author FitFileViewer Team
 *
 * @since 1.0.0
 */

import {
    getMapThemeInverted,
    MAP_THEME_EVENTS,
} from "./createMapThemeToggle.js";

/** @type {(() => void) | null} */
let updateMapThemeListener = null;

/** @type {boolean} */
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
export function installUpdateMapThemeListeners() {
    if (mapThemeListenersInstalled) {
        return;
    }

    mapThemeListenersInstalled = true;
    updateMapThemeListener = () => {
        updateMapTheme();
    };

    if (typeof document !== "undefined" && document) {
        // themechange is dispatched on body in some places, but it bubbles and document receives it.
        document.addEventListener("themechange", updateMapThemeListener);
        document.addEventListener(
            MAP_THEME_EVENTS.CHANGED,
            updateMapThemeListener
        );
    }

    /** @type {Window | undefined} */
    const w = globalThis.window;
    if (w !== undefined && w) {
        w.addEventListener("beforeunload", uninstallUpdateMapThemeListeners);
    }
}

/**
 * Remove previously-installed listeners. Useful for cleanup and for test
 * isolation.
 */
export function uninstallUpdateMapThemeListeners() {
    if (!mapThemeListenersInstalled || updateMapThemeListener === null) {
        mapThemeListenersInstalled = false;
        updateMapThemeListener = null;
        return;
    }

    if (typeof document !== "undefined" && document) {
        document.removeEventListener("themechange", updateMapThemeListener);
        document.removeEventListener(
            MAP_THEME_EVENTS.CHANGED,
            updateMapThemeListener
        );
    }

    /** @type {Window | undefined} */
    const w = globalThis.window;
    if (w !== undefined && w) {
        w.removeEventListener("beforeunload", uninstallUpdateMapThemeListeners);
    }

    mapThemeListenersInstalled = false;
    updateMapThemeListener = null;
}

/**
 * Updates the Leaflet map theme based on user's map theme preference. Applies
 * dark theme (inversion filter) when user prefers dark maps, regardless of UI
 * theme.
 */
export function updateMapTheme() {
    try {
        const leafletMap = document.querySelector("#leaflet-map"),
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
            /** @type {HTMLElement} */ (leafletMap).style.filter = "none";

            // Apply to all tile panes within this map container (includes minimap tile panes).
            for (const tilePane of leafletMap.querySelectorAll(
                ".leaflet-tile-pane"
            )) {
                if (tilePane instanceof HTMLElement) {
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
