/**
 * Apply the given theme to the document body and persist it.
 * @param {string} theme - 'dark', 'light', or 'auto'
 * @param {boolean} withTransition - Whether to animate the theme change
 */
export function applyTheme(theme: string, withTransition?: boolean): void;
/**
 * Get the effective theme (resolves 'auto' to actual theme)
 * @param {string|null} [theme] - The theme preference
 * @returns {string} 'dark' or 'light'
 */
export function getEffectiveTheme(theme?: string | null): string;
/**
 * Get the system's preferred color scheme
 * @returns {string} 'dark' or 'light'
 */
export function getSystemTheme(): string;
/**
 * Get theme preference for external libraries
 * @returns {Object} Theme configuration object
 */
export function getThemeConfig(): Object;
/**
 * Initialize theme system
 */
export function initializeTheme(): Function | undefined;
/**
 * Listen for system theme changes and update if using auto theme
 * @returns {Function|undefined} Cleanup function if available
 */
export function listenForSystemThemeChange(): Function | undefined;
/**
 * Listen for theme change events from the Electron main process and apply the theme.
 * @param {(theme: string) => void} onThemeChange
 */
export function listenForThemeChange(onThemeChange: (theme: string) => void): void;
/**
 * Load the persisted theme from localStorage, defaulting to 'dark'.
 * @returns {string}
 */
export function loadTheme(): string;
/**
 * Toggle between light and dark themes
 * @param {boolean} withTransition - Whether to animate the theme change
 */
export function toggleTheme(withTransition?: boolean): void;
export namespace THEME_MODES {
    let AUTO: string;
    let DARK: string;
    let LIGHT: string;
}
export namespace theme {
    export { THEME_MODES };
    export { applyTheme };
    export { getEffectiveTheme };
    export { getSystemTheme };
    export { getThemeConfig };
    export { initializeTheme };
    export { listenForSystemThemeChange };
    export { listenForThemeChange };
    export { loadTheme };
    export { toggleTheme };
}
export type ThemeConfig = {
    /**
     * - The effective theme name
     */
    theme: string;
    /**
     * - Whether the theme is dark
     */
    isDark: boolean;
    /**
     * - Whether the theme is light
     */
    isLight: boolean;
    /**
     * - Color configuration object
     */
    colors: Object;
};
//# sourceMappingURL=theme.d.ts.map
