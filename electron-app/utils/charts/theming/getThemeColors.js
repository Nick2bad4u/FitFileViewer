import { getThemeConfig } from "../../theming/core/theme.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
const ERROR_MESSAGES = {
    INVALID_THEME_CONFIG: "Invalid theme configuration",
    THEME_ACCESS_ERROR: "Failed to access theme colors:",
};
/**
 * Fallback colors used when the theme core is unavailable or returns an invalid
 * color map.
 */
export const FALLBACK_THEME_COLORS = {
    accentColor: "#3b82f6",
    bgPrimary: "#ffffff",
    textPrimary: "#000000",
};
function isThemeColorValue(value) {
    return (
        typeof value === "string" ||
        (Array.isArray(value) &&
            value.every((item) => typeof item === "string"))
    );
}
/**
 * Checks whether an unknown value matches the theme color map contract.
 */
export function isThemeColorMap(value) {
    return (
        isObjectRecord(value) && Object.values(value).every(isThemeColorValue)
    );
}
function hasThemeColors(value) {
    return isObjectRecord(value) && isThemeColorMap(value["colors"]);
}
/**
 * Get a specific string theme color by key.
 *
 * @param colorKey - Color key to retrieve.
 * @param fallback - Fallback color when the key is invalid or missing.
 *
 * @returns Theme color value or fallback.
 */
export function getThemeColor(colorKey, fallback = "#000000") {
    if (typeof colorKey !== "string" || !colorKey.trim()) {
        console.warn(`[getThemeColor] Invalid color key: ${colorKey}`);
        return fallback;
    }
    try {
        const color = getThemeColors()[colorKey];
        return typeof color === "string" && color ? color : fallback;
    } catch (error) {
        console.error(
            `[getThemeColor] Error getting color '${colorKey}':`,
            error
        );
        return fallback;
    }
}
/**
 * Get all current theme colors.
 *
 * @returns Copy of the theme color map, or fallback colors when unavailable.
 */
export function getThemeColors() {
    try {
        const themeConfig = getThemeConfig();
        if (!hasThemeColors(themeConfig)) {
            console.warn(
                `[getThemeColors] ${ERROR_MESSAGES.INVALID_THEME_CONFIG}`
            );
            return { ...FALLBACK_THEME_COLORS };
        }
        return { ...themeConfig.colors };
    } catch (error) {
        console.error(
            `[getThemeColors] ${ERROR_MESSAGES.THEME_ACCESS_ERROR}`,
            error
        );
        return { ...FALLBACK_THEME_COLORS };
    }
}
