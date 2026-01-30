import { getThemeConfig } from "../../theming/core/theme.js";

/**
 * Theme color management constants
 *
 * @readonly
 */
const THEME_COLOR_CONFIG = {
    ERROR_MESSAGES: {
        INVALID_THEME_CONFIG: "Invalid theme configuration",
        THEME_ACCESS_ERROR: "Failed to access theme colors:",
    },
    FALLBACK_COLORS: {
        accentColor: "#3b82f6",
        bgPrimary: "#ffffff",
        textPrimary: "#000000",
    },
};

/**
 * Gets a specific theme color by key with fallback
 *
 * @example
 *     // Get specific color with fallback
 *     const bgColor = getThemeColor("bgPrimary", "#ffffff");
 *
 * @param {string} colorKey - The color key to retrieve
 * @param {string} [fallback] - Fallback color if key not found
 *
 * @returns {string} The color value or fallback
 */
export function getThemeColor(colorKey, fallback = "#000000") {
    if (typeof colorKey !== "string" || !colorKey.trim()) {
        console.warn(`[getThemeColor] Invalid color key: ${colorKey}`);
        return fallback;
    }

    try {
        const colors = getThemeColors();
        return colors[colorKey] || fallback;
    } catch (error) {
        console.error(
            `[getThemeColor] Error getting color '${colorKey}':`,
            error
        );
        return fallback;
    }
}

/**
 * Returns an object containing all theme color keys as defined in the theme
 * system
 *
 * The returned object structure matches `getThemeConfig().colors` and includes
 * all available theme color variables. Provides safe access with fallback
 * colors in case of theme system errors.
 *
 * @example
 *     // Get all current theme colors
 *     const colors = getThemeColors();
 *     const backgroundColor = colors.bgPrimary;
 *     const textColor = colors.textPrimary;
 *
 * @returns {Object<string, string>} Theme colors object with all theme color
 *   keys
 *
 * @throws {Error} If theme system is not available or corrupted
 */
export function getThemeColors() {
    try {
        const themeConfig = /** @type {any} */ (getThemeConfig());

        // Validate theme configuration
        if (!themeConfig || typeof themeConfig !== "object") {
            console.warn(
                `[getThemeColors] ${THEME_COLOR_CONFIG.ERROR_MESSAGES.INVALID_THEME_CONFIG}`
            );
            return { ...THEME_COLOR_CONFIG.FALLBACK_COLORS };
        }

        // Validate colors object exists
        if (!themeConfig.colors || typeof themeConfig.colors !== "object") {
            console.warn(
                "[getThemeColors] Theme colors not found, using fallback"
            );
            return { ...THEME_COLOR_CONFIG.FALLBACK_COLORS };
        }

        // Return copy of theme colors to prevent mutation
        return { ...themeConfig.colors };
    } catch (error) {
        console.error(
            `[getThemeColors] ${THEME_COLOR_CONFIG.ERROR_MESSAGES.THEME_ACCESS_ERROR}`,
            error
        );

        // Return fallback colors on error
        return { ...THEME_COLOR_CONFIG.FALLBACK_COLORS };
    }
}
