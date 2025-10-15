/**
 * @fileoverview Map theme toggle button utility for FitFileViewer
 *  * This module provides a toggle button that allows users to control map theme
 * independently from the overall application theme. Users can use dark maps
 * in light mode or light maps in dark mode for better contrast and visibility.
 *
 * Features:
 * - Independent map theme control (dark/light maps in any UI theme)
 * - Persistent preference storage in localStorage
 * - Theme-aware button styling with proper icons
 * - Automatic state synchronization across sessions
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

import { showNotification } from "../../ui/notifications/showNotification.js";
import { getEffectiveTheme } from "../core/theme.js";

// Constants for map theme management
const MAP_THEME_EVENTS = {
    CHANGED: "mapThemeChanged",
},
    MAP_THEME_STORAGE_KEY = "ffv-map-theme-inverted"; // Note: "inverted" now means "dark map theme"

const MAP_THEME_ICON_LIGHT = "mdi:weather-sunny";
const MAP_THEME_ICON_DARK = "mdi:moon-waning-crescent";

/**
 * Creates a map theme toggle button for controlling map inversion
 * @returns {HTMLElement} The configured map theme toggle button
 */
export function createMapThemeToggle() {
    try {
        const button = document.createElement("button");
        button.className = "map-action-btn map-theme-toggle";
        button.title = "Toggle map theme (independent of UI theme)";
        button.setAttribute("aria-label", "Toggle map theme");

        // Create icon container
        const iconContainer = document.createElement("span");
        iconContainer.className = "icon";
        const iconElement = document.createElement("iconify-icon");
        iconElement.setAttribute("width", "18");
        iconElement.setAttribute("height", "18");
        iconElement.setAttribute("aria-hidden", "true");
        iconElement.classList.add("map-theme-toggle-icon");
        iconContainer.append(iconElement);

        // Create label
        const label = document.createElement("span");
        label.textContent = "Map Theme";

        button.append(iconContainer);
        button.append(label);

        // Update button appearance based on current state
        const updateButtonState = () => {
            try {
                const isInverted = getMapThemeInverted();
                // Update icon and tooltip based on current map theme state
                if (isInverted) {
                    iconElement.setAttribute("icon", MAP_THEME_ICON_DARK);
                    button.title = "Map: Dark theme (click for light theme)";
                    button.classList.add("active");
                } else {
                    iconElement.setAttribute("icon", MAP_THEME_ICON_LIGHT);
                    button.title = "Map: Light theme (click for dark theme)";
                    button.classList.remove("active");
                }

                console.log(`[createMapThemeToggle] Button state updated - Map: ${isInverted ? "dark" : "light"}`);
            } catch (error) {
                console.error("[createMapThemeToggle] Error updating button state:", error);
            }
        }; // Handle button click
        button.addEventListener("click", () => {
            try {
                const currentInverted = getMapThemeInverted(),
                    newInverted = !currentInverted;

                setMapThemeInverted(newInverted);
                updateButtonState();

                // Apply the theme change immediately
                if (globalThis.updateMapTheme) {
                    globalThis.updateMapTheme();
                }

                const action = newInverted ? "dark" : "light";
                showNotification(`Map theme set to ${action}`, "success");

                console.log(`[createMapThemeToggle] Map theme toggled to: ${action}`);
            } catch (error) {
                console.error("[createMapThemeToggle] Error in button click:", error);
                showNotification("Failed to toggle map theme", "error");
            }
        });

        // Listen for theme changes
        const handleThemeChange = () => {
            setTimeout(updateButtonState, 50); // Small delay to ensure theme change is complete
        };

        document.body.addEventListener("themechange", handleThemeChange);
        document.addEventListener(MAP_THEME_EVENTS.CHANGED, updateButtonState);

        // Cleanup on page unload
        window.addEventListener("beforeunload", () => {
            document.body.removeEventListener("themechange", handleThemeChange);
            document.removeEventListener(MAP_THEME_EVENTS.CHANGED, updateButtonState);
        });

        // Initial state update
        updateButtonState();

        return button;
    } catch (error) {
        console.error("[createMapThemeToggle] Error creating map theme toggle:", error);
        showNotification("Failed to create map theme toggle", "error");
        return document.createElement("div"); // Return empty div as fallback
    }
}

/**
 * Gets the current map theme preference
 * @returns {boolean} True if map should use dark theme, false for light theme
 */
export function getMapThemeInverted() {
    try {
        const stored = localStorage.getItem(MAP_THEME_STORAGE_KEY);
        if (stored !== null) {
            return stored === "true";
        }
    } catch (error) {
        console.error("[createMapThemeToggle] Error reading map theme preference:", error);
    }

    try {
        const effectiveTheme = getEffectiveTheme();
        return effectiveTheme !== "light";
    } catch (error) {
        console.warn("[createMapThemeToggle] Falling back to dark map theme:", error);
    }

    return true;
}

/**
 * Sets the map theme preference
 * @param {boolean} inverted - Whether map should use dark theme (true) or light theme (false)
 */
export function setMapThemeInverted(inverted) {
    try {
        localStorage.setItem(MAP_THEME_STORAGE_KEY, inverted.toString());

        // Dispatch custom event for other components to listen to
        const event = new CustomEvent(MAP_THEME_EVENTS.CHANGED, {
            bubbles: true,
            detail: { inverted },
        });
        document.dispatchEvent(event);

        console.log(`[createMapThemeToggle] Map theme inversion set to: ${inverted}`);
    } catch (error) {
        console.error("[createMapThemeToggle] Error saving map theme preference:", error);
        showNotification("Failed to save map theme preference", "error");
    }
}

// Export constants for use by other modules
export { MAP_THEME_EVENTS, MAP_THEME_STORAGE_KEY };
