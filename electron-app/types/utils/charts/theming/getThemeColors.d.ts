/**
 * Gets a specific theme color by key with fallback
 * @param {string} colorKey - The color key to retrieve
 * @param {string} [fallback] - Fallback color if key not found
 * @returns {string} The color value or fallback
 * @example
 * // Get specific color with fallback
 * const bgColor = getThemeColor("bgPrimary", "#ffffff");
 */
export function getThemeColor(colorKey: string, fallback?: string): string;
/**
 * Returns an object containing all theme color keys as defined in the theme system
 *
 * The returned object structure matches `getThemeConfig().colors` and includes
 * all available theme color variables. Provides safe access with fallback colors
 * in case of theme system errors.
 *
 * @returns {Object.<string, string>} Theme colors object with all theme color keys
 * @throws {Error} If theme system is not available or corrupted
 * @example
 * // Get all current theme colors
 * const colors = getThemeColors();
 * const backgroundColor = colors.bgPrimary;
 * const textColor = colors.textPrimary;
 */
export function getThemeColors(): {
    [x: string]: string;
};
//# sourceMappingURL=getThemeColors.d.ts.map
