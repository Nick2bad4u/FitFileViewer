// Utility for setting up theme
/**
 * Initializes the application theme by retrieving the current theme from the main process (if available),
 * applying it, and setting up a listener for theme changes.
 *
 * @param {function(string):void} applyTheme - Function to apply the selected theme (e.g., "dark" or "light").
 * @param {function(function(string):void):void} listenForThemeChange - Function to register a callback for theme changes.
 * @returns {Promise<void>} Resolves when the theme has been set and the listener registered.
 */
export async function setupTheme(applyTheme, listenForThemeChange) {
    let theme = "dark";
    if (typeof window.electronAPI?.getTheme === "function") {
        try {
            theme = await window.electronAPI.getTheme();
        } catch (error) {
            console.warn(
                "[setupTheme] Failed to get theme from main process in window.electronAPI.getTheme:",
                error,
                "Defaulting to dark."
            );
        }
    }
    applyTheme(theme);
    if (typeof listenForThemeChange === "function") {
        listenForThemeChange(applyTheme);
    }
}
