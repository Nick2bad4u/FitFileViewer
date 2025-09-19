/**
 * Chart theme listener utility
 * Handles real-time theme updates for charts and settings UI.
 * This file uses JSDoc types so TypeScript (checkJs) can understand shapes.
 */

import { chartStateManager } from "../core/chartStateManager.js";

/**
 * @typedef {CustomEvent & { detail: { theme?: string } }} ThemeChangeEvent
 */

/**
 * Global theme listener reference for cleanup
 * Widen parameter type to EventListener signature; we'll narrow inside.
 * @type {((e: Event) => void) | null}
 */
let chartThemeListener = null;

/**
 * Force update all chart theme elements
 * @param {HTMLElement} chartsContainer - The container holding all charts
 * @param {HTMLElement} settingsContainer - The settings panel container
 */
export function forceUpdateChartTheme(chartsContainer, settingsContainer) {
    console.log("[ChartThemeListener] Force updating chart theme");

    // Re-render charts through modern state management
    if (chartsContainer && globalThis.globalData) {
        if (chartStateManager) {
            chartStateManager.handleThemeChange();
        } else if (globalThis.ChartUpdater) {
            globalThis.ChartUpdater.updateAll("Force theme update");
        } else if (globalThis.chartUpdater) {
            globalThis.chartUpdater.updateAll("Force theme update");
        } else {
            console.warn("[ChartThemeListener] No chart update mechanism available for force update");
        }
    }

    // Update settings panel
    if (settingsContainer) {
        updateSettingsPanelTheme(settingsContainer);
    }
}

/**
 * Remove theme change listener
 */
export function removeChartThemeListener() {
    if (chartThemeListener) {
        document.body.removeEventListener("themechange", chartThemeListener);
        chartThemeListener = null;
        console.log("[ChartThemeListener] Theme listener removed");
    }
}

/**
 * Set up theme change listener for charts
 * @param {HTMLElement} chartsContainer - The container holding all charts
 * @param {HTMLElement} settingsContainer - The settings panel container
 */
export function setupChartThemeListener(chartsContainer, settingsContainer) {
    // Clean up existing listener
    if (chartThemeListener) {
        document.body.removeEventListener("themechange", chartThemeListener);
    }
    // Create new listener
    chartThemeListener = onChartThemeChangeFactory(chartsContainer, settingsContainer);

    // Add the listener
    document.body.addEventListener("themechange", chartThemeListener);

    console.log("[ChartThemeListener] Theme listener set up for charts and settings");
}

/**
 * Factory producing a debounced theme change handler.
 * @param {HTMLElement | null} chartsContainer
 * @param {HTMLElement | null} settingsContainer
 * @returns {(e: Event) => void}
 */
function onChartThemeChangeFactory(chartsContainer, settingsContainer) {
    /** @type {(((e: Event) => void) & { timeout?: ReturnType<typeof setTimeout> })} */
    const handler = function (event) {
        const custom = /** @type {ThemeChangeEvent | null} */ (event instanceof CustomEvent ? event : null),
            theme = custom?.detail && typeof custom.detail === "object" ? custom.detail.theme : undefined;
        console.log("[ChartThemeListener] Theme changed to:", theme);

        // Debounce rapid theme changes
        if (handler.timeout) {
            clearTimeout(handler.timeout);
        }

        handler.timeout = setTimeout(() => {
            // Re-render all charts with new theme using modern state management
            if (chartsContainer && globalThis.globalData) {
                console.log("[ChartThemeListener] Re-rendering charts for theme change");

                // Use the modern chart state manager for theme changes
                if (chartStateManager) {
                    chartStateManager.handleThemeChange();
                } else if (globalThis.ChartUpdater) {
                    globalThis.ChartUpdater.updateAll("Theme change");
                } else if (globalThis.chartUpdater) {
                    globalThis.chartUpdater.updateAll("Theme change");
                } else {
                    console.warn("[ChartThemeListener] No chart update mechanism available");
                }
            }

            // Update settings panel theme colors in real-time
            if (settingsContainer) {
                updateSettingsPanelTheme(settingsContainer);
            }
        }, 150); // Slightly longer delay to ensure CSS variables are updated
    };
    return handler;
}

/**
 * Updates the theme colors of the settings panel UI elements in real-time.
 * Applies theme-based styles to range sliders, toggle switches, and status text
 * to ensure consistency with the current application theme.
 *
 * @param {HTMLElement} settingsContainer - The settings panel container element whose child elements will be updated.
 */
function updateSettingsPanelTheme(settingsContainer) {
    try {
        // Update range sliders
        const sliders = settingsContainer.querySelectorAll('input[type="range"]');
        for (const sliderEl of sliders) {
            const slider = /** @type {HTMLInputElement} */ (sliderEl);
            if (!(slider instanceof HTMLInputElement)) {
                continue;
            }
            const current = Number(slider.value || 0),
                max = Number(slider.max || 100),
                min = Number(slider.min || 0),
                percentage = max === min ? 0 : ((current - min) / (max - min)) * 100;
            slider.style.background = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, var(--color-border) ${percentage}%, var(--color-border) 100%)`;
        }

        // Update toggle switches
        const toggles = settingsContainer.querySelectorAll(".toggle-switch");
        for (const toggleEl of toggles) {
            const toggle = /** @type {HTMLElement} */ (toggleEl),
                thumb = toggle.querySelector(".toggle-thumb");
            toggle.style.background =
                thumb instanceof HTMLElement && thumb.style.left === "26px"
                    ? "var(--color-success)"
                    : "var(--color-border)";
        }

        // Update status text colors
        const statusTexts = settingsContainer.querySelectorAll(".toggle-switch + span");
        for (const statusEl of statusTexts) {
            const statusText = /** @type {HTMLElement} */ (statusEl);
            statusText.style.color = statusText.textContent === "On" ? "var(--color-success)" : "var(--color-fg)";
        }

        console.log("[ChartThemeListener] Settings panel theme updated");
    } catch (error) {
        console.error("[ChartThemeListener] Error updating settings panel theme:", error);
    }
}
