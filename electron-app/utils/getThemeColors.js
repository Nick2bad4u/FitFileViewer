import { getThemeConfig } from "./theme.js";

/**
 * Returns an object containing all theme color keys as defined in the theme system.
 * The returned object structure matches `getThemeConfig().colors` and may include
 * additional keys for compatibility with legacy or custom themes.
 * Example keys: bgPrimary, textPrimary, accentColor, and any custom theme color variables.
 * @returns {Object.<string, string>} Theme colors object with all theme color keys.
 */
export function getThemeColors() {
    return { ...getThemeConfig().colors };
}
