/**
 * Map theme toggle button utility.
 *
 * Allows users to control map theme independently from the overall application
 * theme while keeping the preference synchronized across map re-renders.
 */

import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import {
    getMapThemeSetting,
    setMapThemeSetting,
} from "../../state/domain/settingsStateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

type MapThemeToggleGlobal = typeof globalThis & {
    __ffvMapThemeToggleListenersController?: AbortController;
    __ffvMapThemeToggleListenersInstalled?: boolean;
    __ffvMapThemeToggleUpdate?: () => void;
    updateMapTheme?: () => void;
};

type MapThemeIconVariant = "moon" | "sun";
type SvgRayCoordinates = readonly [string, string, string, string];

function getMapThemeToggleGlobal(): MapThemeToggleGlobal {
    return globalThis as MapThemeToggleGlobal;
}

function isTestEnvironment(): boolean {
    return process.env["NODE_ENV"] === "test";
}

function getThemeColorValue(value: unknown, fallback: string): string {
    return typeof value === "string" && value.length > 0 ? value : fallback;
}

/**
 * Custom map theme event names emitted by the map theme toggle.
 */
export const MAP_THEME_EVENTS = {
    CHANGED: "mapThemeChanged",
} as const;

/**
 * Local storage key used for the map theme preference.
 *
 * Note: "inverted" now means "dark map theme".
 */
export const MAP_THEME_STORAGE_KEY = "ffv-map-theme-inverted";

const mapThemeToggleUpdateTimers = new Set<ReturnType<typeof setTimeout>>();

function scheduleMapThemeToggleUpdate(callback: () => void): void {
    const timeout = setTimeout(() => {
        mapThemeToggleUpdateTimers.delete(timeout);
        callback();
    }, 50);

    mapThemeToggleUpdateTimers.add(timeout);
}

/**
 * Creates a map theme toggle button for controlling map inversion.
 *
 * @returns The configured map theme toggle button.
 */
export function createMapThemeToggle(): HTMLElement {
    try {
        const appGlobal = getMapThemeToggleGlobal();

        // Prevent duplicate toggle creation when renderMap is invoked multiple times.
        const existing = document.querySelector(".map-theme-toggle");
        if (existing && existing instanceof HTMLElement) {
            return existing;
        }

        const runningInTest = isTestEnvironment();

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
        const updateButtonState = (): void => {
            try {
                const isDarkMode =
                    document.body.classList.contains("theme-dark");
                const isInverted = getMapThemeInverted();
                const themeColors = getThemeColors();
                const createIcon = (
                    variant: MapThemeIconVariant
                ): SVGElement => {
                    const svg = document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "svg"
                    );
                    svg.setAttribute("viewBox", "0 0 20 20");
                    svg.setAttribute("width", "18");
                    svg.setAttribute("height", "18");
                    svg.setAttribute("fill", "none");
                    svg.setAttribute("stroke", "currentcolor");
                    svg.setAttribute("stroke-width", "2");

                    const stroke = getThemeColorValue(
                        themeColors["primary"],
                        "#3b82f6"
                    );
                    const fill = getThemeColorValue(
                        themeColors["surface"],
                        "transparent"
                    );

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

                    const rays: readonly SvgRayCoordinates[] = [
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
        };

        // Handle button click
        const listenerController = new AbortController();
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
        }, { signal: listenerController.signal });

        // Install global listeners once and register the updater for the currently-mounted toggle.
        // This avoids leaking document/body listeners when the map UI is re-rendered.
        ensureMapThemeToggleGlobalListenersInstalled();
        appGlobal.__ffvMapThemeToggleUpdate = () => {
            // Small delay to ensure theme change is complete (CSS variables/classes applied)
            scheduleMapThemeToggleUpdate(updateButtonState);
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
 * Gets the current map theme preference.
 *
 * @returns True if map should use dark theme, false for light theme.
 */
export function getMapThemeInverted(): boolean {
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
 * Sets the map theme preference.
 *
 * @param inverted - Whether map should use dark theme.
 */
export function setMapThemeInverted(inverted: boolean): void {
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
function ensureMapThemeToggleGlobalListenersInstalled(): void {
    const appGlobal = getMapThemeToggleGlobal();

    if (appGlobal.__ffvMapThemeToggleListenersInstalled === true) {
        return;
    }

    appGlobal.__ffvMapThemeToggleListenersInstalled = true;

    const listenerController = new AbortController();
    appGlobal.__ffvMapThemeToggleListenersController = listenerController;

    const invoke = (): void => {
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
        document.addEventListener("themechange", invoke, {
            signal: listenerController.signal,
        });
        document.addEventListener(MAP_THEME_EVENTS.CHANGED, invoke, {
            signal: listenerController.signal,
        });
    }
}
