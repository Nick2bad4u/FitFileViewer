import { getThemeConfig } from "./theme.js";

/**
 * Helper function to get theme colors from the theme configuration
 * @returns {Object} Theme colors object
 */
export function getThemeColors() {
    return getThemeConfig().colors;
}
