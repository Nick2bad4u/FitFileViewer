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
        const leafletMap = document.querySelector("#leaflet-map"),
            mapShouldBeDark = getMapThemeInverted();

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
if (!globalThis._mapThemeListener) {
    globalThis._mapThemeListener = () => {
        updateMapTheme();
    };

    // Listen for both app theme changes and map theme preference changes
    // Guard for environments where document/body isn't available yet (tests/early imports).
    if (typeof document !== "undefined" && document && document.body) {
        document.body.addEventListener("themechange", globalThis._mapThemeListener);
        document.addEventListener("mapThemeChanged", globalThis._mapThemeListener);

        // Cleanup logic to remove the event listeners
        window.addEventListener("beforeunload", () => {
            document.body.removeEventListener("themechange", globalThis._mapThemeListener);
            document.removeEventListener("mapThemeChanged", globalThis._mapThemeListener);
            delete globalThis._mapThemeListener;
        });
    } else {
        // If we can't attach listeners, don't retain the global sentinel.
        delete globalThis._mapThemeListener;
    }
}
