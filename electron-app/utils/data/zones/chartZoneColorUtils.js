/**
 * Zone Color Management Utility Handles saving, loading, and applying zone
 * color preferences for HR and Power zones
 */

import { chartColorSchemes } from "../../charts/theming/chartColorSchemes.js";
import {
    getChartSetting,
    removeChartSetting,
    setChartSetting,
} from "../../state/domain/settingsStateManager.js";
import { getThemeConfig } from "../../theming/core/theme.js";

/**
 * @typedef {Object} ZoneData
 *
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

const FALLBACK_HR_ZONE_COLORS = [
    "#808080",
    "#3b82f665",
    "#10B981",
    "#F59E0B",
    "#FF6600",
    "#EF4444",
    "#FF00FF",
    "#00FFFF",
    "#FF1493",
    "#FF4500",
    "#FFD700",
    "#32CD32",
    "#8A2BE2",
    "#000000",
];
const FALLBACK_POWER_ZONE_COLORS = [
    "#808080",
    "#3b82f665",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#FF6600",
    "#FF00FF",
    "#00FFFF",
    "#FF1493",
    "#FF4500",
    "#FFD700",
    "#32CD32",
    "#8A2BE2",
    "#000000",
];

const zoneColorCache = new Map();
const chartSpecificZoneColorCache = new Map();
const COLOR_SCHEME_SUFFIX = "_color_scheme";

const getChartColorSchemeKey = (chartField) =>
    `${chartField}${COLOR_SCHEME_SUFFIX}`;
const getChartSpecificZoneColorKey = (chartField, zoneIndex) =>
    `${chartField}_zone_${zoneIndex + 1}_color`;
const getZoneColorKey = (zoneType, zoneIndex) =>
    `${zoneType}_zone_${zoneIndex + 1}_color`;

/**
 * Clear the chart color scheme for a field.
 *
 * @param {string} chartField
 *
 * @returns {boolean}
 */
export function clearChartColorScheme(chartField) {
    return removeChartSetting(getChartColorSchemeKey(chartField));
}

/**
 * Get the stored chart color scheme for a field.
 *
 * @param {string} chartField
 *
 * @returns {string}
 */
export function getChartColorScheme(chartField) {
    const stored = getChartSetting(getChartColorSchemeKey(chartField));
    return typeof stored === "string" && stored.trim() ? stored : "custom";
}

/**
 * Read a chart-specific zone color from storage without applying fallbacks.
 *
 * @param {string} chartField
 * @param {number} zoneIndex
 *
 * @returns {string | null}
 */
export function getStoredChartSpecificZoneColor(chartField, zoneIndex) {
    const storageKey = getChartSpecificZoneColorKey(chartField, zoneIndex);
    const savedColor = getChartSetting(storageKey);
    const normalized = normalizeStoredColor(savedColor);

    if (normalized) {
        return normalized;
    }

    if (savedColor) {
        try {
            removeChartSetting(storageKey);
        } catch {
            /* ignore */
        }
    }

    return null;
}

/**
 * Read a generic zone color from storage without applying fallbacks.
 *
 * @param {string} zoneType
 * @param {number} zoneIndex
 *
 * @returns {string | null}
 */
export function getStoredZoneColor(zoneType, zoneIndex) {
    const storageKey = getZoneColorKey(zoneType, zoneIndex);
    const savedColor = getChartSetting(storageKey);
    const normalized = normalizeStoredColor(savedColor);

    if (normalized) {
        return normalized;
    }

    if (savedColor) {
        try {
            removeChartSetting(storageKey);
        } catch {
            /* ignore */
        }
    }

    return null;
}

/**
 * Persist the chart color scheme for a field.
 *
 * @param {string} chartField
 * @param {string} scheme
 *
 * @returns {string}
 */
export function setChartColorScheme(chartField, scheme) {
    const normalized =
        typeof scheme === "string" && scheme.trim() ? scheme.trim() : "custom";
    setChartSetting(getChartColorSchemeKey(chartField), normalized);
    return normalized;
}

/**
 * Conservative CSS color-token validation.
 *
 * These values can be persisted in localStorage and later interpolated into
 * CSS. We explicitly reject characters/patterns that could break out of a
 * property value (e.g., semicolons) or trigger remote resource loads.
 *
 * @param {unknown} value
 *
 * @returns {value is string}
 */
function isSafeCssColorToken(value) {
    if (typeof value !== "string") return false;
    const v = value.trim();
    if (v.length === 0 || v.length > 64) return false;
    // Prevent injection into cssText or style attribute.
    if (/[;{}\n\r]/u.test(v)) return false;
    if (/url\(/iu.test(v)) return false;

    // Accept common safe formats.
    if (/^#[\da-f]{3,4}$/iu.test(v)) return true; // #RGB / #RGBA
    if (/^#[\da-f]{6}([\da-f]{2})?$/iu.test(v)) return true; // #RRGGBB / #RRGGBBAA
    if (
        /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(\s*,\s*(0|1|0?\.\d+))?\s*\)$/iu.test(
            v
        )
    )
        return true;

    return false;
}

/**
 * @param {unknown} value
 *
 * @returns {string | null}
 */
function normalizeStoredColor(value) {
    return isSafeCssColorToken(value) ? value.trim() : null;
}

export const clearCachedChartZoneColor = (chartField, zoneIndex) => {
    chartSpecificZoneColorCache.delete(`${chartField}:${zoneIndex}`);
};

export const clearCachedZoneColor = (zoneType, zoneIndex) => {
    zoneColorCache.delete(`${zoneType}:${zoneIndex}`);
};

export const clearCachedZoneColors = (field, zoneCount) => {
    for (let i = 0; i < zoneCount; i++) {
        chartSpecificZoneColorCache.delete(`${field}:${i}`);
    }
    const zoneType = getZoneTypeFromField(field);
    if (zoneType) {
        for (let i = 0; i < zoneCount; i++) {
            zoneColorCache.delete(`${zoneType}:${i}`);
        }
    }
};

/**
 * Gets default zone colors from theme configuration
 *
 * @param {string} zoneType - "hr" or "power"
 *
 * @returns {string[]} Array of color strings
 */
function getDefaultZoneColors(zoneType) {
    let themeConfig;
    try {
        themeConfig = /** @type {ThemeConfig | undefined} */ (getThemeConfig());
    } catch (error) {
        console.warn(
            "[ZoneColors] Failed to load theme config, using fallbacks",
            error
        );
    }
    const colors =
        (themeConfig && typeof themeConfig === "object"
            ? themeConfig.colors
            : undefined) || {};
    if (zoneType === "power") {
        const powerColors = Array.isArray(colors.powerZoneColors)
            ? colors.powerZoneColors
            : null;
        return /** @type {string[]} */ (
            powerColors && powerColors.length
                ? powerColors
                : FALLBACK_POWER_ZONE_COLORS
        );
    }
    const hrColors = Array.isArray(colors.heartRateZoneColors)
        ? colors.heartRateZoneColors
        : null;
    return /** @type {string[]} */ (
        hrColors && hrColors.length ? hrColors : FALLBACK_HR_ZONE_COLORS
    );
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
 * Applies zone colors to zone data objects
 *
 * @param {ZoneData[]} zoneData - Array of zone data objects
 * @param {string} zoneType - "hr" or "power"
 *
 * @returns {ZoneData[]} Zone data with color property set
 */
export function applyZoneColors(zoneData, zoneType) {
    if (!Array.isArray(zoneData)) {
        return zoneData;
    }

    const zoneColors = zoneData.length
        ? getZoneColors(zoneType, zoneData.length)
        : [];

    return zoneData.map((zone, index) => {
        const zoneIndex = zone.zone ? zone.zone - 1 : index;
        const color =
            zoneColors[zoneIndex] ?? getZoneColor(zoneType, zoneIndex);

        return {
            ...zone,
            color,
        };
    });
}

/**
 * Gets the saved color for a specific zone and chart type or returns default
 *
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut",
 *   "power_lap_zone_stacked")
 * @param {number} zoneIndex - 0-based zone index
 *
 * @returns {string} Hex color code
 */
export function getChartSpecificZoneColor(chartField, zoneIndex) {
    const cacheKey = `${chartField}:${zoneIndex}`;
    const cachedValue = chartSpecificZoneColorCache.get(cacheKey);
    if (typeof cachedValue === "string") {
        return cachedValue;
    }

    const storedColor = getStoredChartSpecificZoneColor(chartField, zoneIndex);
    if (storedColor) {
        chartSpecificZoneColorCache.set(cacheKey, storedColor);
        return storedColor;
    }

    // Fallback to generic zone color if chart-specific color doesn't exist
    const zoneType = chartField.includes("hr") ? "hr" : "power";
    chartSpecificZoneColorCache.delete(cacheKey);
    return getZoneColor(zoneType, zoneIndex);
}

/**
 * Gets an array of colors for all zones of a specific chart type
 *
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut",
 *   "power_lap_zone_stacked")
 * @param {number} zoneCount - Number of zones
 *
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
 * Gets zone colors for chart rendering based on color scheme
 *
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @param {string} colorScheme - "classic", "vibrant", "monochrome", or "custom"
 *
 * @returns {string[]} Array of colors for chart use
 */
export function getChartZoneColors(
    zoneType,
    zoneCount,
    colorScheme = "custom"
) {
    if (colorScheme === "custom") {
        // Use custom colors from localStorage or defaults
        return getZoneColors(zoneType, zoneCount);
    }

    // Use predefined color scheme
    const schemes = /** @type {ColorSchemes} */ (chartColorSchemes);
    if (schemes[colorScheme] && schemes[colorScheme][zoneType]) {
        const colors = [],
            schemeColors = schemes[colorScheme][zoneType];
        for (let i = 0; i < zoneCount; i++) {
            colors.push(
                schemeColors[i] ||
                    schemeColors[i % schemeColors.length] ||
                    "#808080"
            );
        }
        return colors;
    }

    // Fallback to custom colors
    return getZoneColors(zoneType, zoneCount);
}

/**
 * Gets all predefined color schemes
 *
 * @returns {Object} Object containing all color schemes
 */
export function getColorSchemes() {
    return chartColorSchemes;
}

/**
 * Gets colors for display in the color picker UI based on the selected scheme
 *
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @param {string} colorScheme - "classic", "vibrant", "monochrome", or "custom"
 *
 * @returns {string[]} Array of colors for UI display
 */
export function getDisplayZoneColors(
    zoneType,
    zoneCount,
    colorScheme = "custom"
) {
    return getChartZoneColors(zoneType, zoneCount, colorScheme);
}

/**
 * Gets the saved color for a specific zone or returns default
 *
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneIndex - 0-based zone index
 *
 * @returns {string} Hex color code
 */
export function getZoneColor(zoneType, zoneIndex) {
    const cacheKey = `${zoneType}:${zoneIndex}`;
    if (zoneColorCache.has(cacheKey)) {
        return /** @type {string} */ (zoneColorCache.get(cacheKey));
    }

    const storedColor = getStoredZoneColor(zoneType, zoneIndex);
    if (storedColor) {
        zoneColorCache.set(cacheKey, storedColor);
        return storedColor;
    }

    // Return default color
    const defaultColors =
        zoneType === "hr" ? DEFAULT_HR_ZONE_COLORS : DEFAULT_POWER_ZONE_COLORS;
    const fallbackColor =
        defaultColors[zoneIndex] ||
        defaultColors[zoneIndex % defaultColors.length] ||
        "#808080";
    zoneColorCache.set(cacheKey, fallbackColor);
    return fallbackColor;
}

/**
 * Gets an array of colors for all zones of a given type
 *
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 *
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
 * Determines zone type from field name
 *
 * @param {string} field - Field name (e.g., zone chart identifiers)
 *
 * @returns {string | null} Hr , "power", or null if not a zone field
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
 * Checks if a chart field has custom colors set
 *
 * @param {string} chartField - Full chart field name
 * @param {number} zoneCount - Number of zones
 *
 * @returns {boolean} True if any custom colors are set
 */
export function hasChartSpecificColors(chartField, zoneCount) {
    for (let i = 0; i < zoneCount; i++) {
        if (getStoredChartSpecificZoneColor(chartField, i)) {
            return true;
        }
    }
    return false;
}

/**
 * Remove a chart-specific zone color entry and clear cache.
 *
 * @param {string} chartField
 * @param {number} zoneIndex
 */
export function removeChartSpecificZoneColor(chartField, zoneIndex) {
    const storageKey = getChartSpecificZoneColorKey(chartField, zoneIndex);
    removeChartSetting(storageKey);
    clearCachedChartZoneColor(chartField, zoneIndex);
}

/**
 * Remove a generic zone color entry and clear cache.
 *
 * @param {string} zoneType
 * @param {number} zoneIndex
 */
export function removeZoneColor(zoneType, zoneIndex) {
    const storageKey = getZoneColorKey(zoneType, zoneIndex);
    removeChartSetting(storageKey);
    clearCachedZoneColor(zoneType, zoneIndex);
}

/**
 * Resets all zone colors for a specific chart type to defaults
 *
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut",
 *   "power_lap_zone_stacked")
 * @param {number} zoneCount - Number of zones to reset
 */
export function resetChartSpecificZoneColors(chartField, zoneCount) {
    const zoneType = chartField.includes("hr") ? "hr" : "power",
        defaultColors =
            zoneType === "hr"
                ? DEFAULT_HR_ZONE_COLORS
                : DEFAULT_POWER_ZONE_COLORS;

    // Set color scheme to custom when resetting zone colors
    setChartColorScheme(chartField, "custom");

    for (let i = 0; i < zoneCount; i++) {
        const defaultColor =
            defaultColors[i] ||
            defaultColors[i % defaultColors.length] ||
            "#808080";
        saveChartSpecificZoneColor(chartField, i, defaultColor);
    }
}

/**
 * Resets all zone colors to defaults
 *
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones to reset
 */
export function resetZoneColors(zoneType, zoneCount) {
    const defaultColors =
        zoneType === "hr" ? DEFAULT_HR_ZONE_COLORS : DEFAULT_POWER_ZONE_COLORS;

    for (let i = 0; i < zoneCount; i++) {
        const defaultColor =
            defaultColors[i] ||
            defaultColors[i % defaultColors.length] ||
            "#808080";
        saveZoneColor(zoneType, i, defaultColor);
    }
}

/**
 * Saves a zone color for a specific chart type to localStorage
 *
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut",
 *   "power_lap_zone_stacked")
 * @param {number} zoneIndex - 0-based zone index
 * @param {string} color - Hex color code
 */
export function saveChartSpecificZoneColor(chartField, zoneIndex, color) {
    const normalized = normalizeStoredColor(color);
    if (!normalized) {
        console.warn("[ZoneColors] Refusing to persist invalid color token", {
            chartField,
            zoneIndex,
            color,
        });
        return;
    }

    const storageKey = getChartSpecificZoneColorKey(chartField, zoneIndex);
    const existing = getChartSetting(storageKey);
    if (existing !== normalized) {
        setChartSetting(storageKey, normalized);
    }
    chartSpecificZoneColorCache.set(`${chartField}:${zoneIndex}`, normalized);
}

/**
 * Saves a zone color to localStorage
 *
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneIndex - 0-based zone index
 * @param {string} color - Hex color code
 */
export function saveZoneColor(zoneType, zoneIndex, color) {
    const normalized = normalizeStoredColor(color);
    if (!normalized) {
        console.warn("[ZoneColors] Refusing to persist invalid color token", {
            zoneType,
            zoneIndex,
            color,
        });
        return;
    }

    const storageKey = getZoneColorKey(zoneType, zoneIndex);
    const existing = getChartSetting(storageKey);
    if (existing !== normalized) {
        setChartSetting(storageKey, normalized);
    }
    zoneColorCache.set(`${zoneType}:${zoneIndex}`, normalized);
}
