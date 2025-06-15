/**
 * Zone Color Management Utility
 * Handles saving, loading, and applying zone color preferences for HR and Power zones
 */

import { getThemeConfig } from "./theme.js";

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
 * @param {string} field - Field name (e.g., "hr_zone_doughnut", "power_zone_bar")
 * @returns {string|null} "hr", "power", or null if not a zone field
 */
export function getZoneTypeFromField(field) {
    if (field.includes("hr_zone")) {
        return "hr";
    } else if (field.includes("power_zone")) {
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
 * Gets zone colors for chart rendering
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @returns {string[]} Array of colors for chart use
 */
export function getChartZoneColors(zoneType, zoneCount) {
    return getZoneColors(zoneType, zoneCount);
}
