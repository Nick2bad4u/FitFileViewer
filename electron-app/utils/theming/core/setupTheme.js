/**
 * Theme setup utility for FitFileViewer Provides consistent theme
 * initialization and change handling with state management integration
 */

import {
    getState,
    setState,
    subscribe,
} from "../../state/core/stateManager.js";

// Constants for better maintainability
const THEME_CONSTANTS = {
    DEFAULT_THEME: "dark",
    LOG_PREFIX: "[ThemeSetup]",
    // Canonical key used across the renderer, charts, and main-process constants.
    STORAGE_KEY: "ffv-theme",
    // Legacy key used by older state-manager implementations.
    LEGACY_STORAGE_KEY: "fitFileViewer_theme",
    SUPPORTED_THEMES: [
        "light",
        "dark",
        "auto",
    ],
    TIMEOUT: {
        THEME_FETCH: 5000, // 5 seconds timeout for theme fetch
    },
};

/**
 * Initializes the application theme by retrieving the current theme from the
 * main process, applying it, and setting up listeners for theme changes with
 * state management integration.
 *
 * @example
 *     // Basic theme setup
 *     await setupTheme((theme) => {
 *         document.documentElement.setAttribute("data-theme", theme);
 *     });
 *
 * @example
 *     // Theme setup with change listener
 *     await setupTheme(
 *         (theme) => applyThemeToUI(theme),
 *         (callback) => window.electronAPI.onThemeChange(callback)
 *     );
 *
 * @param {Function} applyTheme - Function to apply the selected theme (e.g.,
 *   "dark" or "light")
 * @param {Function} [listenForThemeChange] - Optional function to register a
 *   callback for theme changes
 * @param {Object} [options={}] - Configuration options. Default is `{}`
 * @param {string} [options.fallbackTheme] - Theme to use if main process is
 *   unavailable
 * @param {boolean} [options.useLocalStorage=true] - Whether to use localStorage
 *   for persistence. Default is `true`
 *
 * @returns {Promise<string>} Resolves with the applied theme name
 *
 * @public
 */
export async function setupTheme(
    applyTheme,
    listenForThemeChange,
    options = {}
) {
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
        let theme = await fetchThemeFromMainProcess();

        // Normalize legacy theme names from older state/UI code.
        theme = normalizeThemeValue(theme) || THEME_CONSTANTS.DEFAULT_THEME;

        // Fallback to localStorage if main process fails
        if (theme === THEME_CONSTANTS.DEFAULT_THEME && config.useLocalStorage) {
            try {
                const storedTheme = localStorage.getItem(
                    THEME_CONSTANTS.STORAGE_KEY
                );
                const normalizedStored = normalizeThemeValue(storedTheme);
                if (normalizedStored) {
                    theme = normalizedStored;
                    logWithContext(`Using stored theme: ${theme}`);
                } else {
                    // Legacy migration: fitFileViewer_theme -> ffv-theme
                    const legacyTheme = localStorage.getItem(
                        THEME_CONSTANTS.LEGACY_STORAGE_KEY
                    );
                    const normalizedLegacy = normalizeThemeValue(legacyTheme);
                    if (normalizedLegacy) {
                        theme = normalizedLegacy;
                        try {
                            localStorage.setItem(
                                THEME_CONSTANTS.STORAGE_KEY,
                                normalizedLegacy
                            );
                            localStorage.removeItem(
                                THEME_CONSTANTS.LEGACY_STORAGE_KEY
                            );
                        } catch {
                            /* ignore */
                        }
                        logWithContext(
                            `Migrated legacy stored theme: ${theme}`
                        );
                    }
                }
            } catch (storageError) {
                logWithContext(
                    `Failed to read from localStorage: ${/** @type {Error} */ (storageError).message}`,
                    "warn"
                );
            }
        }

        // Final fallback to config option
        if (!isValidTheme(theme)) {
            theme = config.fallbackTheme || THEME_CONSTANTS.DEFAULT_THEME;
            logWithContext(`Using fallback theme: ${theme}`);
        }

        // Apply the theme and track it
        applyAndTrackTheme(theme, applyTheme);

        // Set up theme change listeners
        if (listenForThemeChange) {
            setupThemeChangeListener(applyTheme, listenForThemeChange);
        }

        logWithContext(
            `Theme setup completed successfully with theme: ${theme}`
        );
        return theme;
    } catch (error) {
        logWithContext(
            `Error during theme setup: ${/** @type {Error} */ (error).message}`,
            "error"
        );

        // Emergency fallback
        const emergencyTheme = THEME_CONSTANTS.DEFAULT_THEME;
        try {
            applyTheme(emergencyTheme);
            setState("ui.theme", emergencyTheme, {
                source: "setupTheme-emergency",
            });
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
 *
 * @private
 *
 * @param {string} theme - Theme name to apply
 * @param {Function} applyTheme - Function to apply the theme
 */
function applyAndTrackTheme(theme, applyTheme) {
    try {
        const normalized = normalizeThemeValue(theme);

        if (normalized) {
            theme = normalized;
        } else {
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
        // - Theme core persists: "auto" | "dark" | "light"
        // - UI/state layer historically uses: "system" for auto
        const uiTheme = theme === "auto" ? "system" : theme;
        setState("ui.theme", uiTheme, { source: "setupTheme" });

        // Store in localStorage for persistence
        try {
            localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, theme);
            // Clean up legacy key if present (best effort)
            if (
                localStorage.getItem(THEME_CONSTANTS.LEGACY_STORAGE_KEY) !==
                null
            ) {
                localStorage.removeItem(THEME_CONSTANTS.LEGACY_STORAGE_KEY);
            }
        } catch (storageError) {
            logWithContext(
                `Failed to store theme in localStorage: ${/** @type {Error} */ (storageError).message}`,
                "warn"
            );
        }
    } catch (error) {
        logWithContext(
            `Error applying theme: ${/** @type {Error} */ (error).message}`,
            "error"
        );
    }
}

/**
 * Fetches the current theme from the main process with timeout
 *
 * @private
 *
 * @returns {Promise<string>} The current theme or default theme
 */
async function fetchThemeFromMainProcess() {
    const { DEFAULT_THEME, TIMEOUT } = THEME_CONSTANTS;

    if (!globalThis.electronAPI?.getTheme) {
        logWithContext(
            "ElectronAPI getTheme not available, using default theme",
            "warn"
        );
        return DEFAULT_THEME;
    }

    try {
        // Add timeout to prevent hanging
        const themePromise = globalThis.electronAPI.getTheme(),
            timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                    () => reject(new Error("Theme fetch timeout")),
                    TIMEOUT.THEME_FETCH
                );
            }),
            theme = await Promise.race([themePromise, timeoutPromise]);

        if (!isValidTheme(theme)) {
            logWithContext(
                `Invalid theme received: ${theme}, using default`,
                "warn"
            );
            return DEFAULT_THEME;
        }

        logWithContext(`Theme fetched from main process: ${theme}`);
        return theme;
    } catch (error) {
        logWithContext(
            `Failed to get theme from main process: ${/** @type {Error} */ (error).message}, using default`,
            "warn"
        );
        return DEFAULT_THEME;
    }
}

/**
 * Validates if a theme name is supported
 *
 * @private
 *
 * @param {string} theme - Theme name to validate
 *
 * @returns {boolean} True if theme is supported
 */
function isValidTheme(theme) {
    return normalizeThemeValue(theme) !== null;
}

/**
 * Logs messages with context for theme operations
 *
 * @private
 *
 * @param {string} message - The message to log
 * @param {string} level - Log level ('info', 'warn', 'error')
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
 * Normalize theme values to the canonical set.
 *
 * @param {unknown} theme
 *
 * @returns {string | null} Light | "dark" | "auto" when valid, otherwise null
 */
function normalizeThemeValue(theme) {
    if (typeof theme !== "string") {
        return null;
    }
    if (theme === "system") {
        return "auto";
    }
    return THEME_CONSTANTS.SUPPORTED_THEMES.includes(theme) ? theme : null;
}

/**
 * Sets up theme change listener with state integration
 *
 * @private
 *
 * @param {Function} applyTheme - Function to apply theme changes
 * @param {Function} listenForThemeChange - Function to register theme change
 *   listener
 */
function setupThemeChangeListener(applyTheme, listenForThemeChange) {
    try {
        if (typeof listenForThemeChange === "function") {
            // Set up external theme change listener
            listenForThemeChange(
                /** @param {any} newTheme */ (newTheme) => {
                    logWithContext(`Theme change received: ${newTheme}`);
                    applyAndTrackTheme(newTheme, applyTheme);
                }
            );
        }

        // Set up state-based theme change listener
        subscribe(
            "ui.theme",
            /** @param {any} newTheme */ (newTheme) => {
                if (newTheme && newTheme !== getState("ui.previousTheme")) {
                    logWithContext(`State-driven theme change: ${newTheme}`);
                    setState("ui.previousTheme", newTheme, {
                        source: "setupTheme",
                    });

                    if (typeof applyTheme === "function") {
                        applyTheme(newTheme);
                    }
                }
            }
        );

        logWithContext("Theme change listeners registered");
    } catch (error) {
        logWithContext(
            `Error setting up theme change listener: ${/** @type {Error} */ (error).message}`,
            "error"
        );
    }
}
