/**
 * Chart theme listener utility
 * Handles real-time theme updates for charts and settings UI
 */

import { renderChartJS } from "./renderChartJS.js";

/**
 * Global theme listener reference for cleanup
 */
let chartThemeListener = null;

/**
 * Theme change event handler for charts and settings
 * @param {Event} event
 * @param {HTMLElement} chartsContainer
 * @param {HTMLElement} settingsContainer
 */
function onChartThemeChangeFactory(chartsContainer, settingsContainer) {
    // Return the actual event handler function
    const handler = function (event) {
        console.log("[ChartThemeListener] Theme changed to:", event.detail.theme);

        // Debounce rapid theme changes
        if (handler.timeout) {
            clearTimeout(handler.timeout);
        }

        handler.timeout = setTimeout(function () {
            // Re-render all charts with new theme
            if (chartsContainer && window.globalData) {
                console.log("[ChartThemeListener] Re-rendering charts for theme change");

                // Destroy existing charts properly
                if (window._chartjsInstances && window._chartjsInstances.length > 0) {
                    window._chartjsInstances.forEach((chart) => {
                        if (chart && typeof chart.destroy === "function") {
                            try {
                                chart.destroy();
                            } catch (error) {
                                console.warn("[ChartThemeListener] Error destroying chart:", error);
                            }
                        }
                    });
                    window._chartjsInstances = [];
                }

                // Force re-render with new theme
                renderChartJS(chartsContainer);
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
        sliders.forEach((slider) => {
            const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
            slider.style.background = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, var(--color-border) ${percentage}%, var(--color-border) 100%)`;
        });

        // Update toggle switches
        const toggles = settingsContainer.querySelectorAll(".toggle-switch");
        toggles.forEach((toggle) => {
            const thumb = toggle.querySelector(".toggle-thumb");
            if (thumb && thumb.style.left === "26px") {
                // Toggle is "on" - update to success color
                toggle.style.background = "var(--color-success)";
            } else {
                // Toggle is "off" - update to border color
                toggle.style.background = "var(--color-border)";
            }
        });

        // Update status text colors
        const statusTexts = settingsContainer.querySelectorAll(".toggle-switch + span");
        statusTexts.forEach((statusText) => {
            if (statusText.textContent === "On") {
                statusText.style.color = "var(--color-success)";
            } else {
                statusText.style.color = "var(--color-fg)";
            }
        });

        console.log("[ChartThemeListener] Settings panel theme updated");
    } catch (error) {
        console.error("[ChartThemeListener] Error updating settings panel theme:", error);
    }
}

/**
 * Force update all chart theme elements
 * @param {HTMLElement} chartsContainer - The container holding all charts
 * @param {HTMLElement} settingsContainer - The settings panel container
 */
export function forceUpdateChartTheme(chartsContainer, settingsContainer) {
    console.log("[ChartThemeListener] Force updating chart theme");

    // Re-render charts
    if (chartsContainer && window.globalData) {
        renderChartJS(chartsContainer);
    }

    // Update settings panel
    if (settingsContainer) {
        updateSettingsPanelTheme(settingsContainer);
    }
}
