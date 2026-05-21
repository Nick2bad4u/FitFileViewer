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
function isZoneType(value) {
    return value === "hr" || value === "power";
}
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
 */
export function clearChartColorScheme(chartField) {
    return removeChartSetting(getChartColorSchemeKey(chartField));
}
/**
 * Get the stored chart color scheme for a field.
 */
export function getChartColorScheme(chartField) {
    const stored = getChartSetting(getChartColorSchemeKey(chartField));
    return typeof stored === "string" && stored.trim() ? stored : "custom";
}
/**
 * Read a chart-specific zone color from storage without applying fallbacks.
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
 * Normalize a stored color token, rejecting unsafe values.
 */
function normalizeStoredColor(value) {
    return isSafeCssColorToken(value) ? value.trim() : null;
}
/**
 * Clear one chart-specific zone color cache entry.
 */
export const clearCachedChartZoneColor = (chartField, zoneIndex) => {
    chartSpecificZoneColorCache.delete(`${chartField}:${zoneIndex}`);
};
/**
 * Clear one generic zone color cache entry.
 */
export const clearCachedZoneColor = (zoneType, zoneIndex) => {
    zoneColorCache.delete(`${zoneType}:${zoneIndex}`);
};
/**
 * Clear all cached zone colors for a field.
 */
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
 */
function getDefaultZoneColors(zoneType) {
    let themeConfig;
    try {
        themeConfig = getThemeConfig();
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
        const powerColors = Array.isArray(colors["powerZoneColors"])
            ? colors["powerZoneColors"]
            : null;
        return powerColors && powerColors.length
            ? [...powerColors]
            : FALLBACK_POWER_ZONE_COLORS;
    }
    const hrColors = Array.isArray(colors["heartRateZoneColors"])
        ? colors["heartRateZoneColors"]
        : null;
    return hrColors && hrColors.length
        ? [...hrColors]
        : FALLBACK_HR_ZONE_COLORS;
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
 * "power_lap_zone_stacked")
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
 * "power_lap_zone_stacked")
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
    const schemes = chartColorSchemes;
    if (!isZoneType(zoneType)) {
        return getZoneColors(zoneType, zoneCount);
    }
    const scheme = schemes[colorScheme];
    const schemeColors = scheme?.[zoneType];
    if (schemeColors) {
        const colors = [];
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
 */
export function getColorSchemes() {
    return chartColorSchemes;
}
/**
 * Gets colors for display in the color picker UI based on the selected scheme
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
 */
export function getZoneColor(zoneType, zoneIndex) {
    const cacheKey = `${zoneType}:${zoneIndex}`;
    if (zoneColorCache.has(cacheKey)) {
        return zoneColorCache.get(cacheKey);
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
 */
export function removeChartSpecificZoneColor(chartField, zoneIndex) {
    const storageKey = getChartSpecificZoneColorKey(chartField, zoneIndex);
    removeChartSetting(storageKey);
    clearCachedChartZoneColor(chartField, zoneIndex);
}
/**
 * Remove a generic zone color entry and clear cache.
 */
export function removeZoneColor(zoneType, zoneIndex) {
    const storageKey = getZoneColorKey(zoneType, zoneIndex);
    removeChartSetting(storageKey);
    clearCachedZoneColor(zoneType, zoneIndex);
}
/**
 * Resets all zone colors for a specific chart type to defaults
 *
 * "power_lap_zone_stacked")
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
 * "power_lap_zone_stacked")
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
