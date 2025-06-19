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
import { getThemeConfig } from "./theme.js";

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
            if (typeof stored === 'boolean') {
                return stored;
            }
            return stored === 'true' || stored === 'on';
        
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
            case "select":
                control.value = value;
                break;
            
            case "toggle":
                control.checked = Boolean(value);
                break;
            
            case "range": {
                control.value = value;
                // Update value display if it exists
                const valueDisplay = control.parentElement?.querySelector(`#chartjs-${option.id}-value`);
                if (valueDisplay) {
                    valueDisplay.textContent = value;
                }
                // Update range slider visual styling
                updateRangeSliderStyling(control, option, value);
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
        const accentColor = themeConfig.colors.accent;
        const borderLight = themeConfig.colors.borderLight;
        const min = option.min || 0;
        const max = option.max || 1;
        const percentage = ((value - min) / (max - min)) * 100;
        
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
        // Reset all chart option controls to default values
        chartOptionsConfig.forEach((opt) => {
            const control = wrapper.querySelector(`#chartjs-${opt.id}`);
            if (control) {
                updateUIControl(control, opt, opt.default);
            }
        });

        // Reset all field toggles to visible (default state)
        const fieldToggles = wrapper.querySelectorAll('.field-toggle input[type="checkbox"]');
        fieldToggles.forEach((toggle) => {
            toggle.checked = true; // Default to visible
        });

        // Reset all color pickers to default colors
        const colorPickers = wrapper.querySelectorAll('input[type="color"]');
        colorPickers.forEach((picker) => {
            const fieldName = picker.id.replace("field-color-", "").replace("chartjs-", "");
            if (fieldColors[fieldName]) {
                picker.value = fieldColors[fieldName];
            }
        });

        console.log(`${LOG_PREFIX} UI controls reset to defaults`);
    } catch (error) {
        console.error(`${LOG_PREFIX} Error resetting UI controls:`, error);
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
        clearAllStorageItems();

        // Reset UI controls
        const wrapper = document.getElementById("chartjs-settings-wrapper");
        resetUIControlsToDefaults(wrapper);

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
