/**
 * @fileoverview Map theme utility for FitFileViewer
 *
 * This module handles map theme updates with support for independent map theme control.
 * Users can toggle between dark and light maps independently from the application theme.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

import { getMapThemeInverted } from "./createMapThemeToggle.js";

/**
 * Updates the Leaflet map theme based on user's map theme preference
 * Applies dark theme (inversion filter) when user prefers dark maps, regardless of UI theme
 */
export function updateMapTheme() {
    try {
        const mapShouldBeDark = getMapThemeInverted();
        const leafletMap = document.getElementById("leaflet-map");

        if (leafletMap) {
            // Apply dark theme filter if user prefers dark maps
            leafletMap.style.filter = mapShouldBeDark
                ? "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)"
                : "none";

            console.log(`[updateMapTheme] Map theme updated - Map dark: ${mapShouldBeDark}`);
        }
    } catch (error) {
        console.error("[updateMapTheme] Error updating map theme:", error);
    }
}

// Set up theme change listeners if not already done
if (!window._mapThemeListener) {
    window._mapThemeListener = () => {
        updateMapTheme();
    };

    // Listen for both app theme changes and map theme preference changes
    document.body.addEventListener("themechange", window._mapThemeListener);
    document.addEventListener("mapThemeChanged", window._mapThemeListener);

    // Cleanup logic to remove the event listeners
    window.addEventListener("beforeunload", () => {
        document.body.removeEventListener("themechange", window._mapThemeListener);
        document.removeEventListener("mapThemeChanged", window._mapThemeListener);
        delete window._mapThemeListener;
    });
}
