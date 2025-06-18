/**
 * Zone Color Management Utility
 * Handles saving, loading, and applying zone color preferences for HR and Power zones
 */

import { getThemeConfig } from "./theme.js";

/**
 * Predefined color schemes for zones
 */
const COLOR_SCHEMES = {
    classic: {
        hr: ["#4facfe", "#00b7ff", "#00a6ff", "#0095ff", "#0084ff"],
        power: ["#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#e53935", "#c62828", "#b71c1c"],
    },
    vibrant: {
        hr: ["#ff6b6b", "#ffa726", "#ffee58", "#66bb6a", "#42a5f5"],
        power: ["#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#00bcd4", "#009688", "#4caf50"],
    },
    monochrome: {
        hr: ["#bdbdbd", "#9e9e9e", "#757575", "#616161", "#424242"],
        power: ["#f5f5f5", "#eeeeee", "#e0e0e0", "#bdbdbd", "#9e9e9e", "#757575", "#616161"],
    },
    pastel: {
        hr: ["#a3cef1", "#b6e2d3", "#f6d6ad", "#f7a072", "#eec6e6"],
        power: ["#f9c6c9", "#f7e3af", "#c6e2e9", "#b5ead7", "#e4bad4", "#c7ceea", "#ffdac1"],
    },
    dark: {
        hr: ["#22223b", "#4a4e69", "#9a8c98", "#c9ada7", "#f2e9e4"],
        power: ["#23272e", "#393e46", "#4ecca3", "#eeeeee", "#232931", "#393e46", "#4ecca3"],
    },
    rainbow: {
        hr: ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff"],
        power: ["#9400d3", "#4b0082", "#0000ff", "#00ff00", "#ffff00", "#ff7f00", "#ff0000"],
    },
    ocean: {
        hr: ["#0077b6", "#00b4d8", "#48cae4", "#90e0ef", "#caf0f8"],
        power: ["#03045e", "#0077b6", "#00b4d8", "#48cae4", "#90e0ef", "#caf0f8", "#ade8f4"],
    },
    earth: {
        hr: ["#a0522d", "#cd853f", "#deb887", "#f5deb3", "#fff8dc"],
        power: ["#556b2f", "#6b8e23", "#8fbc8f", "#bdb76b", "#eee8aa", "#f0e68c", "#fafad2"],
    },
    fire: {
        hr: ["#ff6f00", "#ff8f00", "#ffa000", "#ffb300", "#ffc107"],
        power: ["#d84315", "#ff7043", "#ffab91", "#ffd180", "#ffcc80", "#ffb300", "#ff6f00"],
    },
    forest: {
        hr: ["#2e7d32", "#388e3c", "#43a047", "#66bb6a", "#81c784"],
        power: ["#1b5e20", "#388e3c", "#43a047", "#66bb6a", "#81c784", "#a5d6a7", "#c8e6c9"],
    },
    sunset: {
        hr: ["#ffb347", "#ffcc33", "#ff6666", "#ff9966", "#ffb366"],
        power: ["#ff5e62", "#ff9966", "#ffb347", "#ffcc33", "#f7b42c", "#fc575e", "#f7b42c"],
    },
    grayscale: {
        hr: ["#f8f9fa", "#e9ecef", "#dee2e6", "#adb5bd", "#495057"],
        power: ["#212529", "#343a40", "#495057", "#6c757d", "#adb5bd", "#ced4da", "#dee2e6"],
    },
    neon: {
        hr: ["#39ff14", "#faff00", "#00f0ff", "#ff073a", "#ff61f6"],
        power: ["#fe019a", "#fdff00", "#0df9ff", "#08ff08", "#ff073a", "#ff61f6", "#39ff14"],
    },
    autumn: {
        hr: ["#ffb347", "#ff6961", "#fdfd96", "#77dd77", "#aec6cf"],
        power: ["#c23b22", "#ff7f50", "#ffb347", "#fdfd96", "#77dd77", "#aec6cf", "#836953"],
    },
    spring: {
        hr: ["#f6e3b4", "#b4f6c1", "#b4d8f6", "#e3b4f6", "#f6b4d8"],
        power: ["#b4f6c1", "#b4d8f6", "#e3b4f6", "#f6b4d8", "#f6e3b4", "#d8f6b4", "#b4f6e3"],
    },
    // Cycling-specific power color scheme (Coggan's 7 zones)
    cycling: {
        power: [
            "#b3e5fc", // Active Recovery (Z1)
            "#81d4fa", // Endurance (Z2)
            "#4fc3f7", // Tempo (Z3)
            "#0288d1", // Lactate Threshold (Z4)
            "#ffb300", // VO2max (Z5)
            "#e53935", // Anaerobic Capacity (Z6)
            "#8e24aa", // Neuromuscular Power (Z7)
        ],
        hr: ["#b3e5fc", "#81d4fa", "#4fc3f7", "#0288d1", "#ffb300"], // fallback HR colors
    },
    // Runner-specific power color scheme (Stryd 5 zones)
    runner: {
        power: [
            "#b2dfdb", // Easy
            "#4dd0e1", // Moderate
            "#26a69a", // Threshold
            "#ffb74d", // Interval
            "#ef5350", // Repetition/Sprint
        ],
        hr: ["#b2dfdb", "#4dd0e1", "#26a69a", "#ffb74d", "#ef5350"], // fallback HR colors
    },
    // General exercise power color scheme (generic 5 zones)
    exercise: {
        power: [
            "#aed581", // Zone 1 (Very Light)
            "#fff176", // Zone 2 (Light)
            "#ffd54f", // Zone 3 (Moderate)
            "#ffb74d", // Zone 4 (Hard)
            "#e57373", // Zone 5 (Max)
        ],
        hr: ["#aed581", "#fff176", "#ffd54f", "#ffb74d", "#e57373"], // fallback HR colors
    },
    // Add more schemes as needed
};

/**
 * Gets default zone colors from theme configuration
 * @param {string} zoneType - "hr" or "power"
 * @returns {Array} Array of color strings
 */
function getDefaultZoneColors(zoneType) {
    const themeConfig = getThemeConfig();
    if (zoneType === "power") {
        return themeConfig.colors.powerZoneColors;
    }
    return themeConfig.colors.heartRateZoneColors;
}

/**
 * Default zone colors for Heart Rate zones
 */
export const DEFAULT_HR_ZONE_COLORS = getDefaultZoneColors("hr");

/**
 * Default zone colors for Power zones, based on Coggan's levels
 * https://www.trainingpeaks.com/learn/articles/power-training-levels/
 */
export const DEFAULT_POWER_ZONE_COLORS = getDefaultZoneColors("power");

/**
 * Gets the saved color for a specific zone or returns default
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneIndex - 0-based zone index
 * @returns {string} Hex color code
 */
export function getZoneColor(zoneType, zoneIndex) {
    const storageKey = `chartjs_${zoneType}_zone_${zoneIndex + 1}_color`;
    const savedColor = localStorage.getItem(storageKey);

    if (savedColor) {
        return savedColor;
    }

    // Return default color
    const defaultColors = zoneType === "hr" ? DEFAULT_HR_ZONE_COLORS : DEFAULT_POWER_ZONE_COLORS;
    return defaultColors[zoneIndex] || defaultColors[zoneIndex % defaultColors.length];
}

/**
 * Saves a zone color to localStorage
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneIndex - 0-based zone index
 * @param {string} color - Hex color code
 */
export function saveZoneColor(zoneType, zoneIndex, color) {
    const storageKey = `chartjs_${zoneType}_zone_${zoneIndex + 1}_color`;
    localStorage.setItem(storageKey, color);
}

/**
 * Gets an array of colors for all zones of a given type
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @returns {string[]} Array of hex color codes
 */
export function getZoneColors(zoneType, zoneCount) {
    const colors = [];
    for (let i = 0; i < zoneCount; i++) {
        colors.push(getZoneColor(zoneType, i));
    }
    return colors;
}

/**
 * Resets all zone colors to defaults
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones to reset
 */
export function resetZoneColors(zoneType, zoneCount) {
    const defaultColors = zoneType === "hr" ? DEFAULT_HR_ZONE_COLORS : DEFAULT_POWER_ZONE_COLORS;

    for (let i = 0; i < zoneCount; i++) {
        const defaultColor = defaultColors[i] || defaultColors[i % defaultColors.length];
        saveZoneColor(zoneType, i, defaultColor);
    }
}

/**
 * Determines zone type from field name
 * @param {string} field - Field name (e.g., zone chart identifiers)
 * @returns {string|null} "hr", "power", or null if not a zone field
 */
export function getZoneTypeFromField(field) {
    if (field.includes("hr_zone") || field.includes("heart-rate")) {
        return "hr";
    } else if (field.includes("power_zone") || field.includes("power-zone")) {
        return "power";
    }
    return null;
}

/**
 * Applies zone colors to zone data objects
 * @param {Object[]} zoneData - Array of zone data objects
 * @param {string} zoneType - "hr" or "power"
 * @returns {Object[]} Zone data with color property set
 */
export function applyZoneColors(zoneData, zoneType) {
    if (!Array.isArray(zoneData)) {
        return zoneData;
    }

    return zoneData.map((zone, index) => {
        // Use the zone.zone property (1-based) if available, otherwise use array index
        // Convert to 0-based index for color lookup
        const zoneIndex = zone.zone ? zone.zone - 1 : index;

        return {
            ...zone,
            color: getZoneColor(zoneType, zoneIndex),
        };
    });
}

/**
 * Gets zone colors for chart rendering based on color scheme
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @param {string} colorScheme - "classic", "vibrant", "monochrome", or "custom"
 * @returns {string[]} Array of colors for chart use
 */
export function getChartZoneColors(zoneType, zoneCount, colorScheme = "custom") {
    if (colorScheme === "custom") {
        // Use custom colors from localStorage or defaults
        return getZoneColors(zoneType, zoneCount);
    }

    // Use predefined color scheme
    if (COLOR_SCHEMES[colorScheme] && COLOR_SCHEMES[colorScheme][zoneType]) {
        const schemeColors = COLOR_SCHEMES[colorScheme][zoneType];
        const colors = [];
        for (let i = 0; i < zoneCount; i++) {
            colors.push(schemeColors[i] || schemeColors[i % schemeColors.length]);
        }
        return colors;
    }

    // Fallback to custom colors
    return getZoneColors(zoneType, zoneCount);
}

/**
 * Gets colors for display in the color picker UI based on the selected scheme
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @param {string} colorScheme - "classic", "vibrant", "monochrome", or "custom"
 * @returns {string[]} Array of colors for UI display
 */
export function getDisplayZoneColors(zoneType, zoneCount, colorScheme = "custom") {
    return getChartZoneColors(zoneType, zoneCount, colorScheme);
}

/**
 * Gets all predefined color schemes
 * @returns {Object} Object containing all color schemes
 */
export function getColorSchemes() {
    return COLOR_SCHEMES;
}

/**
 * Gets the saved color for a specific zone and chart type or returns default
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut", "power_lap_zone_stacked")
 * @param {number} zoneIndex - 0-based zone index
 * @returns {string} Hex color code
 */
export function getChartSpecificZoneColor(chartField, zoneIndex) {
    const storageKey = `chartjs_${chartField}_zone_${zoneIndex + 1}_color`;
    const savedColor = localStorage.getItem(storageKey);

    if (savedColor) {
        return savedColor;
    }

    // Fallback to generic zone color if chart-specific color doesn't exist
    const zoneType = chartField.includes("hr") ? "hr" : "power";
    return getZoneColor(zoneType, zoneIndex);
}

/**
 * Saves a zone color for a specific chart type to localStorage
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut", "power_lap_zone_stacked")
 * @param {number} zoneIndex - 0-based zone index
 * @param {string} color - Hex color code
 */
export function saveChartSpecificZoneColor(chartField, zoneIndex, color) {
    const storageKey = `chartjs_${chartField}_zone_${zoneIndex + 1}_color`;
    localStorage.setItem(storageKey, color);
}

/**
 * Gets an array of colors for all zones of a specific chart type
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut", "power_lap_zone_stacked")
 * @param {number} zoneCount - Number of zones
 * @returns {string[]} Array of hex color codes
 */
export function getChartSpecificZoneColors(chartField, zoneCount) {
    const colors = [];
    for (let i = 0; i < zoneCount; i++) {
        colors.push(getChartSpecificZoneColor(chartField, i));
    }
    return colors;
}

/**
 * Resets all zone colors for a specific chart type to defaults
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut", "power_lap_zone_stacked")
 * @param {number} zoneCount - Number of zones to reset
 */
export function resetChartSpecificZoneColors(chartField, zoneCount) {
    const zoneType = chartField.includes("hr") ? "hr" : "power";
    const defaultColors = zoneType === "hr" ? DEFAULT_HR_ZONE_COLORS : DEFAULT_POWER_ZONE_COLORS;

    for (let i = 0; i < zoneCount; i++) {
        const defaultColor = defaultColors[i] || defaultColors[i % defaultColors.length];
        saveChartSpecificZoneColor(chartField, i, defaultColor);
    }
}

/**
 * Checks if a chart field has custom colors set
 * @param {string} chartField - Full chart field name
 * @param {number} zoneCount - Number of zones
 * @returns {boolean} True if any custom colors are set
 */
export function hasChartSpecificColors(chartField, zoneCount) {
    for (let i = 0; i < zoneCount; i++) {
        const storageKey = `chartjs_${chartField}_zone_${i + 1}_color`;
        if (localStorage.getItem(storageKey)) {
            return true;
        }
    }
    return false;
}
