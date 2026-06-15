/**
 * Theme setup utility for FitFileViewer Provides consistent theme
 * initialization and change handling with state management integration
 */

import {
    getRendererPreviousTheme,
    setRendererPreviousTheme,
    setRendererTheme,
    subscribeToRendererTheme,
} from "../../state/domain/rendererThemeState.js";
import { getRendererElectronApi } from "../../runtime/electronApiRuntime.js";
import {
    getSetupThemeRuntime,
    type SetupThemeTimer,
} from "./setupThemeRuntime.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";

/** Canonical persisted theme values understood by the theme setup flow. */
export type ThemePreference = "auto" | "dark" | "light";

/** Options that control theme setup fallback and persistence behavior. */
export type SetupThemeOptions = {
    /** Theme to apply when the main process and storage cannot provide one. */
    fallbackTheme?: string;
    /** Whether localStorage should be used for theme persistence. */
    useLocalStorage?: boolean;
};

type ApplyThemeCallback = (theme: string) => void;
type ListenForThemeChangeCallback = (
    callback: (theme: unknown) => void
) => void;
type LogLevel = "error" | "info" | "warn";
type ThemeSetupElectronApi = Partial<Pick<ElectronAPI, "getTheme">>;

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
    ] as const,
    TIMEOUT: {
        THEME_FETCH: 5000, // 5 seconds timeout for theme fetch
    },
} as const;

const setupThemeRuntime = getSetupThemeRuntime();

/**
 * Initializes theme state, applies the resolved theme, and registers theme
 * listeners.
 *
 * @param applyTheme - Function that applies the selected theme.
 * @param listenForThemeChange - Optional callback registration for external
 *   theme changes.
 * @param options - Fallback and persistence options.
 *
 * @returns Applied theme name.
 *
 * @throws TypeError when applyTheme is not a function.
 */
export async function setupTheme(
    applyTheme: ApplyThemeCallback,
    listenForThemeChange?: ListenForThemeChangeCallback,
    options: SetupThemeOptions = {}
): Promise<ThemePreference> {
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
                    `Failed to read from localStorage: ${getErrorMessage(storageError)}`,
                    "warn"
                );
            }
        }

        // Final fallback to config option
        if (!isValidTheme(theme)) {
            theme =
                normalizeThemeValue(config.fallbackTheme) ||
                THEME_CONSTANTS.DEFAULT_THEME;
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
            `Error during theme setup: ${getErrorMessage(error)}`,
            "error"
        );

        // Emergency fallback
        const emergencyTheme = THEME_CONSTANTS.DEFAULT_THEME;
        try {
            applyTheme(emergencyTheme);
            setRendererTheme(emergencyTheme, {
                source: "setupTheme-emergency",
            });
        } catch (emergencyError) {
            logWithContext(
                `Emergency theme application failed: ${getErrorMessage(emergencyError)}`,
                "error"
            );
        }

        return emergencyTheme;
    }
}

function applyAndTrackTheme(
    theme: unknown,
    applyTheme: ApplyThemeCallback
): void {
    try {
        const normalized = normalizeThemeValue(theme);
        let resolvedTheme: ThemePreference;

        if (normalized) {
            resolvedTheme = normalized;
        } else {
            logWithContext(`Invalid theme: ${theme}, using default`, "warn");
            resolvedTheme = THEME_CONSTANTS.DEFAULT_THEME;
        }

        // Apply the theme
        if (typeof applyTheme === "function") {
            applyTheme(resolvedTheme);
            logWithContext(`Theme applied: ${resolvedTheme}`);
        } else {
            logWithContext("Invalid applyTheme function provided", "error");
            return;
        }

        // Update state
        // - Theme core persists: "auto" | "dark" | "light"
        // - UI/state layer historically uses: "system" for auto
        const uiTheme = resolvedTheme === "auto" ? "system" : resolvedTheme;
        setRendererTheme(uiTheme, { source: "setupTheme" });

        // Store in localStorage for persistence
        try {
            localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, resolvedTheme);
            // Clean up legacy key if present (best effort)
            if (
                localStorage.getItem(THEME_CONSTANTS.LEGACY_STORAGE_KEY) !==
                null
            ) {
                localStorage.removeItem(THEME_CONSTANTS.LEGACY_STORAGE_KEY);
            }
        } catch (storageError) {
            logWithContext(
                `Failed to store theme in localStorage: ${getErrorMessage(storageError)}`,
                "warn"
            );
        }
    } catch (error) {
        logWithContext(
            `Error applying theme: ${getErrorMessage(error)}`,
            "error"
        );
    }
}

async function fetchThemeFromMainProcess(): Promise<ThemePreference> {
    const { DEFAULT_THEME, TIMEOUT } = THEME_CONSTANTS;
    const electronAPI = getRendererElectronApi(isThemeSetupElectronApi);

    if (!electronAPI?.getTheme) {
        logWithContext(
            "ElectronAPI getTheme not available, using default theme",
            "warn"
        );
        return DEFAULT_THEME;
    }

    try {
        let timeoutHandle: SetupThemeTimer | undefined;
        const themePromise = Promise.resolve(electronAPI.getTheme()),
            timeoutPromise = new Promise<never>((_, reject) => {
                timeoutHandle = setupThemeRuntime.setTimeout(
                    () => reject(new Error("Theme fetch timeout")),
                    TIMEOUT.THEME_FETCH
                );
            });
        let theme: unknown;

        try {
            theme = await Promise.race([themePromise, timeoutPromise]);
        } finally {
            if (timeoutHandle !== undefined) {
                setupThemeRuntime.clearTimeout(timeoutHandle);
            }
        }

        const normalizedTheme = normalizeThemeValue(theme);
        if (!normalizedTheme) {
            logWithContext(
                `Invalid theme received: ${theme}, using default`,
                "warn"
            );
            return DEFAULT_THEME;
        }

        logWithContext(`Theme fetched from main process: ${normalizedTheme}`);
        return normalizedTheme;
    } catch (error) {
        logWithContext(
            `Failed to get theme from main process: ${getErrorMessage(error)}, using default`,
            "warn"
        );
        return DEFAULT_THEME;
    }
}

function isThemeSetupElectronApi(
    value: unknown
): value is ThemeSetupElectronApi {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const getTheme = (value as Record<string, unknown>)["getTheme"];
    return getTheme === undefined || typeof getTheme === "function";
}

function isValidTheme(theme: unknown): theme is ThemePreference {
    return normalizeThemeValue(theme) !== null;
}

function logWithContext(message: string, level: LogLevel = "info"): void {
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
 * @param theme - Raw value from storage, state, or IPC.
 *
 * @returns Canonical theme value when supported.
 */
function normalizeThemeValue(theme: unknown): ThemePreference | null {
    if (typeof theme !== "string") {
        return null;
    }
    if (theme === "system") {
        return "auto";
    }
    return isSupportedThemePreference(theme) ? theme : null;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isSupportedThemePreference(theme: string): theme is ThemePreference {
    return THEME_CONSTANTS.SUPPORTED_THEMES.includes(theme as ThemePreference);
}

function setupThemeChangeListener(
    applyTheme: ApplyThemeCallback,
    listenForThemeChange: ListenForThemeChangeCallback
): void {
    try {
        if (typeof listenForThemeChange === "function") {
            // Set up external theme change listener
            listenForThemeChange((newTheme) => {
                logWithContext(`Theme change received: ${String(newTheme)}`);
                applyAndTrackTheme(newTheme, applyTheme);
            });
        }

        // Set up state-based theme change listener
        subscribeToRendererTheme((newTheme) => {
            if (
                typeof newTheme === "string" &&
                newTheme !== getRendererPreviousTheme()
            ) {
                logWithContext(`State-driven theme change: ${newTheme}`);
                setRendererPreviousTheme(newTheme, {
                    source: "setupTheme",
                });

                if (typeof applyTheme === "function") {
                    applyTheme(newTheme);
                }
            }
        });

        logWithContext("Theme change listeners registered");
    } catch (error) {
        logWithContext(
            `Error setting up theme change listener: ${getErrorMessage(error)}`,
            "error"
        );
    }
}
