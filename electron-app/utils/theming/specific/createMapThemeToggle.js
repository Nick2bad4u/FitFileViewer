/**
 * @file Map theme toggle button utility for FitFileViewer
 *
 *   - This module provides a toggle button that allows users to control map theme
 *       independently from the overall application theme. Users can use dark
 *       maps in light mode or light maps in dark mode for better contrast and
 *       visibility.
 *
 *   Features:
 *
 *   - Independent map theme control (dark/light maps in every UI theme)
 *   - Persistent preference storage in localStorage
 *   - Theme-aware button styling with proper icons
 *   - Automatic state synchronization across sessions
 *
 * @author FitFileViewer Team
 *
 * @since 1.0.0
 */

import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import {
    getMapThemeSetting,
    setMapThemeSetting,
} from "../../state/domain/settingsStateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

/**
 * @typedef {typeof globalThis & {
 *     __ffvMapThemeToggleListenersInstalled?: boolean;
 *     __ffvMapThemeToggleUpdate?: () => void;
 *     process?: { env?: Record<string, string | undefined> };
 *     updateMapTheme?: () => void;
 * }} MapThemeToggleGlobal
 */

/**
 * @returns {MapThemeToggleGlobal}
 */
function getMapThemeToggleGlobal() {
    return /** @type {MapThemeToggleGlobal} */ (globalThis);
}

/**
 * @param {MapThemeToggleGlobal} appGlobal
 * @returns {boolean}
 */
function isTestEnvironment(appGlobal) {
    return appGlobal.process?.env?.NODE_ENV === "test";
}

// Constants for map theme management
const MAP_THEME_EVENTS = {
    CHANGED: "mapThemeChanged",
};

// Note: "inverted" now means "dark map theme"
const MAP_THEME_STORAGE_KEY = "ffv-map-theme-inverted";

/**
 * Creates a map theme toggle button for controlling map inversion
 *
 * @returns {HTMLElement} The configured map theme toggle button
 */
export function createMapThemeToggle() {
    try {
        const appGlobal = getMapThemeToggleGlobal();

        // Prevent duplicate toggle creation when renderMap is invoked multiple times.
        const existing = document.querySelector(".map-theme-toggle");
        if (existing && existing instanceof HTMLElement) {
            return existing;
        }

        const runningInTest = isTestEnvironment(appGlobal);

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

        button.append(iconContainer);
        button.append(label);

        // Update button appearance based on current state
        const updateButtonState = () => {
            try {
                const isDarkMode =
                        document.body.classList.contains("theme-dark"),
                    isInverted = getMapThemeInverted(),
                    // Apply theme colors for button styling
                    themeColors = getThemeColors();
                /**
                 * @param {"sun" | "moon"} variant
                 *
                 * @returns {SVGElement}
                 */
                const createIcon = (variant) => {
                    const svg = /** @type {SVGElement} */ (
                        document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            "svg"
                        )
                    );
                    svg.setAttribute("viewBox", "0 0 20 20");
                    svg.setAttribute("width", "18");
                    svg.setAttribute("height", "18");
                    svg.setAttribute("fill", "none");
                    svg.setAttribute("stroke", "currentcolor");
                    svg.setAttribute("stroke-width", "2");

                    const stroke = themeColors.primary;
                    const fill = themeColors.surface;

                    if (variant === "moon") {
                        const path = document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            "path"
                        );
                        path.setAttribute(
                            "d",
                            "M17 12.5A7.5 7.5 0 1 1 10 2.5a6 6 0 0 0 7 10z"
                        );
                        path.setAttribute("fill", fill);
                        path.setAttribute("stroke", stroke);
                        path.setAttribute("stroke-width", "2");
                        svg.append(path);
                        return svg;
                    }

                    // Sun icon
                    const circle = document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "circle"
                    );
                    circle.setAttribute("cx", "10");
                    circle.setAttribute("cy", "10");
                    circle.setAttribute("r", "5");
                    circle.setAttribute("fill", fill);
                    circle.setAttribute("stroke", stroke);
                    circle.setAttribute("stroke-width", "2");
                    svg.append(circle);

                    /** @type {[string, string, string, string][]} */
                    const rays = [
                        [
                            "10",
                            "2",
                            "10",
                            "4",
                        ],
                        [
                            "10",
                            "16",
                            "10",
                            "18",
                        ],
                        [
                            "4.22",
                            "4.22",
                            "5.64",
                            "5.64",
                        ],
                        [
                            "14.36",
                            "14.36",
                            "15.78",
                            "15.78",
                        ],
                        [
                            "2",
                            "10",
                            "4",
                            "10",
                        ],
                        [
                            "16",
                            "10",
                            "18",
                            "10",
                        ],
                        [
                            "4.22",
                            "15.78",
                            "5.64",
                            "14.36",
                        ],
                        [
                            "14.36",
                            "5.64",
                            "15.78",
                            "4.22",
                        ],
                    ];
                    for (const [
                        x1,
                        y1,
                        x2,
                        y2,
                    ] of rays) {
                        const line = document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            "line"
                        );
                        line.setAttribute("x1", x1);
                        line.setAttribute("y1", y1);
                        line.setAttribute("x2", x2);
                        line.setAttribute("y2", y2);
                        line.setAttribute("stroke", stroke);
                        line.setAttribute("stroke-width", "2");
                        svg.append(line);
                    }

                    return svg;
                };

                // Update icon and tooltip based on current map theme state
                if (isInverted) {
                    // Map is inverted/dark - show moon icon
                    iconContainer.replaceChildren(createIcon("moon"));
                    button.title = "Map: Dark theme (click for light theme)";
                    button.classList.add("active");
                } else {
                    // Map is standard/light - show sun icon
                    iconContainer.replaceChildren(createIcon("sun"));
                    button.title = "Map: Light theme (click for dark theme)";
                    button.classList.remove("active");
                }

                if (!runningInTest) {
                    console.debug(
                        `[createMapThemeToggle] Button state updated - UI: ${isDarkMode ? "dark" : "light"}, Map: ${isInverted ? "dark" : "light"}`
                    );
                }
            } catch (error) {
                console.error(
                    "[createMapThemeToggle] Error updating button state:",
                    error
                );
            }
        }; // Handle button click
        button.addEventListener("click", () => {
            try {
                const currentInverted = getMapThemeInverted(),
                    newInverted = !currentInverted;

                setMapThemeInverted(newInverted);
                updateButtonState();

                // Apply the theme change immediately
                if (appGlobal.updateMapTheme) {
                    appGlobal.updateMapTheme();
                }

                const action = newInverted ? "dark" : "light";
                showNotification(`Map theme set to ${action}`, "success");

                console.log(
                    `[createMapThemeToggle] Map theme toggled to: ${action}`
                );
            } catch (error) {
                console.error(
                    "[createMapThemeToggle] Error in button click:",
                    error
                );
                showNotification("Failed to toggle map theme", "error");
            }
        });

        // Install global listeners once and register the updater for the currently-mounted toggle.
        // This avoids leaking document/body listeners when the map UI is re-rendered.
        ensureMapThemeToggleGlobalListenersInstalled();
        appGlobal.__ffvMapThemeToggleUpdate = () => {
            // Small delay to ensure theme change is complete (CSS variables/classes applied)
            setTimeout(updateButtonState, 50);
        };

        // Initial state update
        updateButtonState();

        return button;
    } catch (error) {
        console.error(
            "[createMapThemeToggle] Error creating map theme toggle:",
            error
        );
        showNotification("Failed to create map theme toggle", "error");
        return document.createElement("div"); // Return empty div as fallback
    }
}

/**
 * Gets the current map theme preference
 *
 * @returns {boolean} True if map should use dark theme, false for light theme
 */
export function getMapThemeInverted() {
    try {
        // Prefer the canonical settings manager (still backed by localStorage).
        return getMapThemeSetting();
    } catch (error) {
        console.error(
            "[createMapThemeToggle] Error reading map theme preference:",
            error
        );
        return true; // Default to dark map
    }
}

/**
 * Sets the map theme preference
 *
 * @param {boolean} inverted - Whether map should use dark theme (true) or light
 *   theme (false)
 */
export function setMapThemeInverted(inverted) {
    try {
        // Persist via the canonical settings manager.
        setMapThemeSetting(inverted);

        // Dispatch custom event for other components to listen to
        const event = new CustomEvent(MAP_THEME_EVENTS.CHANGED, {
            bubbles: true,
            detail: { inverted },
        });
        document.dispatchEvent(event);

        console.log(
            `[createMapThemeToggle] Map theme inversion set to: ${inverted}`
        );
    } catch (error) {
        console.error(
            "[createMapThemeToggle] Error saving map theme preference:",
            error
        );
        showNotification("Failed to save map theme preference", "error");
    }
}

/**
 * Install global listeners once to avoid leaks when the map UI is re-rendered.
 * The listeners call a global callback reference that is replaced on each
 * toggle creation.
 */
function ensureMapThemeToggleGlobalListenersInstalled() {
    const appGlobal = getMapThemeToggleGlobal();

    if (appGlobal.__ffvMapThemeToggleListenersInstalled === true) {
        return;
    }

    appGlobal.__ffvMapThemeToggleListenersInstalled = true;

    const invoke = () => {
        try {
            const fn = appGlobal.__ffvMapThemeToggleUpdate;
            if (typeof fn === "function") {
                fn();
            }
        } catch {
            /* ignore */
        }
    };

    // Use document-level listeners (themechange is dispatched on body, but document receives bubbled events too).
    if (typeof document !== "undefined" && document) {
        document.addEventListener("themechange", invoke);
        document.addEventListener(MAP_THEME_EVENTS.CHANGED, invoke);
    }
}

// Export constants for use by other modules
export { MAP_THEME_EVENTS, MAP_THEME_STORAGE_KEY };
