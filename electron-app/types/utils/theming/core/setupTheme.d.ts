/**
 * Initializes the application theme by retrieving the current theme from the main process,
 * applying it, and setting up listeners for theme changes with state management integration.
 *
 * @param {Function} applyTheme - Function to apply the selected theme (e.g., "dark" or "light")
 * @param {Function} [listenForThemeChange] - Optional function to register a callback for theme changes
 * @param {Object} [options={}] - Configuration options
 * @param {string} [options.fallbackTheme] - Theme to use if main process is unavailable
 * @param {boolean} [options.useLocalStorage=true] - Whether to use localStorage for persistence
 * @returns {Promise<string>} Resolves with the applied theme name
 *
 * @example
 * // Basic theme setup
 * await setupTheme((theme) => {
 *   document.documentElement.setAttribute('data-theme', theme);
 * });
 *
 * @example
 * // Theme setup with change listener
 * await setupTheme(
 *   (theme) => applyThemeToUI(theme),
 *   (callback) => window.electronAPI.onThemeChange(callback)
 * );
 *
 * @public
 */
export function setupTheme(
    applyTheme: Function,
    listenForThemeChange?: Function,
    options?: {
        fallbackTheme?: string | undefined;
        useLocalStorage?: boolean | undefined;
    }
): Promise<string>;
