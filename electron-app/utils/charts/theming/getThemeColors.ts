import {
    getThemeConfig,
    type ThemeColorMap,
} from "../../theming/core/theme.js";

const ERROR_MESSAGES = {
    INVALID_THEME_CONFIG: "Invalid theme configuration",
    THEME_ACCESS_ERROR: "Failed to access theme colors:",
} as const;

/**
 * Fallback colors used when the theme core is unavailable or returns an invalid
 * color map.
 */
export const FALLBACK_THEME_COLORS = {
    accentColor: "#3b82f6",
    bgPrimary: "#ffffff",
    textPrimary: "#000000",
} as const satisfies ThemeColorMap;

function hasThemeColors(value: unknown): value is { colors: ThemeColorMap } {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const colors = (value as { colors?: unknown }).colors;
    return colors !== null && typeof colors === "object";
}

/**
 * Get a specific string theme color by key.
 *
 * @param colorKey - Color key to retrieve.
 * @param fallback - Fallback color when the key is invalid or missing.
 * @returns Theme color value or fallback.
 */
export function getThemeColor(
    colorKey: string,
    fallback = "#000000"
): string {
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
export function getThemeColors(): ThemeColorMap {
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
