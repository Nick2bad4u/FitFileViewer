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
import { getThemeColors } from "../../charts/theming/getThemeColors.js";

// Constants for map theme management
const MAP_THEME_STORAGE_KEY = "ffv-map-theme-inverted", // Note: "inverted" now means "dark map theme"
    MAP_THEME_EVENTS = {
        CHANGED: "mapThemeChanged",
    };

/**
 * Gets the current map theme preference
 * @returns {boolean} True if map should use dark theme, false for light theme
 */
export function getMapThemeInverted() {
    try {
        const stored = localStorage.getItem(MAP_THEME_STORAGE_KEY);
        // Default to true (dark map) if no preference is stored
        return stored === null ? true : stored === "true";
    } catch (error) {
        console.error("[createMapThemeToggle] Error reading map theme preference:", error);
        return true; // Default to dark map
    }
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
            detail: { inverted },
            bubbles: true,
        });
        document.dispatchEvent(event);

        console.log(`[createMapThemeToggle] Map theme inversion set to: ${inverted}`);
    } catch (error) {
        console.error("[createMapThemeToggle] Error saving map theme preference:", error);
        showNotification("Failed to save map theme preference", "error");
    }
}

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

        // Create label
        const label = document.createElement("span");
        label.textContent = "Map Theme";

        button.appendChild(iconContainer);
        button.appendChild(label);

        // Update button appearance based on current state
        const updateButtonState = () => {
            try {
                const isInverted = getMapThemeInverted(),
                    isDarkMode = document.body.classList.contains("theme-dark"),
                    // Apply theme colors for button styling
                    themeColors = getThemeColors();
                // Update icon and tooltip based on current map theme state
                if (isInverted) {
                    // Map is inverted/dark - show moon icon
                    iconContainer.innerHTML = `
                        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentcolor" stroke-width="2">
                            <path d="M17 12.5A7.5 7.5 0 1 1 10 2.5a6 6 0 0 0 7 10z" fill="${themeColors.surface}" stroke="${themeColors.primary}" stroke-width="2"/>
                        </svg>
                    `;
                    button.title = "Map: Dark theme (click for light theme)";
                    button.classList.add("active");
                } else {
                    // Map is standard/light - show sun icon
                    iconContainer.innerHTML = `
                        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentcolor" stroke-width="2">
                            <circle cx="10" cy="10" r="5" fill="${themeColors.surface}" stroke="${themeColors.primary}" stroke-width="2"/>
                            <line x1="10" y1="2" x2="10" y2="4" stroke="${themeColors.primary}" stroke-width="2"/>
                            <line x1="10" y1="16" x2="10" y2="18" stroke="${themeColors.primary}" stroke-width="2"/>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="${themeColors.primary}" stroke-width="2"/>
                            <line x1="14.36" y1="14.36" x2="15.78" y2="15.78" stroke="${themeColors.primary}" stroke-width="2"/>
                            <line x1="2" y1="10" x2="4" y2="10" stroke="${themeColors.primary}" stroke-width="2"/>
                            <line x1="16" y1="10" x2="18" y2="10" stroke="${themeColors.primary}" stroke-width="2"/>
                            <line x1="4.22" y1="15.78" x2="5.64" y2="14.36" stroke="${themeColors.primary}" stroke-width="2"/>
                            <line x1="14.36" y1="5.64" x2="15.78" y2="4.22" stroke="${themeColors.primary}" stroke-width="2"/>
                        </svg>
                    `;
                    button.title = "Map: Light theme (click for dark theme)";
                    button.classList.remove("active");
                }

                console.log(
                    `[createMapThemeToggle] Button state updated - UI: ${isDarkMode ? "dark" : "light"}, Map: ${isInverted ? "dark" : "light"}`
                );
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
                if (window.updateMapTheme) {
                    window.updateMapTheme();
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

// Export constants for use by other modules
export { MAP_THEME_STORAGE_KEY, MAP_THEME_EVENTS };
