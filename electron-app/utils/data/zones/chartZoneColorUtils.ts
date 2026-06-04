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
import { getThemeConfig, type ThemeConfig } from "../../theming/core/theme.js";

/**
 * Zone payload rendered by zone charts and selectors.
 */
export interface ZoneData {
    color?: string;
    label?: string;
    time?: number;
    value?: number;
    zone?: number;
}

type ZoneType = "hr" | "power";
type ColorSchemes = Record<
    string,
    Partial<Record<ZoneType, readonly string[]>>
>;

function isZoneType(value: string): value is ZoneType {
    return value === "hr" || value === "power";
}

function getStringArray(value: unknown): null | string[] {
    return Array.isArray(value) &&
        value.every((entry): entry is string => typeof entry === "string")
        ? [...value]
        : null;
}

const FALLBACK_HR_ZONE_COLORS: string[] = [
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
const FALLBACK_POWER_ZONE_COLORS: string[] = [
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

const zoneColorCache = new Map<string, string>();
const chartSpecificZoneColorCache = new Map<string, string>();
const COLOR_SCHEME_SUFFIX = "_color_scheme";

const getChartColorSchemeKey = (chartField: string): string =>
    `${chartField}${COLOR_SCHEME_SUFFIX}`;
const getChartSpecificZoneColorKey = (
    chartField: string,
    zoneIndex: number
): string => `${chartField}_zone_${zoneIndex + 1}_color`;
const getZoneColorKey = (zoneType: string, zoneIndex: number): string =>
    `${zoneType}_zone_${zoneIndex + 1}_color`;

/**
 * Clear the chart color scheme for a field.
 */
export function clearChartColorScheme(chartField: string): boolean {
    return removeChartSetting(getChartColorSchemeKey(chartField));
}

/**
 * Get the stored chart color scheme for a field.
 */
export function getChartColorScheme(chartField: string): string {
    const stored = getChartSetting(getChartColorSchemeKey(chartField));
    return typeof stored === "string" && stored.trim() ? stored : "custom";
}

/**
 * Read a chart-specific zone color from storage without applying fallbacks.
 */
export function getStoredChartSpecificZoneColor(
    chartField: string,
    zoneIndex: number
): null | string {
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
export function getStoredZoneColor(
    zoneType: string,
    zoneIndex: number
): null | string {
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
export function setChartColorScheme(
    chartField: string,
    scheme: string
): string {
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
function isSafeCssColorToken(value: unknown): value is string {
    if (typeof value !== "string") return false;
    const v = value.trim();
    if (v.length === 0 || v.length > 64) return false;
    // Prevent injection into cssText or style attribute.
    if (/[;{}\n\r]/u.test(v)) return false;
    if (/url\(/iu.test(v)) return false;

    // Accept common safe formats.
    if (/^#[\da-f]{3,4}$/iu.test(v)) return true; // #RGB / #RGBA
    if (/^#[\da-f]{6}(?:[\da-f]{2})?$/iu.test(v)) return true; // #RRGGBB / #RRGGBBAA
    if (
        /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/iu.test(
            v
        )
    )
        return true;

    return false;
}

/**
 * Normalize a stored color token, rejecting unsafe values.
 */
function normalizeStoredColor(value: unknown): null | string {
    return isSafeCssColorToken(value) ? value.trim() : null;
}

/**
 * Clear one chart-specific zone color cache entry.
 */
export const clearCachedChartZoneColor = (
    chartField: string,
    zoneIndex: number
): void => {
    chartSpecificZoneColorCache.delete(`${chartField}:${zoneIndex}`);
};

/**
 * Clear one generic zone color cache entry.
 */
export const clearCachedZoneColor = (
    zoneType: string,
    zoneIndex: number
): void => {
    zoneColorCache.delete(`${zoneType}:${zoneIndex}`);
};

/**
 * Clear all cached zone colors for a field.
 */
export const clearCachedZoneColors = (
    field: string,
    zoneCount: number
): void => {
    for (let i = 0; i < zoneCount; i += 1) {
        chartSpecificZoneColorCache.delete(`${field}:${i}`);
    }
    const zoneType = getZoneTypeFromField(field);
    if (zoneType) {
        for (let i = 0; i < zoneCount; i += 1) {
            zoneColorCache.delete(`${zoneType}:${i}`);
        }
    }
};

/**
 * Gets default zone colors from theme configuration
 */
function getDefaultZoneColors(zoneType: ZoneType): string[] {
    let themeConfig: ThemeConfig | undefined;
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
        const powerColors = getStringArray(colors["powerZoneColors"]);
        return powerColors && powerColors.length > 0
            ? powerColors
            : FALLBACK_POWER_ZONE_COLORS;
    }
    const hrColors = getStringArray(colors["heartRateZoneColors"]);
    return hrColors && hrColors.length > 0
        ? hrColors
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
export function applyZoneColors(
    zoneData: ZoneData[],
    zoneType: string
): ZoneData[] {
    if (!Array.isArray(zoneData)) {
        return zoneData;
    }

    const zoneColors = zoneData.length > 0
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
export function getChartSpecificZoneColor(
    chartField: string,
    zoneIndex: number
): string {
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
    const zoneType: ZoneType = chartField.includes("hr") ? "hr" : "power";
    chartSpecificZoneColorCache.delete(cacheKey);
    return getZoneColor(zoneType, zoneIndex);
}

/**
 * Gets an array of colors for all zones of a specific chart type
 *
 * "power_lap_zone_stacked")
 */
export function getChartSpecificZoneColors(
    chartField: string,
    zoneCount: number
): string[] {
    const colors: string[] = [];
    for (let i = 0; i < zoneCount; i += 1) {
        colors.push(getChartSpecificZoneColor(chartField, i));
    }
    return colors;
}

/**
 * Gets zone colors for chart rendering based on color scheme
 */
export function getChartZoneColors(
    zoneType: string,
    zoneCount: number,
    colorScheme = "custom"
): string[] {
    if (colorScheme === "custom") {
        // Use custom colors from localStorage or defaults
        return getZoneColors(zoneType, zoneCount);
    }

    // Use predefined color scheme
    const schemes = chartColorSchemes as ColorSchemes;
    if (!isZoneType(zoneType)) {
        return getZoneColors(zoneType, zoneCount);
    }
    const scheme = schemes[colorScheme];
    const schemeColors = scheme?.[zoneType];
    if (schemeColors) {
        const colors: string[] = [];
        for (let i = 0; i < zoneCount; i += 1) {
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
export function getColorSchemes(): typeof chartColorSchemes {
    return chartColorSchemes;
}

/**
 * Gets colors for display in the color picker UI based on the selected scheme
 */
export function getDisplayZoneColors(
    zoneType: string,
    zoneCount: number,
    colorScheme = "custom"
): string[] {
    return getChartZoneColors(zoneType, zoneCount, colorScheme);
}

/**
 * Gets the saved color for a specific zone or returns default
 */
export function getZoneColor(zoneType: string, zoneIndex: number): string {
    const cacheKey = `${zoneType}:${zoneIndex}`;
    const cachedValue = zoneColorCache.get(cacheKey);
    if (typeof cachedValue === "string") {
        return cachedValue;
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
export function getZoneColors(zoneType: string, zoneCount: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < zoneCount; i += 1) {
        colors.push(getZoneColor(zoneType, i));
    }
    return colors;
}

/**
 * Determines zone type from field name
 */
export function getZoneTypeFromField(field: string): null | ZoneType {
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
export function hasChartSpecificColors(
    chartField: string,
    zoneCount: number
): boolean {
    for (let i = 0; i < zoneCount; i += 1) {
        if (getStoredChartSpecificZoneColor(chartField, i)) {
            return true;
        }
    }
    return false;
}

/**
 * Remove a chart-specific zone color entry and clear cache.
 */
export function removeChartSpecificZoneColor(
    chartField: string,
    zoneIndex: number
): void {
    const storageKey = getChartSpecificZoneColorKey(chartField, zoneIndex);
    removeChartSetting(storageKey);
    clearCachedChartZoneColor(chartField, zoneIndex);
}

/**
 * Remove a generic zone color entry and clear cache.
 */
export function removeZoneColor(zoneType: string, zoneIndex: number): void {
    const storageKey = getZoneColorKey(zoneType, zoneIndex);
    removeChartSetting(storageKey);
    clearCachedZoneColor(zoneType, zoneIndex);
}

/**
 * Resets all zone colors for a specific chart type to defaults
 *
 * "power_lap_zone_stacked")
 */
export function resetChartSpecificZoneColors(
    chartField: string,
    zoneCount: number
): void {
    const zoneType: ZoneType = chartField.includes("hr") ? "hr" : "power",
        defaultColors =
            zoneType === "hr"
                ? DEFAULT_HR_ZONE_COLORS
                : DEFAULT_POWER_ZONE_COLORS;

    // Set color scheme to custom when resetting zone colors
    setChartColorScheme(chartField, "custom");

    for (let i = 0; i < zoneCount; i += 1) {
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
export function resetZoneColors(zoneType: string, zoneCount: number): void {
    const defaultColors =
        zoneType === "hr" ? DEFAULT_HR_ZONE_COLORS : DEFAULT_POWER_ZONE_COLORS;

    for (let i = 0; i < zoneCount; i += 1) {
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
export function saveChartSpecificZoneColor(
    chartField: string,
    zoneIndex: number,
    color: string
): void {
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
export function saveZoneColor(
    zoneType: string,
    zoneIndex: number,
    color: string
): void {
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
