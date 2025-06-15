import { fieldColors, chartFields } from "./chartFields.js";
import { chartOptionsConfig } from "./chartOptionsConfig.js";
import { renderChartJS } from "./renderChartJS.js";
import { showNotification } from "./showNotification.js";
import { getThemeConfig } from "./theme.js";

/**
 * Gets default settings object
 */

export function getDefaultSettings() {
    const settings = {};
    chartOptionsConfig.forEach((opt) => {
        settings[opt.id] = opt.default;
    });
    settings.colors = { ...fieldColors };
    return settings;
}
/**
 * Gets current settings from localStorage and DOM
 */

export function getCurrentSettings() {
    const themeConfig = getThemeConfig();
    const settings = {};
    chartOptionsConfig.forEach((opt) => {
        const stored = localStorage.getItem(`chartjs_${opt.id}`);
        if (opt.type === "range") {
            settings[opt.id] = stored !== null ? parseFloat(stored) : opt.default;
        } else if (opt.id === "maxpoints") {
            settings[opt.id] = stored !== null ? (stored === "all" ? "all" : parseInt(stored, 10)) : opt.default;
        } else {
            settings[opt.id] = stored !== null ? stored : opt.default;
        }
    });

    // Get color settings
    settings.colors = {};
    chartFields.forEach((field) => {
        const stored = localStorage.getItem(`chartjs_color_${field}`);
        settings.colors[field] = stored || fieldColors[field] || themeConfig.colors.primaryAlpha;
    });

    return settings;
}
/**
 * Resets all settings to defaults
 */

export function resetAllSettings() {
    // Clear all chart settings from localStorage
    chartOptionsConfig.forEach((opt) => {
        localStorage.removeItem(`chartjs_${opt.id}`);
    });

    // Clear field visibility and color settings
    chartFields.forEach((field) => {
        localStorage.removeItem(`chartjs_color_${field}`);
        localStorage.removeItem(`chartjs_field_${field}`);
    });

    // Clear additional field settings for analysis charts
    [
        "gps_track",
        "speed_vs_distance",
        "power_vs_hr",
        "altitude_profile",
        "hr_zone_doughnut",
        "hr_zone_bar",
        "power_zone_doughnut",
        "power_zone_bar",
    ].forEach((field) => {
        localStorage.removeItem(`chartjs_field_${field}`);
    });

    // Clear zone color settings
    for (let i = 1; i <= 5; i++) {
        localStorage.removeItem(`chartjs_hr_zone_${i}_color`);
        localStorage.removeItem(`chartjs_power_zone_${i}_color`);
    }

    // Clear unit settings
    ["timeUnits", "distanceUnits", "temperatureUnits"].forEach((unit) => {
        localStorage.removeItem(`chartjs_${unit}`);
    });

    // Refresh the settings panel UI
    const wrapper = document.getElementById("chartjs-settings-wrapper");
    if (wrapper) {
        // Reset all dropdowns and controls to default values
        chartOptionsConfig.forEach((opt) => {
            const control = wrapper.querySelector(`#chartjs-${opt.id}`);
            if (control) {
                if (opt.type === "select") {
                    control.value = opt.default;
                } else if (opt.type === "toggle") {
                    control.checked = opt.default === "on";
                } else if (opt.type === "range") {
                    control.value = opt.default;
                    const valueDisplay = wrapper.querySelector(`#chartjs-${opt.id}-value`);
                    if (valueDisplay) {
                        valueDisplay.textContent = opt.default;
                    }
                    // Update range slider background with theme-aware colors
                    const themeConfig = getThemeConfig();
                    const accentColor = themeConfig.colors.accent;
                    const borderLight = themeConfig.colors.borderLight;
                    const percentage = ((opt.default - (opt.min || 0)) / ((opt.max || 1) - (opt.min || 0))) * 100;
                    control.style.background = `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${percentage}%, ${borderLight} ${percentage}%, ${borderLight} 100%)`;
                }
            }
        });

        // Reset all field toggles to visible
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
    }

    // Re-render charts if data is available
    if (window.globalData && window.globalData.recordMesgs) {
        console.log("[ChartJS] Re-rendering charts after settings reset");
        // Get the charts container
        const chartsContainer = document.getElementById("chart-container");
        if (chartsContainer) {
            // Clear existing charts first
            if (window._chartjsInstances) {
                window._chartjsInstances.forEach((chart) => {
                    if (chart && typeof chart.destroy === "function") {
                        chart.destroy();
                    }
                });
                window._chartjsInstances = [];
            }

            // Force a complete re-render
            renderChartJS(chartsContainer);
        } else {
            // Fallback: try to render without container
            renderChartJS();
        }
    }

    showNotification("Settings reset to defaults", "success");
}
