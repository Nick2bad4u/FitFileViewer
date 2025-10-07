/**
 * Theme setup utility for FitFileViewer
 * Provides consistent theme initialization and change handling with state management integration
 */

import { getState, setState, subscribe } from "../../state/core/stateManager.js";

// Constants for better maintainability
const THEME_CONSTANTS = {
    DEFAULT_THEME: "dark",
    LOG_PREFIX: "[ThemeSetup]",
    STORAGE_KEY: "fitFileViewer_theme", // Standardized key to match masterStateManager
    SUPPORTED_THEMES: ["light", "dark", "auto"],
    TIMEOUT: {
        THEME_FETCH: 5000, // 5 seconds timeout for theme fetch
    },
};

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
export async function setupTheme(applyTheme, listenForThemeChange, options = {}) {
    const config = {
        fallbackTheme: THEME_CONSTANTS.DEFAULT_THEME,
        useLocalStorage: true,
        ...options,
    };

    try {
        // Validate inputs
        if (typeof applyTheme !== "function") {
            throw new TypeError("applyTheme must be a function");
        }

        logWithContext("Initializing theme setup");

        // Try to get theme from various sources in order of preference
        const defaultTheme = THEME_CONSTANTS.DEFAULT_THEME;
        let theme = await fetchThemeFromMainProcess();

        // Fallback to localStorage if main process fails or default is returned
        if ((!theme || theme === defaultTheme) && config.useLocalStorage) {
            try {
                const storedTheme = localStorage.getItem(THEME_CONSTANTS.STORAGE_KEY);
                if (storedTheme && isValidTheme(storedTheme)) {
                    theme = storedTheme;
                    logWithContext(`Using stored theme: ${theme}`);
                }
            } catch (storageError) {
                logWithContext(
                    `Failed to read from localStorage: ${/** @type {Error} */ (storageError).message}`,
                    "warn"
                );
            }
        }

        // Final fallback chain
        if (!theme && config.fallbackTheme && isValidTheme(config.fallbackTheme)) {
            theme = config.fallbackTheme;
            logWithContext(`Using fallback theme override: ${theme}`);
        }

        if (!theme) {
            theme = defaultTheme;
            logWithContext(`Using default theme: ${theme}`);
        }

        if (!isValidTheme(theme)) {
            logWithContext(`Invalid theme resolved (${theme}), reverting to default`, "warn");
            theme = defaultTheme;
        }

        // Apply the theme and track it
        applyAndTrackTheme(theme, applyTheme);

        // Set up theme change listeners
        if (listenForThemeChange) {
            setupThemeChangeListener(applyTheme, listenForThemeChange);
        }

        logWithContext(`Theme setup completed successfully with theme: ${theme}`);
        return theme;
    } catch (error) {
        logWithContext(`Error during theme setup: ${/** @type {Error} */ (error).message}`, "error");

        // Emergency fallback
        const emergencyTheme = THEME_CONSTANTS.DEFAULT_THEME;
        try {
            applyTheme(emergencyTheme);
            setState("ui.theme", emergencyTheme, { source: "setupTheme-emergency" });
        } catch (emergencyError) {
            logWithContext(
                `Emergency theme application failed: ${/** @type {Error} */ (emergencyError).message}`,
                "error"
            );
        }

        return emergencyTheme;
    }
}

/**
 * Applies a theme and updates the application state
 * @param {string} theme - Theme name to apply
 * @param {Function} applyTheme - Function to apply the theme
 * @private
 */
function applyAndTrackTheme(theme, applyTheme) {
    try {
        if (!isValidTheme(theme)) {
            logWithContext(`Invalid theme: ${theme}, using default`, "warn");
            theme = THEME_CONSTANTS.DEFAULT_THEME;
        }

        // Apply the theme
        if (typeof applyTheme === "function") {
            applyTheme(theme);
            logWithContext(`Theme applied: ${theme}`);
        } else {
            logWithContext("Invalid applyTheme function provided", "error");
            return;
        }

        // Update state
        setState("ui.theme", theme, { source: "setupTheme" });

        // Store in localStorage for persistence
        try {
            localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, theme);
        } catch (storageError) {
            logWithContext(
                `Failed to store theme in localStorage: ${/** @type {Error} */ (storageError).message}`,
                "warn"
            );
        }
    } catch (error) {
        logWithContext(`Error applying theme: ${/** @type {Error} */ (error).message}`, "error");
    }
}

/**
 * Fetches the current theme from the main process with timeout
 * @returns {Promise<string>} The current theme or default theme
 * @private
 */
async function fetchThemeFromMainProcess() {
    const { TIMEOUT } = THEME_CONSTANTS;

    if (!globalThis.electronAPI?.getTheme) {
        logWithContext("ElectronAPI getTheme not available, unable to fetch theme", "warn");
        return null;
    }

    try {
        // Add timeout to prevent hanging
        const themePromise = globalThis.electronAPI.getTheme(),
            timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Theme fetch timeout")), TIMEOUT.THEME_FETCH);
            }),
            theme = await Promise.race([themePromise, timeoutPromise]);

        if (typeof theme === "string" && isValidTheme(theme)) {
            logWithContext(`Theme fetched from main process: ${theme}`);
            return theme;
        }

        logWithContext(`Invalid theme received from main process: ${theme}`, "warn");
        return null;
    } catch (error) {
        logWithContext(
            `Failed to get theme from main process: ${/** @type {Error} */ (error).message}`,
            "warn"
        );
        return null;
    }
}

/**
 * Validates if a theme name is supported
 * @param {string} theme - Theme name to validate
 * @returns {boolean} True if theme is supported
 * @private
 */
function isValidTheme(theme) {
    return typeof theme === "string" && THEME_CONSTANTS.SUPPORTED_THEMES.includes(theme);
}

/**
 * Logs messages with context for theme operations
 * @param {string} message - The message to log
 * @param {string} level - Log level ('info', 'warn', 'error')
 * @private
 */
function logWithContext(message, level = "info") {
    try {
        const prefix = THEME_CONSTANTS.LOG_PREFIX;
        switch (level) {
            case "error": {
                console.error(`${prefix} ${message}`);
                break;
            }
            case "warn": {
                console.warn(`${prefix} ${message}`);
                break;
            }
            default: {
                console.log(`${prefix} ${message}`);
            }
        }
    } catch {
        // Silently fail if logging encounters an error
    }
}

/**
 * Sets up theme change listener with state integration
 * @param {Function} applyTheme - Function to apply theme changes
 * @param {Function} listenForThemeChange - Function to register theme change listener
 * @private
 */
function setupThemeChangeListener(applyTheme, listenForThemeChange) {
    try {
        if (typeof listenForThemeChange === "function") {
            // Set up external theme change listener
            listenForThemeChange(
                /** @param {*} newTheme */(newTheme) => {
                    logWithContext(`Theme change received: ${newTheme}`);
                    applyAndTrackTheme(newTheme, applyTheme);
                }
            );
        }

        // Set up state-based theme change listener
        subscribe(
            "ui.theme",
            /** @param {*} newTheme */(newTheme) => {
                if (newTheme && newTheme !== getState("ui.previousTheme")) {
                    logWithContext(`State-driven theme change: ${newTheme}`);
                    setState("ui.previousTheme", newTheme, { source: "setupTheme" });

                    if (typeof applyTheme === "function") {
                        applyTheme(newTheme);
                    }
                }
            }
        );

        logWithContext("Theme change listeners registered");
    } catch (error) {
        logWithContext(`Error setting up theme change listener: ${/** @type {Error} */ (error).message}`, "error");
    }
}
