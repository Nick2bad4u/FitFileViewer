import { initializeAccentColor } from "./accentColor.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import {
    getThemeRuntime,
    type ThemeRuntime,
    type ThemeRuntimeTimer,
} from "./themeRuntime.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";

/**
 * Known chart/theme color values exposed by the theme core.
 */
export type ThemeColorValue = readonly string[] | string;

/**
 * Theme color map exposed by `getThemeConfig`.
 */
export type ThemeColorMap = Record<string, ThemeColorValue>;

/**
 * Resolved app theme after applying stored and system preferences.
 */
export type EffectiveTheme = "dark" | "light";

/**
 * Canonical persisted app theme preference.
 */
export type ThemePreference = "auto" | EffectiveTheme;

/**
 * Theme configuration exposed to charts and UI helpers.
 */
export interface ThemeConfig {
    colors: ThemeColorMap;
    isDark: boolean;
    isLight: boolean;
    theme: EffectiveTheme;
}

type RendererThemeApi = Partial<
    Pick<ElectronAPI, "onSetTheme" | "sendThemeChanged">
>;
type ListenForThemeChangeOptions = {
    readonly electronApiScope?: RendererElectronApiScope | undefined;
};

interface ThemeChangeEventDetail {
    readonly effectiveTheme: EffectiveTheme;
    readonly theme: ThemePreference;
}

/**
 * Available theme modes
 */
export const THEME_MODES = {
    AUTO: "auto",
    DARK: "dark",
    LIGHT: "light",
} as const;

/**
 * Canonical localStorage key for persisted theme. Many modules (main process
 * IPC, charts, etc.) assume this key.
 */
const THEME_STORAGE_KEY = "ffv-theme";

/**
 * Legacy theme storage keys found in older state-manager implementations. We
 * migrate these to {@link THEME_STORAGE_KEY} when discovered.
 */
const LEGACY_THEME_STORAGE_KEYS = ["fitFileViewer_theme"];

/**
 * Normalize a theme preference value.
 *
 * The codebase historically used both "auto" and "system" for the system theme.
 * For persistence and theme core logic we canonicalize to "auto".
 */
function normalizeThemePreference(
    theme: null | string | undefined
): ThemePreference {
    if (theme === "system") {
        return THEME_MODES.AUTO;
    }
    if (
        theme === THEME_MODES.AUTO ||
        theme === THEME_MODES.DARK ||
        theme === THEME_MODES.LIGHT
    ) {
        return theme;
    }
    return THEME_MODES.DARK;
}

/**
 * Theme transition class for smooth transitions
 */
const THEME_TRANSITION_CLASS = "theme-transitioning";
function themeRuntime(): ThemeRuntime {
    return getThemeRuntime();
}
const themeTransitionTimers = new Set<ThemeRuntimeTimer>();

/**
 * Apply the given theme to the document body and persist it.
 */
export function applyTheme(theme: string, withTransition = true): void {
    const themePreference = normalizeThemePreference(theme);

    // Add transition class for smooth theme changes
    if (withTransition) {
        themeRuntime().addBodyClass(THEME_TRANSITION_CLASS);
    }

    // Remove existing theme classes
    themeRuntime().removeBodyClasses("theme-dark", "theme-light");

    // Handle auto theme
    if (themePreference === THEME_MODES.AUTO) {
        const systemTheme = getSystemTheme();
        themeRuntime().addBodyClass(`theme-${systemTheme}`);
        try {
            themeRuntime().setThemeDataAttributes(systemTheme);
        } catch {
            /* Ignore dataset errors */
        }
    } else {
        themeRuntime().addBodyClass(`theme-${themePreference}`);
        try {
            themeRuntime().setThemeDataAttributes(themePreference);
        } catch {
            /* Ignore dataset errors */
        }
    }

    // Persist theme preference
    try {
        themeRuntime().setStorageItem(THEME_STORAGE_KEY, themePreference);

        // If legacy keys exist, migrate them away to avoid future mismatches.
        for (const legacyKey of LEGACY_THEME_STORAGE_KEYS) {
            try {
                if (themeRuntime().getStorageItem(legacyKey) !== null) {
                    themeRuntime().removeStorageItem(legacyKey);
                }
            } catch {
                // Ignore legacy cleanup failures
            }
        }

        // Apply accent color for the current theme
        const effectiveTheme = getEffectiveTheme(themePreference);
        initializeAccentColor(effectiveTheme);

        // Notify other components of theme change
        dispatchThemeChangeEvent(themePreference);

        // Update meta theme-color for mobile browsers
        updateMetaThemeColor(themePreference);
    } catch (error) {
        console.error("Failed to persist theme to localStorage:", error);
    }

    // Remove transition class after animation completes
    if (withTransition) {
        const transitionTimer = themeRuntime().setTimeout(() => {
            themeTransitionTimers.delete(transitionTimer);
            themeRuntime().removeBodyClasses(THEME_TRANSITION_CLASS);
        }, 300);
        themeTransitionTimers.add(transitionTimer);
    }

    console.log("[Theme] Applying theme:", themePreference);
}

/**
 * Get the effective theme (resolves 'auto' to actual theme)
 */
export function getEffectiveTheme(theme: null | string = null): EffectiveTheme {
    const currentTheme = normalizeThemePreference(theme || loadTheme());
    return currentTheme === THEME_MODES.AUTO ? getSystemTheme() : currentTheme;
}

/**
 * Get the system's preferred color scheme
 */
export function getSystemTheme(): EffectiveTheme {
    const mediaQuery = themeRuntime().getSystemThemeMediaQuery();
    if (!mediaQuery) {
        return "dark";
    }

    return mediaQuery.matches ? "dark" : "light";
}

/**
 * Get theme preference for external libraries
 */
export function getThemeConfig(): ThemeConfig {
    const cssColors: Record<string, string> = {};
    const cssVars = [
        // Backgrounds
        "color-bg",
        "color-bg-solid",
        "color-bg-alt",
        "color-bg-alt-solid",
        // Foregrounds
        "color-fg",
        "color-fg-alt",
        // Accents
        "color-accent",
        "color-accent-secondary",
        "color-accent-hover",
        // Shadows
        "color-shadow",
        "color-box-shadow",
        "color-box-shadow-light",
        // Headers, tables, titles
        "color-header",
        "color-table-header",
        "color-table-row-even",
        "color-table-row-odd",
        "color-table-hover",
        "color-title",
        // Borders
        "color-border",
        "color-border-light",
        "color-glass-border",
        // Buttons, modals
        "color-btn-bg",
        "color-btn-bg-solid",
        "color-btn-hover",
        "color-modal-bg",
        "color-modal-fg",
        // Misc
        "color-svg-icon-stroke",
        "color-credits",
        "color-filename",
        "color-glass",
        "color-overlay-bg",
        // Status
        "color-error",
        "color-success",
        "color-warning",
        "color-info",
        // Effects
        "backdrop-blur",
        "border-radius",
        "border-radius-small",
        "transition-smooth",
        "transition-bounce",
    ];
    const getCssColor = (key: string): string => cssColors[key] ?? "";
    const effectiveTheme = getEffectiveTheme();
    const getVar = (name: string): string => {
        try {
            return themeRuntime().getBodyComputedStyleProperty(name);
        } catch {
            return "";
        }
    };
    for (const key of cssVars) {
        cssColors[key.replace(/^color-/, "")] = getVar(key);
    }

    return {
        colors: {
            // Core palette (from CSS variables)
            ...cssColors,
            accent:
                getCssColor("accent") ||
                (effectiveTheme === "dark" ? "#667eea" : "#3b82f665"),
            accentHover:
                getCssColor("accentHover") ||
                (effectiveTheme === "dark" ? "#667eea33" : "#3b82f633"),
            background:
                getCssColor("bg") ||
                (effectiveTheme === "dark" ? "#181a20" : "#f8fafc"),
            backgroundAlt:
                getCssColor("bgAlt") ||
                (effectiveTheme === "dark" ? "#23263a" : "#ffffff"),
            border:
                getCssColor("border") ||
                (effectiveTheme === "dark" ? "#404040" : "#e5e7eb"),
            borderLight:
                getCssColor("borderLight") ||
                (effectiveTheme === "dark" ? "#fff33" : "rgba(0, 0, 0, 0.05)"),
            // Chart-specific colors
            chartBackground: effectiveTheme === "dark" ? "#181c24" : "#ffffff",
            chartBorder: effectiveTheme === "dark" ? "#555" : "#ddd",
            chartGrid:
                effectiveTheme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
            chartSurface: effectiveTheme === "dark" ? "#222" : "#fff",
            error: getCssColor("error") || "#ef4444",
            // Heart rate zone colors
            heartRateZoneColors: [
                "#808080", // Zone 1 - Gray (Active Recovery)
                "#3b82f665", // Zone 2 - Blue (Endurance)
                "#10B981", // Zone 3 - Green (Tempo)
                "#F59E0B", // Zone 4 - Yellow (Lactate Threshold)
                "#FF6600", // Zone 5 - Orange (VO2 Max)
                "#EF4444", // Zone 6 - Red (Anaerobic Capacity)
                "#FF00FF", // Zone 7 - Magenta (Neuromuscular Power)
                "#00FFFF", // Zone 8 - Cyan (Sprint)
                "#FF1493", // Zone 9 - Deep Pink (Maximal Effort)
                "#FF4500", // Zone 10 - Orange Red (Extreme Effort)
                "#FFD700", // Zone 11 - Gold (Peak Heart Rate)
                "#32CD32", // Zone 12 - Lime Green (Explosive Power)
                "#8A2BE2", // Zone 13 - Blue Violet (Maximal Heart Rate)
                "#000000", // Zone 14 - Black (Ultimate Effort)
            ],
            info: getCssColor("info") || "#3b82f665",
            // Power zone colors
            powerZoneColors: [
                "#808080", // Zone 1 - Gray (recovery)
                "#3b82f665", // Zone 2 - Blue (aerobic base)
                "#10B981", // Zone 3 - Green (aerobic)
                "#F59E0B", // Zone 4 - Yellow (threshold)
                "#EF4444", // Zone 5 - Red (anaerobic)
                "#FF6600", // Zone 6 - Orange (VO2 Max)
                "#FF00FF", // Zone 7 - Magenta (neuromuscular)
                "#00FFFF", // Zone 8 - Cyan (sprint)
                "#FF1493", // Zone 9 - Deep Pink (max effort)
                "#FF4500", // Zone 10 - Orange Red (extreme effort)
                "#FFD700", // Zone 11 - Gold (peak power)
                "#32CD32", // Zone 12 - Lime Green (explosive power)
                "#8A2BE2", // Zone 13 - Blue Violet (maximal effort)
                "#000000", // Zone 14 - Black (ultimate effort)
            ],
            // Legacy/explicit keys for compatibility
            primary: effectiveTheme === "dark" ? "#667eea" : "#3b82f665",
            primaryAlpha: effectiveTheme === "dark" ? "#667eea80" : "#3b82f665",
            primaryShadow:
                effectiveTheme === "dark" ? "#3b82f64d" : "#2563eb4d",
            primaryShadowHeavy:
                effectiveTheme === "dark" ? "#3b82f680" : "#2563eb33",
            primaryShadowLight:
                effectiveTheme === "dark" ? "#3b82f61a" : "#2563eb0d",
            shadow:
                getCssColor("shadow") ||
                (effectiveTheme === "dark"
                    ? "rgba(0, 0, 0, 0.3)"
                    : "rgba(0, 0, 0, 0.15)"),
            shadowHeavy:
                effectiveTheme === "dark"
                    ? "rgba(0, 0, 0, 0.5)"
                    : "rgba(0, 0, 0, 0.15)",
            shadowLight:
                getCssColor("boxShadowLight") ||
                (effectiveTheme === "dark"
                    ? "rgba(0, 0, 0, 0.2)"
                    : "rgba(0, 0, 0, 0.05)"),
            shadowMedium:
                effectiveTheme === "dark"
                    ? "rgba(0, 0, 0, 0.4)"
                    : "rgba(0, 0, 0, 0.1)",
            success: getCssColor("success") || "#10b981",
            surface: effectiveTheme === "dark" ? "#2d2d2d50" : "#f8f9fa",
            surfaceSecondary: effectiveTheme === "dark" ? "#4a5568" : "#e9ecef",
            text:
                getCssColor("fg") ||
                (effectiveTheme === "dark" ? "#e0e0e0" : "#1e293b"),
            textPrimary: effectiveTheme === "dark" ? "#ffffff" : "#0f172a",
            textSecondary: effectiveTheme === "dark" ? "#a0a0a0" : "#6b7280",
            warning: getCssColor("warning") || "#f59e0b",
            // Zone colors (consistent across themes)
            zoneColors: [
                "#808080", // Zone 1 - Gray
                "#3b82f665", // Zone 2 - Blue
                "#10B981", // Zone 3 - Green
                "#F59E0B", // Zone 4 - Yellow
                "#EF4444", // Zone 5 - Red
                "#FF6600", // Zone 6 - Orange
                "#FF00FF", // Zone 7 - Magenta
                "#00FFFF", // Zone 8 - Cyan
                "#FF1493", // Zone 9 - Deep Pink
                "#FF4500", // Zone 10 - Orange Red
                "#FFD700", // Zone 11 - Gold
                "#32CD32", // Zone 12 - Lime Green
                "#8A2BE2", // Zone 13 - Blue Violet
                "#000000", // Zone 14 - Black
            ],
        },
        isDark: effectiveTheme === "dark",
        isLight: effectiveTheme === "light",
        theme: effectiveTheme,
    };
}

/**
 * Initialize theme system
 */
export function initializeTheme(): (() => void) | undefined {
    // Load and apply saved theme
    const savedTheme = loadTheme();
    applyTheme(savedTheme, false);

    // Set up system theme change listener
    const cleanup = listenForSystemThemeChange();

    // Add CSS for smooth transitions
    injectThemeTransitionCSS();

    return cleanup;
}

/**
 * Listen for system theme changes and update if using auto theme
 */
export function listenForSystemThemeChange(): (() => void) | undefined {
    const mediaQuery = themeRuntime().getSystemThemeMediaQuery();
    if (mediaQuery) {
        const listenerController = themeRuntime().createAbortController(),
            handleSystemThemeChange = () => {
                const currentTheme = loadTheme();
                if (currentTheme === THEME_MODES.AUTO) {
                    applyTheme(THEME_MODES.AUTO, true);
                }
            };

        // Use the newer addEventListener if available, fallback to addListener
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleSystemThemeChange, {
                signal: listenerController.signal,
            });
        } else {
            mediaQuery.addListener(handleSystemThemeChange);
        }

        // Return cleanup function
        return () => {
            listenerController.abort();
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener(
                    "change",
                    handleSystemThemeChange
                );
            } else {
                mediaQuery.removeListener(handleSystemThemeChange);
            }
        };
    }

    // Return undefined if matchMedia is not available
    return undefined;
}

/**
 * Listen for theme change events from the Electron main process and apply the
 * theme.
 */
export function listenForThemeChange(
    onThemeChange: (theme: string) => void,
    { electronApiScope }: ListenForThemeChangeOptions = {}
): void {
    const electronAPI = getRendererElectronApi(
        isRendererThemeApi,
        electronApiScope
    );
    if (
        electronAPI &&
        typeof electronAPI.onSetTheme === "function" &&
        typeof electronAPI.sendThemeChanged === "function"
    ) {
        // The callback receives a 'theme' parameter, which is expected to be a string ('dark' or 'light').
        electronAPI.onSetTheme((theme) => {
            onThemeChange(theme);
            if (typeof electronAPI.sendThemeChanged === "function") {
                electronAPI.sendThemeChanged(theme);
            } else {
                console.warn(
                    "sendThemeChanged method is not available on electronAPI."
                );
            }
        });
    } else {
        console.warn(
            "Electron API is not available. Theme change listener is not active."
        );
    }
}

function isRendererThemeApi(value: unknown): value is RendererThemeApi {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as Record<string, unknown>;
    const onSetTheme = api["onSetTheme"];
    const sendThemeChanged = api["sendThemeChanged"];
    return (
        (onSetTheme === undefined || typeof onSetTheme === "function") &&
        (sendThemeChanged === undefined ||
            typeof sendThemeChanged === "function")
    );
}

/**
 * Load the persisted theme from localStorage, defaulting to 'dark'.
 */
export function loadTheme(): ThemePreference {
    try {
        const current = themeRuntime().getStorageItem(THEME_STORAGE_KEY);
        if (current) {
            return normalizeThemePreference(current);
        }

        // Legacy migration: if an older key exists, migrate it into the canonical key.
        for (const legacyKey of LEGACY_THEME_STORAGE_KEYS) {
            const legacyValue = themeRuntime().getStorageItem(legacyKey);
            if (legacyValue) {
                const normalized = normalizeThemePreference(legacyValue);
                themeRuntime().setStorageItem(THEME_STORAGE_KEY, normalized);
                try {
                    themeRuntime().removeStorageItem(legacyKey);
                } catch {
                    /* ignore */
                }
                return normalized;
            }
        }

        return THEME_MODES.DARK;
    } catch (error) {
        console.error("Error loading theme from localStorage:", error);
        return THEME_MODES.DARK;
    }
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(withTransition = true): void {
    const currentTheme = loadTheme(),
        effectiveTheme = getEffectiveTheme(currentTheme),
        newTheme = effectiveTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme, withTransition);
}

/**
 * Dispatch a custom theme change event
 */
function dispatchThemeChangeEvent(theme: ThemePreference): void {
    const detail: ThemeChangeEventDetail = {
            effectiveTheme: getEffectiveTheme(theme),
            theme,
        },
        targets: EventTarget[] = [];

    const documentEventTarget = themeRuntime().getDocumentEventTarget();
    if (documentEventTarget) {
        targets.push(documentEventTarget);
    }

    const bodyElement = themeRuntime().getBodyElement();
    if (bodyElement) {
        targets.push(bodyElement);
    }

    const globalEventTarget = themeRuntime().getGlobalEventTarget();
    if (globalEventTarget) {
        targets.push(globalEventTarget);
    }

    for (const target of targets) {
        try {
            const event = themeRuntime().createThemeChangeEvent(detail);
            target.dispatchEvent(event);
        } catch (error) {
            console.warn("[Theme] Failed to dispatch themechange event", error);
        }
    }
}

/**
 * Inject CSS for smooth theme transitions
 */
function injectThemeTransitionCSS(): void {
    themeRuntime().ensureThemeTransitionStyles(`
		.theme-transitioning *,
		.theme-transitioning *::before,
		.theme-transitioning *::after {
			transition: background-color 0.3s ease-in-out,
						color 0.3s ease-in-out,
						border-color 0.3s ease-in-out,
						box-shadow 0.3s ease-in-out !important;
		}

		/* Disable transitions for certain elements to avoid conflicts */
		.theme-transitioning .leaflet-map-pane,
		.theme-transitioning canvas,
		.theme-transitioning video,
		.theme-transitioning iframe {
			transition: none !important;
		}
	`);
}

/**
 * Update the meta theme-color tag for mobile browsers
 */
function updateMetaThemeColor(theme: ThemePreference): void {
    const effectiveTheme = getEffectiveTheme(theme),
        themeColor = effectiveTheme === "dark" ? "#181a20" : "#f8fafc";

    themeRuntime().updateMetaThemeColor(themeColor);
}

/**
 * Legacy aggregated theme API for compatibility with modules expecting a
 * namespace export. Provides direct access to the primary theme helpers via an
 * object reference.
 */
export const theme = {
    THEME_MODES,
    applyTheme,
    getEffectiveTheme,
    getSystemTheme,
    getThemeConfig,
    initializeTheme,
    listenForSystemThemeChange,
    listenForThemeChange,
    loadTheme,
    toggleTheme,
};
