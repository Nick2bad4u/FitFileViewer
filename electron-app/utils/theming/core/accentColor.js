/**
 * Provides utilities for managing custom accent colors with automatic shade
 * generation
 *
 * @version 1.0.0
 *
 * @file Accent Color Management Module
 *
 * @author FitFileViewer Development Team
 */

/**
 * Default accent colors for dark and light themes
 *
 * @private
 */
const DEFAULT_ACCENT_COLORS = {
    dark: "#3b82f6", // blue-500
    light: "#2563eb", // blue-600
};

/**
 * Storage key for custom accent color
 */
const ACCENT_COLOR_STORAGE_KEY = "ffv-accent-color";

// ============================================================================
// Public API (Exported Functions)
// ============================================================================

/**
 * Applies accent color to CSS variables
 *
 * @param {string} color - Accent color hex
 * @param {string} theme - Current theme ('dark' or 'light')
 */
export function applyAccentColor(color, theme) {
    if (typeof document === "undefined") {
        return;
    }

    if (!isValidHexColor(color)) {
        console.warn("[AccentColor] Invalid color, using default");
        color = getDefaultAccentColor(theme);
    }

    const variations = generateAccentColorVariations(color, theme);

    // IMPORTANT:
    // - The stylesheet defines dark theme variables on :root, but light theme overrides many of the
    //   same variables on body.theme-light.
    // - CSS variables on a closer ancestor win. So applying overrides only on :root would NOT
    //   affect the light theme because body.theme-light redefines those variables.
    // - Therefore, we apply the accent overrides on BOTH :root and <body> (when available).
    /** @type {HTMLElement[]} */
    const targets = [];
    if (document.documentElement instanceof HTMLElement) {
        targets.push(document.documentElement);
    }
    if (document.body instanceof HTMLElement) {
        targets.push(document.body);
    }

    for (const target of targets) {
        target.style.setProperty("--color-accent", variations.accent);
        target.style.setProperty("--color-accent-rgb", variations.accentRgb);
        target.style.setProperty(
            "--color-accent-secondary",
            variations.accentSecondary
        );
        target.style.setProperty(
            "--color-accent-hover",
            variations.accentHover
        );
        target.style.setProperty("--color-btn-bg", variations.btnBg);
        target.style.setProperty("--color-btn-bg-solid", variations.btnBgSolid);
        target.style.setProperty("--color-btn-hover", variations.btnHover);
        target.style.setProperty("--color-hero-glow", variations.heroGlow);
        target.style.setProperty(
            "--color-hero-glow-strong",
            variations.heroGlowStrong
        );
        target.style.setProperty("--color-info", variations.info);
        target.style.setProperty("--color-modal-bg", variations.modalBg);
        target.style.setProperty(
            "--color-svg-icon-stroke",
            variations.svgIconStroke
        );
    }

    console.log(
        `[AccentColor] Applied accent color: ${color} for ${theme} theme`
    );
}

/**
 * Clears the custom accent color (revert to default)
 *
 * @returns {boolean} True if cleared successfully
 */
export function clearAccentColor() {
    try {
        localStorage.removeItem(ACCENT_COLOR_STORAGE_KEY);
        return true;
    } catch (error) {
        console.error("[AccentColor] Failed to clear accent color:", error);
        return false;
    }
}

/**
 * Generates color variations from a base accent color
 *
 * @param {string} baseColor - Base accent color hex
 * @param {string} theme - Current theme ('dark' or 'light')
 *
 * @returns {Object} Color variations object
 */
export function generateAccentColorVariations(baseColor, theme) {
    if (!isValidHexColor(baseColor)) {
        baseColor = getDefaultAccentColor(theme);
    }

    const { b, g, r } = hexToRgb(baseColor);
    const isDark = theme === "dark";

    return {
        // Primary accent
        accent: baseColor,
        accentRgb: `${r}, ${g}, ${b}`,

        // Secondary accent (slightly darker/lighter)
        accentSecondary: isDark
            ? darkenColor(baseColor, 10)
            : darkenColor(baseColor, 15),

        // Hover state (more transparent)
        accentHover: `rgb(${r} ${g} ${b} / ${isDark ? "20%" : "15%"})`,

        // Button backgrounds
        btnBg: `linear-gradient(135deg, ${baseColor} 0%, ${darkenColor(baseColor, 10)} 100%)`,
        btnBgSolid: baseColor,
        btnHover: `linear-gradient(135deg, ${darkenColor(baseColor, 10)} 0%, ${darkenColor(baseColor, 20)} 100%)`,

        // Hero glow effects
        heroGlow: `rgb(${r} ${g} ${b} / ${isDark ? "28%" : "26%"})`,
        heroGlowStrong: `rgb(${r} ${g} ${b} / ${isDark ? "42%" : "32%"})`,

        // Info color
        info: `rgb(${r} ${g} ${b} / 35%)`,

        // Modal background
        modalBg: isDark
            ? `linear-gradient(135deg, ${baseColor} 0%, ${darkenColor(baseColor, 10)} 100%)`
            : `linear-gradient(135deg, #fff 0%, ${lightenColor(baseColor, 85)} 100%)`,

        // SVG icon stroke
        svgIconStroke: isDark ? lightenColor(baseColor, 30) : baseColor,
    };
}

/**
 * Gets the default accent color for the current theme
 *
 * @param {string} theme - Current theme ('dark' or 'light')
 *
 * @returns {string} Default accent color hex
 */
export function getDefaultAccentColor(theme) {
    return theme === "light"
        ? DEFAULT_ACCENT_COLORS.light
        : DEFAULT_ACCENT_COLORS.dark;
}

/**
 * Gets the effective accent color (custom or default)
 *
 * @param {string} theme - Current theme ('dark' or 'light')
 *
 * @returns {string} Accent color hex
 */
export function getEffectiveAccentColor(theme) {
    const custom = loadAccentColor();
    return custom || getDefaultAccentColor(theme);
}

/**
 * Initializes accent color on page load
 *
 * @param {string} theme - Current theme ('dark' or 'light')
 *
 * @returns {string} The applied accent color
 */
export function initializeAccentColor(theme) {
    const effectiveColor = getEffectiveAccentColor(theme);
    applyAccentColor(effectiveColor, theme);
    return effectiveColor;
}

/**
 * Validates if a string is a valid hex color
 *
 * @param {string} color - Color string to validate
 *
 * @returns {boolean} True if valid hex color
 */
export function isValidHexColor(color) {
    if (typeof color !== "string") return false;
    return /^#[\da-f]{6}$/i.test(color);
}

/**
 * Loads the custom accent color from localStorage
 *
 * @returns {string | null} Custom accent color or null if not set
 */
export function loadAccentColor() {
    try {
        const saved = localStorage.getItem(ACCENT_COLOR_STORAGE_KEY);
        if (saved && isValidHexColor(saved)) {
            return saved;
        }
    } catch (error) {
        console.warn("[AccentColor] Failed to load accent color:", error);
    }
    return null;
}

/**
 * Resets accent color to theme default
 *
 * @param {string} theme - Current theme ('dark' or 'light')
 *
 * @returns {string} The default accent color
 */
export function resetAccentColor(theme) {
    clearAccentColor();
    const defaultColor = getDefaultAccentColor(theme);
    applyAccentColor(defaultColor, theme);
    return defaultColor;
}

/**
 * Saves the custom accent color to localStorage
 *
 * @param {string} color - Hex color to save
 *
 * @returns {boolean} True if saved successfully
 */
export function saveAccentColor(color) {
    if (!isValidHexColor(color)) {
        console.warn("[AccentColor] Invalid color format:", color);
        return false;
    }

    try {
        localStorage.setItem(ACCENT_COLOR_STORAGE_KEY, color);
        return true;
    } catch (error) {
        console.error("[AccentColor] Failed to save accent color:", error);
        return false;
    }
}

/**
 * Sets a new custom accent color
 *
 * @param {string} color - New accent color hex
 * @param {string} theme - Current theme ('dark' or 'light')
 *
 * @returns {boolean} True if set successfully
 */
export function setAccentColor(color, theme) {
    if (!isValidHexColor(color)) {
        console.warn("[AccentColor] Invalid color format");
        return false;
    }

    if (saveAccentColor(color)) {
        applyAccentColor(color, theme);
        return true;
    }

    return false;
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Darken a color by a percentage
 *
 * @private
 *
 * @param {string} hex - Hex color string
 * @param {number} percent - Percentage to darken (0-100)
 *
 * @returns {string} Darkened hex color
 */
function darkenColor(hex, percent) {
    const { b, g, r } = hexToRgb(hex);
    const amount = percent / 100;

    const newR = r * (1 - amount);
    const newG = g * (1 - amount);
    const newB = b * (1 - amount);

    return rgbToHex(newR, newG, newB);
}

/**
 * Converts hex color to RGB object
 *
 * @private
 *
 * @param {string} hex - Hex color string (e.g., "#3b82f6")
 *
 * @returns {{ r: number; g: number; b: number }} RGB object
 */
function hexToRgb(hex) {
    // Remove # if present
    const cleaned = hex.replace("#", "");

    // Parse RGB values
    const r = Number.parseInt(cleaned.slice(0, 2), 16);
    const g = Number.parseInt(cleaned.slice(2, 4), 16);
    const b = Number.parseInt(cleaned.slice(4, 6), 16);

    return { b, g, r };
}

/**
 * Lighten a color by a percentage
 *
 * @private
 *
 * @param {string} hex - Hex color string
 * @param {number} percent - Percentage to lighten (0-100)
 *
 * @returns {string} Lightened hex color
 */
function lightenColor(hex, percent) {
    const { b, g, r } = hexToRgb(hex);
    const amount = (percent / 100) * 255;

    const newR = r + (255 - r) * (amount / 255);
    const newG = g + (255 - g) * (amount / 255);
    const newB = b + (255 - b) * (amount / 255);

    return rgbToHex(newR, newG, newB);
}

/**
 * Converts RGB object to hex string
 *
 * @private
 *
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 *
 * @returns {string} Hex color string
 */
function rgbToHex(r, g, b) {
    const toHex = (/** @type {number} */ n) => {
        const clamped = Math.max(0, Math.min(255, Math.round(n)));
        return clamped.toString(16).padStart(2, "0");
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
