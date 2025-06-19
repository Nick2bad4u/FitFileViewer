/**
 * @fileoverview Chart settings management utility for FitFileViewer
 *
 * Provides functions for getting, setting, and resetting chart configuration
 * settings. Handles localStorage persistence and UI synchronization for
 * chart options including toggles, selects, ranges, and color settings.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

import { fieldColors, formatChartFields } from "./formatChartFields.js";
import { chartOptionsConfig } from "./chartOptionsConfig.js";
import { renderChartJS } from "./renderChartJS.js";
import { showNotification } from "./showNotification.js";
import { updateAllChartStatusIndicators } from "./chartStatusIndicator.js";
import { getThemeConfig } from "./theme.js";
import { setState } from "./stateManager.js";

// Storage key prefixes
const STORAGE_PREFIXES = {
    CHART_OPTION: "chartjs_",
    FIELD_COLOR: "chartjs_color_",
    FIELD_VISIBILITY: "chartjs_field_",
    HR_ZONE_COLOR: "chartjs_hr_zone_",
    POWER_ZONE_COLOR: "chartjs_power_zone_",
};

// Special field types for zone charts
const ZONE_CHART_FIELDS = [
    "gps_track",
    "speed_vs_distance",
    "power_vs_hr",
    "altitude_profile",
    "hr_zone_doughnut",
    "power_zone_doughnut",
    "hr_lap_zone_stacked",
    "hr_lap_zone_individual",
    "power_lap_zone_stacked",
    "power_lap_zone_individual",
];

const UNIT_TYPES = ["timeUnits", "distanceUnits", "temperatureUnits"];
const MAX_ZONE_COUNT = 5;

const LOG_PREFIX = "[ChartSettings]";

/**
 * Parses stored value based on option type
 * @param {string|null} stored - Stored value from localStorage
 * @param {Object} option - Chart option configuration
 * @returns {*} Parsed value with correct type
 */
function parseStoredValue(stored, option) {
    if (stored === null) {
        return option.default;
    }

    switch (option.type) {
        case "range":
            return parseFloat(stored);

        case "toggle":
            // Handle both boolean and string representations
            if (typeof stored === "boolean") {
                return stored;
            }
            return stored === "true" || stored === "on";

        case "select":
            if (option.id === "maxpoints") {
                return stored === "all" ? "all" : parseInt(stored, 10);
            }
            return stored;

        default:
            return stored;
    }
}

/**
 * Updates UI control to match setting value
 * @param {Element} control - DOM control element
 * @param {Object} option - Chart option configuration
 * @param {*} value - Value to set
 */
function updateUIControl(control, option, value) {
    if (!control) return;

    try {
        switch (option.type) {
            case "select": {
                // Find the actual select element - could be the control itself or a child
                let select = control;
                if (control.tagName !== "SELECT") {
                    select =
                        control.querySelector("select") || document.querySelector(`#chartjs-${option.id}-dropdown`);
                }

                if (select && select.tagName === "SELECT") {
                    select.value = value;
                    console.log(`${LOG_PREFIX} Updated select ${option.id} to: ${value}`);
                }
                break;
            }

            case "toggle":
                // Handle both regular checkbox toggles and custom toggle controls
                if (control.type === "checkbox") {
                    control.checked = Boolean(value);
                } else if (typeof control._updateFromReset === "function") {
                    // For custom toggle controls, use their update method
                    control._updateFromReset();
                } else {
                    // Try to find the parent container with the update method
                    const parent = control.closest("[data-option-id]") || control.parentElement;
                    if (parent && typeof parent._updateFromReset === "function") {
                        parent._updateFromReset();
                    }
                }
                break;

            case "range": {
                // Find the actual slider element - could be the control itself or a child
                let slider = control;
                if (control.type !== "range") {
                    slider =
                        control.querySelector("input[type='range']") ||
                        document.querySelector(`#chartjs-${option.id}-slider`);
                }

                if (slider && slider.type === "range") {
                    slider.value = value;

                    // Update value display - look for the span in the container
                    const valueDisplay = slider.parentElement?.querySelector("span");
                    if (valueDisplay && valueDisplay.style.position === "absolute") {
                        valueDisplay.textContent = value;
                    }

                    // Update range slider visual styling
                    updateRangeSliderStyling(slider, option, value);
                    console.log(`${LOG_PREFIX} Updated range ${option.id} to: ${value}`);
                }
                break;
            }
        }
    } catch (error) {
        console.warn(`${LOG_PREFIX} Error updating UI control for ${option.id}:`, error);
    }
}

/**
 * Updates range slider visual styling
 * @param {Element} control - Range input element
 * @param {Object} option - Chart option configuration
 * @param {number} value - Current value
 */
function updateRangeSliderStyling(control, option, value) {
    try {
        const themeConfig = getThemeConfig();
        const accentColor = themeConfig?.colors?.accent || "var(--color-accent, #3b82f6)";
        const borderLight = themeConfig?.colors?.borderLight || "var(--color-border, #e5e7eb)";
        const min = option.min || 0;
        const max = option.max || 1;
        const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

        control.style.background = `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${percentage}%, ${borderLight} ${percentage}%, ${borderLight} 100%)`;
    } catch (error) {
        console.warn(`${LOG_PREFIX} Error updating range slider styling:`, error);
    }
}

/**
 * Clears all chart-related localStorage items
 */
function clearAllStorageItems() {
    try {
        // Clear chart option settings
        chartOptionsConfig.forEach((opt) => {
            localStorage.removeItem(`${STORAGE_PREFIXES.CHART_OPTION}${opt.id}`);
        });

        // Clear field visibility and color settings
        formatChartFields.forEach((field) => {
            localStorage.removeItem(`${STORAGE_PREFIXES.FIELD_COLOR}${field}`);
            localStorage.removeItem(`${STORAGE_PREFIXES.FIELD_VISIBILITY}${field}`);
        });

        // Clear zone chart field settings
        ZONE_CHART_FIELDS.forEach((field) => {
            localStorage.removeItem(`${STORAGE_PREFIXES.FIELD_VISIBILITY}${field}`);
        });

        // Clear zone color settings
        for (let i = 1; i <= MAX_ZONE_COUNT; i++) {
            localStorage.removeItem(`${STORAGE_PREFIXES.HR_ZONE_COLOR}${i}_color`);
            localStorage.removeItem(`${STORAGE_PREFIXES.POWER_ZONE_COLOR}${i}_color`);
        }

        // Clear unit settings
        UNIT_TYPES.forEach((unit) => {
            localStorage.removeItem(`${STORAGE_PREFIXES.CHART_OPTION}${unit}`);
        });

        console.log(`${LOG_PREFIX} All storage items cleared`);
    } catch (error) {
        console.error(`${LOG_PREFIX} Error clearing storage items:`, error);
    }
}

/**
 * Resets all UI controls to default values
 * @param {Element} wrapper - Settings wrapper element
 */
function resetUIControlsToDefaults(wrapper) {
    if (!wrapper) {
        console.warn(`${LOG_PREFIX} Settings wrapper not found`);
        return;
    }

    try {
        console.log(`${LOG_PREFIX} Resetting ${chartOptionsConfig.length} chart option controls`);

        // Reset all chart option controls to default values
        chartOptionsConfig.forEach((opt) => {
            // Try multiple ways to find the control
            let control =
                wrapper.querySelector(`#chartjs-${opt.id}`) ||
                wrapper.querySelector(`#chartjs-${opt.id}-dropdown`) ||
                wrapper.querySelector(`#chartjs-${opt.id}-slider`) ||
                wrapper.querySelector(`#chartjs-${opt.id}-container`) ||
                wrapper.querySelector(`[data-option-id="${opt.id}"]`);

            if (control) {
                updateUIControl(control, opt, opt.default);
                console.log(`${LOG_PREFIX} Reset control ${opt.id} to default: ${opt.default}`);
            } else {
                // Try to find by searching all elements that might contain the option
                const allControls = wrapper.querySelectorAll('select, input[type="range"], .toggle-switch');
                allControls.forEach((element) => {
                    if (element.id && element.id.includes(opt.id)) {
                        updateUIControl(element, opt, opt.default);
                        console.log(`${LOG_PREFIX} Reset control ${opt.id} via fallback search to: ${opt.default}`);
                    }
                });
            }

            // Handle custom toggle controls with _updateFromReset method
            if (opt.type === "toggle") {
                const toggleContainer =
                    wrapper.querySelector(`#chartjs-${opt.id}`) ||
                    wrapper.querySelector(`[data-option-id="${opt.id}"]`);
                if (toggleContainer && typeof toggleContainer._updateFromReset === "function") {
                    toggleContainer._updateFromReset();
                } else {
                    // Find toggle container by checking for toggle-switch elements
                    const toggleSwitches = wrapper.querySelectorAll(".toggle-switch");
                    toggleSwitches.forEach((toggleSwitch) => {
                        const parent = toggleSwitch.parentElement;
                        if (parent && typeof parent._updateFromReset === "function") {
                            // Check if this toggle is for our option by looking at surrounding context
                            const settingRow = parent.closest(".setting-row");
                            if (settingRow) {
                                const label = settingRow.querySelector(".setting-label");
                                if (label && label.textContent.toLowerCase().includes(opt.label.toLowerCase())) {
                                    parent._updateFromReset();
                                    console.log(`${LOG_PREFIX} Updated toggle ${opt.id} via context matching`);
                                }
                            }
                        }
                    });
                }
            }
        });

        // Reset all field toggles to visible (default state)
        const fieldToggles = wrapper.querySelectorAll('.field-toggle input[type="checkbox"]');
        fieldToggles.forEach((toggle) => {
            toggle.checked = true; // Default to visible
        });
        if (fieldToggles.length > 0) {
            console.log(`${LOG_PREFIX} Reset ${fieldToggles.length} field toggles to visible`);
        }

        // Reset all color pickers to default colors
        const colorPickers = wrapper.querySelectorAll('input[type="color"]');
        colorPickers.forEach((picker) => {
            const fieldName = picker.id.replace("field-color-", "").replace("chartjs-", "");
            if (fieldColors[fieldName]) {
                picker.value = fieldColors[fieldName];
            }
        });
        if (colorPickers.length > 0) {
            console.log(`${LOG_PREFIX} Reset ${colorPickers.length} color pickers to defaults`);
        }

        // Find and update any custom controls with _updateFromReset method
        updateCustomControlsFromReset(wrapper);

        // Perform direct control updates as additional fallback
        performDirectControlUpdates();

        console.log(`${LOG_PREFIX} UI controls reset to defaults completed`);
    } catch (error) {
        console.error(`${LOG_PREFIX} Error resetting UI controls:`, error);
    }
}

/**
 * Updates custom controls that have _updateFromReset methods
 * @param {Element} wrapper - Settings wrapper element
 */
function updateCustomControlsFromReset(wrapper) {
    try {
        // Find all elements with _updateFromReset method and call them
        const allElements = wrapper.querySelectorAll("*");
        let updatedCount = 0;

        allElements.forEach((element) => {
            if (typeof element._updateFromReset === "function") {
                element._updateFromReset();
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            console.log(`${LOG_PREFIX} Updated ${updatedCount} custom controls from reset`);
        }
    } catch (error) {
        console.error(`${LOG_PREFIX} Error updating custom controls from reset:`, error);
    }
}

/**
 * Performs direct control updates by specific selectors as fallback
 */
function performDirectControlUpdates() {
    try {
        let updatedCount = 0;

        // Direct updates for known control types
        chartOptionsConfig.forEach((opt) => {
            let updated = false;

            switch (opt.type) {
                case "select": {
                    const select = document.querySelector(`#chartjs-${opt.id}-dropdown`);
                    if (select && select.tagName === "SELECT") {
                        select.value = opt.default;
                        updated = true;
                    }
                    break;
                }

                case "range": {
                    const slider = document.querySelector(`#chartjs-${opt.id}-slider`);
                    if (slider && slider.type === "range") {
                        slider.value = opt.default;

                        // Update value display
                        const valueDisplay = slider.parentElement?.querySelector("span");
                        if (valueDisplay && valueDisplay.style.position === "absolute") {
                            valueDisplay.textContent = opt.default;
                        }

                        // Update visual styling
                        updateRangeSliderStyling(slider, opt, opt.default);
                        updated = true;
                    }
                    break;
                }

                case "toggle": {
                    // Custom toggles are handled by _updateFromReset method
                    const containers = document.querySelectorAll(".toggle-switch");
                    containers.forEach((toggle) => {
                        const parent = toggle.parentElement;
                        if (parent && typeof parent._updateFromReset === "function") {
                            parent._updateFromReset();
                            updated = true;
                        }
                    });
                    break;
                }
            }

            if (updated) {
                updatedCount++;
                console.log(`${LOG_PREFIX} Direct update: ${opt.id} = ${opt.default}`);
            }
        });

        console.log(`${LOG_PREFIX} Performed ${updatedCount} direct control updates`);
    } catch (error) {
        console.error(`${LOG_PREFIX} Error in direct control updates:`, error);
    }
}

/**
 * Re-renders charts after settings reset
 */
function reRenderChartsAfterReset() {
    try {
        // Check if chart data is available
        if (!window.globalData || !window.globalData.recordMesgs) {
            console.log(`${LOG_PREFIX} No chart data available for re-rendering`);
            return;
        }

        console.log(`${LOG_PREFIX} Re-rendering charts after settings reset`);

        // Get the charts container
        const chartsContainer = document.getElementById("chart-container");

        // Clear existing chart instances
        if (window._chartjsInstances && Array.isArray(window._chartjsInstances)) {
            window._chartjsInstances.forEach((chart) => {
                if (chart && typeof chart.destroy === "function") {
                    chart.destroy();
                }
            });
            window._chartjsInstances = [];
        }

        // Force a complete re-render
        if (chartsContainer) {
            renderChartJS(chartsContainer);
        } else {
            // Fallback: try to render without container
            renderChartJS();
        }
    } catch (error) {
        console.error(`${LOG_PREFIX} Error re-rendering charts:`, error);
    }
}

/**
 * Re-renders charts after a setting change
 * @param {string} settingName - Name of the setting that changed
 * @param {*} newValue - New value of the setting
 */
export function reRenderChartsAfterSettingChange(settingName, newValue) {
    try {
        // Check if chart data is available
        if (!window.globalData || !window.globalData.recordMesgs) {
            console.log(`${LOG_PREFIX} No chart data available for re-rendering after ${settingName} change`);
            return;
        }

        console.log(`${LOG_PREFIX} Re-rendering charts after ${settingName} changed to ${newValue}`);

        // CRITICAL: Clear cached settings from state management
        // This ensures the chart rendering will read fresh settings from localStorage
        if (typeof setState === "function") {
            setState("settings.charts", null, { source: "reRenderChartsAfterSettingChange" });
            console.log(`${LOG_PREFIX} Cleared cached chart settings from state`);
        }

        // Clear existing chart instances first
        if (window._chartjsInstances && Array.isArray(window._chartjsInstances)) {
            console.log(`${LOG_PREFIX} Destroying ${window._chartjsInstances.length} existing chart instances`);
            window._chartjsInstances.forEach((chart, index) => {
                if (chart && typeof chart.destroy === "function") {
                    try {
                        chart.destroy();
                        console.log(`${LOG_PREFIX} Destroyed chart instance ${index}`);
                    } catch (err) {
                        console.warn(`${LOG_PREFIX} Error destroying chart ${index}:`, err);
                    }
                }
            });
            window._chartjsInstances = [];
        }

        // Also clear any existing chart canvases to ensure clean slate
        const existingCanvases = document.querySelectorAll('canvas[id^="chart-"], canvas[id^="chartjs-canvas-"]');
        console.log(`${LOG_PREFIX} Removing ${existingCanvases.length} existing chart canvases`);
        existingCanvases.forEach((canvas) => {
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        });

        // Force a complete re-render - try multiple container approaches
        let container = document.getElementById("content-chart");
        if (!container) {
            container = document.getElementById("chartjs-chart-container");
        }
        if (!container) {
            container = document.getElementById("chart-container");
        }

        console.log(`${LOG_PREFIX} Using container: ${container ? container.id : "none found"}`); // Force re-render
        if (container) {
            renderChartJS(container);
        } else {
            // Fallback: try to render without container
            console.log(`${LOG_PREFIX} No container found, attempting fallback render`);
            renderChartJS();
        }

        console.log(`${LOG_PREFIX} Chart re-render completed for ${settingName} change`);
    } catch (error) {
        console.error(`${LOG_PREFIX} Error re-rendering charts after ${settingName} change:`, error);
        if (typeof showNotification === "function") {
            showNotification(`Failed to update chart setting: ${error.message}`, "error");
        }
    }
}

/**
 * Gets default settings object based on chart configuration
 *
 * Creates a settings object with all default values from the chart
 * options configuration and default field colors.
 *
 * @returns {Object} Default settings object
 */
export function getDefaultSettings() {
    try {
        const settings = {};

        // Get default values from chart options config
        chartOptionsConfig.forEach((opt) => {
            settings[opt.id] = opt.default;
        });

        // Add default field colors
        settings.colors = { ...fieldColors };

        return settings;
    } catch (error) {
        console.error(`${LOG_PREFIX} Error getting default settings:`, error);
        return {};
    }
}

/**
 * Gets current settings from localStorage and DOM
 *
 * Retrieves all chart settings from localStorage with fallbacks to
 * default values. Handles type conversion and validation for different
 * setting types (select, toggle, range, colors).
 *
 * @returns {Object} Current settings object
 */
export function getCurrentSettings() {
    try {
        const themeConfig = getThemeConfig();
        const settings = {};

        // Get chart option settings
        chartOptionsConfig.forEach((opt) => {
            const stored = localStorage.getItem(`${STORAGE_PREFIXES.CHART_OPTION}${opt.id}`);
            settings[opt.id] = parseStoredValue(stored, opt);
        });

        // Get color settings
        settings.colors = {};
        formatChartFields.forEach((field) => {
            const stored = localStorage.getItem(`${STORAGE_PREFIXES.FIELD_COLOR}${field}`);
            settings.colors[field] = stored || fieldColors[field] || themeConfig.colors.primaryAlpha;
        });

        return settings;
    } catch (error) {
        console.error(`${LOG_PREFIX} Error getting current settings:`, error);
        return getDefaultSettings();
    }
}

/**
 * Resets all chart settings to their default values
 *
 * Clears all chart-related settings from localStorage, resets UI controls
 * to default values, and re-renders charts with the default configuration.
 * Shows a success notification when complete.
 *
 * @returns {boolean} True if reset was successful, false otherwise
 */
export function resetAllSettings() {
    try {
        console.log(`${LOG_PREFIX} Resetting all settings to defaults`);

        // Clear all stored settings
        clearAllStorageItems(); // Reset UI controls with a small delay to ensure DOM is ready
        setTimeout(() => {
            const wrapper = document.getElementById("chartjs-settings-wrapper");
            resetUIControlsToDefaults(wrapper);

            // Second pass for any controls that might not have been found initially
            setTimeout(() => {
                console.log(`${LOG_PREFIX} Performing second pass UI control updates`);
                performDirectControlUpdates();
            }, 100);

            // Update chart status indicators after UI reset
            setTimeout(() => {
                updateAllChartStatusIndicators();
            }, 150);
        }, 50);

        // Re-render charts with default settings
        reRenderChartsAfterReset();

        // Show success notification
        showNotification("Settings reset to defaults", "success");

        console.log(`${LOG_PREFIX} Settings reset completed successfully`);
        return true;
    } catch (error) {
        console.error(`${LOG_PREFIX} Error resetting settings:`, error);
        showNotification("Failed to reset settings", "error");
        return false;
    }
}
