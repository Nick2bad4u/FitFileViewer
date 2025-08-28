/**
 * Zone Color Management Utility
 * Handles saving, loading, and applying zone color preferences for HR and Power zones
 */

import { chartColorSchemes } from "../../charts/theming/chartColorSchemes.js";
import { getThemeConfig } from "../../theming/core/theme.js";

/**
 * @typedef {Object} ZoneData
 * @property {number} [zone] - 1-based zone number
 * @property {string} [color] - Hex color code
 * @property {string} [label] - Zone display label
 * @property {number} [time] - Time spent in zone (seconds)
 * @property {number} [value] - Zone value/percentage
 */

/**
 * @typedef {Record<string, any>} ThemeConfig
 */

/**
 * @typedef {Record<string, Record<string, string[]>>} ColorSchemes
 */

/**
 * Gets default zone colors from theme configuration
 * @param {string} zoneType - "hr" or "power"
 * @returns {string[]} Array of color strings
 */
function getDefaultZoneColors(zoneType) {
    const themeConfig = /** @type {ThemeConfig} */ (getThemeConfig());
    if (zoneType === "power") {
        return /** @type {string[]} */ (themeConfig["colors"]?.powerZoneColors || []);
    }
    return /** @type {string[]} */ (themeConfig["colors"]?.heartRateZoneColors || []);
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
    return defaultColors[zoneIndex] || defaultColors[zoneIndex % defaultColors.length] || "#808080";
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
        const defaultColor = defaultColors[i] || defaultColors[i % defaultColors.length] || "#808080";
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
 * @param {ZoneData[]} zoneData - Array of zone data objects
 * @param {string} zoneType - "hr" or "power"
 * @returns {ZoneData[]} Zone data with color property set
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
    const schemes = /** @type {ColorSchemes} */ (chartColorSchemes);
    if (schemes[colorScheme] && schemes[colorScheme][zoneType]) {
        const schemeColors = schemes[colorScheme][zoneType];
        const colors = [];
        for (let i = 0; i < zoneCount; i++) {
            colors.push(schemeColors[i] || schemeColors[i % schemeColors.length] || "#808080");
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
    return chartColorSchemes;
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

    // Set color scheme to custom when resetting zone colors
    localStorage.setItem(`chartjs_${chartField}_color_scheme`, "custom");

    for (let i = 0; i < zoneCount; i++) {
        const defaultColor = defaultColors[i] || defaultColors[i % defaultColors.length] || "#808080";
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
