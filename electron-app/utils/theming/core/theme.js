// Theme utility functions for theme switching and persistence

/**
 * Available theme modes
 */
export const THEME_MODES = {
    LIGHT: "light",
    DARK: "dark",
    AUTO: "auto",
};

/**
 * Theme transition class for smooth transitions
 */
const THEME_TRANSITION_CLASS = "theme-transitioning";

/**
 * Apply the given theme to the document body and persist it.
 * @param {string} theme - 'dark', 'light', or 'auto'
 * @param {boolean} withTransition - Whether to animate the theme change
 */
export function applyTheme(theme, withTransition = true) {
    // Add transition class for smooth theme changes
    if (withTransition) {
        document.body.classList.add(THEME_TRANSITION_CLASS);
    }

    // Remove existing theme classes
    document.body.classList.remove("theme-dark", "theme-light");

    // Handle auto theme
    if (theme === THEME_MODES.AUTO) {
        const systemTheme = getSystemTheme();
        document.body.classList.add(`theme-${systemTheme}`);
    } else {
        document.body.classList.add(`theme-${theme}`);
    }

    // Persist theme preference
    try {
        localStorage.setItem("ffv-theme", theme);

        // Notify other components of theme change
        dispatchThemeChangeEvent(theme);

        // Update meta theme-color for mobile browsers
        updateMetaThemeColor(theme);
    } catch (error) {
        console.error("Failed to persist theme to localStorage:", error);
    }

    // Remove transition class after animation completes
    if (withTransition) {
        setTimeout(function () {
            document.body.classList.remove(THEME_TRANSITION_CLASS);
        }, 300);
    }

    console.log("[Theme] Applying theme:", theme);
}

/**
 * Get the system's preferred color scheme
 * @returns {string} 'dark' or 'light'
 */
export function getSystemTheme() {
    if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark"; // fallback
}

/**
 * Get the effective theme (resolves 'auto' to actual theme)
 * @param {string} theme - The theme preference
 * @returns {string} 'dark' or 'light'
 */
export function getEffectiveTheme(theme = null) {
    const currentTheme = theme || loadTheme();
    return currentTheme === THEME_MODES.AUTO ? getSystemTheme() : currentTheme;
}

/**
 * Load the persisted theme from localStorage, defaulting to 'dark'.
 * @returns {string}
 */
export function loadTheme() {
    try {
        return localStorage.getItem("ffv-theme") || "dark";
    } catch (error) {
        console.error("Error loading theme from localStorage:", error);
        return "dark";
    }
}

/**
 * Toggle between light and dark themes
 * @param {boolean} withTransition - Whether to animate the theme change
 */
export function toggleTheme(withTransition = true) {
    const currentTheme = loadTheme();
    const effectiveTheme = getEffectiveTheme(currentTheme);
    const newTheme = effectiveTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme, withTransition);
}

/**
 * Listen for theme change events from the Electron main process and apply the theme.
 * @param {(theme: string) => void} onThemeChange
 */
export function listenForThemeChange(onThemeChange) {
    if (
        window.electronAPI &&
        typeof window.electronAPI.onSetTheme === "function" &&
        typeof window.electronAPI.sendThemeChanged === "function"
    ) {
        // The callback receives a 'theme' parameter, which is expected to be a string ('dark' or 'light').
        window.electronAPI.onSetTheme((theme) => {
            onThemeChange(theme);
            if (typeof window.electronAPI.sendThemeChanged === "function") {
                window.electronAPI.sendThemeChanged(theme);
            } else {
                console.warn("sendThemeChanged method is not available on electronAPI.");
            }
        });
    } else {
        console.warn("Electron API is not available. Theme change listener is not active.");
    }
}

/**
 * Listen for system theme changes and update if using auto theme
 */
export function listenForSystemThemeChange() {
    if (typeof window !== "undefined" && window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleSystemThemeChange = () => {
            const currentTheme = loadTheme();
            if (currentTheme === THEME_MODES.AUTO) {
                applyTheme(THEME_MODES.AUTO, true);
            }
        };

        // Use the newer addEventListener if available, fallback to addListener
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleSystemThemeChange);
        } else {
            mediaQuery.addListener(handleSystemThemeChange);
        }

        // Return cleanup function
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener("change", handleSystemThemeChange);
            } else {
                mediaQuery.removeListener(handleSystemThemeChange);
            }
        };
    }
}

/**
 * Dispatch a custom theme change event
 * @param {string} theme - The new theme
 */
function dispatchThemeChangeEvent(theme) {
    const event = new CustomEvent("themechange", {
        detail: { theme, effectiveTheme: getEffectiveTheme(theme) },
    });
    document.dispatchEvent(event);
}

/**
 * Update the meta theme-color tag for mobile browsers
 * @param {string} theme - The theme to update for
 */
function updateMetaThemeColor(theme) {
    const effectiveTheme = getEffectiveTheme(theme);
    let themeColor = effectiveTheme === "dark" ? "#181a20" : "#f8fafc";

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement("meta");
        metaThemeColor.name = "theme-color";
        document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;
}

/**
 * Initialize theme system
 */
export function initializeTheme() {
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
 * Inject CSS for smooth theme transitions
 */
function injectThemeTransitionCSS() {
    if (document.getElementById("theme-transition-styles")) return;

    const style = document.createElement("style");
    style.id = "theme-transition-styles";
    style.textContent = `
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
	`;
    document.head.appendChild(style);
}

/**
 * Get theme preference for external libraries
 * @returns {Object} Theme configuration object
 */
export function getThemeConfig() {
    const effectiveTheme = getEffectiveTheme();

    // Map CSS variable names to JS color keys for both dark and light themes
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

    // Helper to get CSS variable value
    const getVar = (name) => getComputedStyle(document.body).getPropertyValue(`--${name}`)?.trim();

    // Build color map from CSS variables
    const cssColors = {};
    cssVars.forEach((key) => {
        cssColors[key.replace(/^color-/, "")] = getVar(key);
    });

    return {
        theme: effectiveTheme,
        isDark: effectiveTheme === "dark",
        isLight: effectiveTheme === "light",
        colors: {
            // Core palette (from CSS variables)
            ...cssColors,
            // Legacy/explicit keys for compatibility
            primary: effectiveTheme === "dark" ? "#667eea" : "#3b82f665",
            primaryAlpha: effectiveTheme === "dark" ? "#667eea80" : "#3b82f665",
            background: cssColors.bg || (effectiveTheme === "dark" ? "#181a20" : "#f8fafc"),
            backgroundAlt: cssColors.bgAlt || (effectiveTheme === "dark" ? "#23263a" : "#ffffff"),
            surface: effectiveTheme === "dark" ? "#2d2d2d50" : "#f8f9fa",
            surfaceSecondary: effectiveTheme === "dark" ? "#4a5568" : "#e9ecef",
            text: cssColors.fg || (effectiveTheme === "dark" ? "#e0e0e0" : "#1e293b"),
            textPrimary: effectiveTheme === "dark" ? "#ffffff" : "#0f172a",
            textSecondary: effectiveTheme === "dark" ? "#a0a0a0" : "#6b7280",
            border: cssColors.border || (effectiveTheme === "dark" ? "#404040" : "#e5e7eb"),
            borderLight: cssColors.borderLight || (effectiveTheme === "dark" ? "#fff33" : "rgba(0, 0, 0, 0.05)"),
            accent: cssColors.accent || (effectiveTheme === "dark" ? "#667eea" : "#3b82f665"),
            accentHover: cssColors.accentHover || (effectiveTheme === "dark" ? "#667eea33" : "#3b82f633"),
            shadow: cssColors.shadow || (effectiveTheme === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"),
            shadowLight:
                cssColors.boxShadowLight || (effectiveTheme === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)"),
            shadowMedium: effectiveTheme === "dark" ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.1)",
            shadowHeavy: effectiveTheme === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.15)",
            primaryShadow: effectiveTheme === "dark" ? "#3b82f64d" : "#2563eb4d",
            primaryShadowLight: effectiveTheme === "dark" ? "#3b82f61a" : "#2563eb0d",
            primaryShadowHeavy: effectiveTheme === "dark" ? "#3b82f680" : "#2563eb33",
            error: cssColors.error || "#ef4444",
            success: cssColors.success || "#10b981",
            warning: cssColors.warning || "#f59e0b",
            info: cssColors.info || "#3b82f665",
            // Chart-specific colors
            chartBackground: effectiveTheme === "dark" ? "#181c24" : "#ffffff",
            chartSurface: effectiveTheme === "dark" ? "#222" : "#fff",
            chartBorder: effectiveTheme === "dark" ? "#555" : "#ddd",
            chartGrid: effectiveTheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
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
        },
    };
}
