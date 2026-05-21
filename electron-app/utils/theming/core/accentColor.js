/**
 * Utilities for managing custom accent colors with automatic shade generation.
 */
const DEFAULT_ACCENT_COLORS = {
    dark: "#3b82f6",
    light: "#2563eb",
};
const ACCENT_COLOR_STORAGE_KEY = "ffv-accent-color";
/**
 * Applies accent color CSS variables to the document root and body.
 *
 * @param color - Accent color hex value.
 * @param theme - Current theme.
 */
export function applyAccentColor(color, theme) {
    if (typeof document === "undefined") {
        return;
    }
    const resolvedTheme = normalizeTheme(theme);
    let resolvedColor = color;
    if (!isValidHexColor(resolvedColor)) {
        console.warn("[AccentColor] Invalid color, using default");
        resolvedColor = getDefaultAccentColor(resolvedTheme);
    }
    const variations = generateAccentColorVariations(
        resolvedColor,
        resolvedTheme
    );
    for (const target of getAccentColorTargets()) {
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
        `[AccentColor] Applied accent color: ${resolvedColor} for ${resolvedTheme} theme`
    );
}
/**
 * Clears the custom accent color.
 *
 * @returns True when localStorage was updated.
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
 * Generates CSS variable values from a base accent color.
 *
 * @param baseColor - Base accent color hex value.
 * @param theme - Current theme.
 *
 * @returns Color variation map.
 */
export function generateAccentColorVariations(baseColor, theme) {
    const resolvedTheme = normalizeTheme(theme),
        resolvedBaseColor = isValidHexColor(baseColor)
            ? baseColor
            : getDefaultAccentColor(resolvedTheme),
        { b, g, r } = hexToRgb(resolvedBaseColor),
        isDark = resolvedTheme === "dark";
    return {
        accent: resolvedBaseColor,
        accentHover: `rgb(${r} ${g} ${b} / ${isDark ? "20%" : "15%"})`,
        accentRgb: `${r}, ${g}, ${b}`,
        accentSecondary: isDark
            ? darkenColor(resolvedBaseColor, 10)
            : darkenColor(resolvedBaseColor, 15),
        btnBg: `linear-gradient(135deg, ${resolvedBaseColor} 0%, ${darkenColor(resolvedBaseColor, 10)} 100%)`,
        btnBgSolid: resolvedBaseColor,
        btnHover: `linear-gradient(135deg, ${darkenColor(resolvedBaseColor, 10)} 0%, ${darkenColor(resolvedBaseColor, 20)} 100%)`,
        heroGlow: `rgb(${r} ${g} ${b} / ${isDark ? "28%" : "26%"})`,
        heroGlowStrong: `rgb(${r} ${g} ${b} / ${isDark ? "42%" : "32%"})`,
        info: `rgb(${r} ${g} ${b} / 35%)`,
        modalBg: isDark
            ? `linear-gradient(135deg, ${resolvedBaseColor} 0%, ${darkenColor(resolvedBaseColor, 10)} 100%)`
            : `linear-gradient(135deg, #fff 0%, ${lightenColor(resolvedBaseColor, 85)} 100%)`,
        svgIconStroke: isDark
            ? lightenColor(resolvedBaseColor, 30)
            : resolvedBaseColor,
    };
}
/**
 * Gets the default accent color for a theme.
 *
 * @param theme - Current theme.
 *
 * @returns Default accent color hex value.
 */
export function getDefaultAccentColor(theme) {
    return DEFAULT_ACCENT_COLORS[normalizeTheme(theme)];
}
/**
 * Gets the custom accent color or theme default.
 *
 * @param theme - Current theme.
 *
 * @returns Effective accent color hex value.
 */
export function getEffectiveAccentColor(theme) {
    return loadAccentColor() || getDefaultAccentColor(theme);
}
/**
 * Initializes accent color CSS variables for the current theme.
 *
 * @param theme - Current theme.
 *
 * @returns Applied accent color hex value.
 */
export function initializeAccentColor(theme) {
    const effectiveColor = getEffectiveAccentColor(theme);
    applyAccentColor(effectiveColor, theme);
    return effectiveColor;
}
/**
 * Checks whether a value is a six-digit hex color.
 *
 * @param color - Color candidate.
 *
 * @returns True when the value is a valid hex color.
 */
export function isValidHexColor(color) {
    return typeof color === "string" && /^#[\da-f]{6}$/i.test(color);
}
/**
 * Loads the custom accent color from localStorage.
 *
 * @returns Stored accent color, or null when absent or invalid.
 */
export function loadAccentColor() {
    try {
        const saved = localStorage.getItem(ACCENT_COLOR_STORAGE_KEY);
        if (isValidHexColor(saved)) {
            return saved;
        }
    } catch (error) {
        console.warn("[AccentColor] Failed to load accent color:", error);
    }
    return null;
}
/**
 * Resets the accent color to the current theme default.
 *
 * @param theme - Current theme.
 *
 * @returns Default accent color hex value.
 */
export function resetAccentColor(theme) {
    clearAccentColor();
    const defaultColor = getDefaultAccentColor(theme);
    applyAccentColor(defaultColor, theme);
    return defaultColor;
}
/**
 * Saves the custom accent color to localStorage.
 *
 * @param color - Hex color to save.
 *
 * @returns True when saved successfully.
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
 * Sets and applies a custom accent color.
 *
 * @param color - New accent color hex value.
 * @param theme - Current theme.
 *
 * @returns True when the value was saved and applied.
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
function darkenColor(hex, percent) {
    const { b, g, r } = hexToRgb(hex),
        amount = percent / 100,
        newR = r * (1 - amount),
        newG = g * (1 - amount),
        newB = b * (1 - amount);
    return rgbToHex(newR, newG, newB);
}
function getAccentColorTargets() {
    const targets = [];
    if (document.documentElement instanceof HTMLElement) {
        targets.push(document.documentElement);
    }
    if (document.body instanceof HTMLElement) {
        targets.push(document.body);
    }
    return targets;
}
function hexToRgb(hex) {
    const cleaned = hex.replace("#", ""),
        r = Number.parseInt(cleaned.slice(0, 2), 16),
        g = Number.parseInt(cleaned.slice(2, 4), 16),
        b = Number.parseInt(cleaned.slice(4, 6), 16);
    return { b, g, r };
}
function lightenColor(hex, percent) {
    const { b, g, r } = hexToRgb(hex),
        amount = (percent / 100) * 255,
        newR = r + (255 - r) * (amount / 255),
        newG = g + (255 - g) * (amount / 255),
        newB = b + (255 - b) * (amount / 255);
    return rgbToHex(newR, newG, newB);
}
function normalizeTheme(theme) {
    return theme === "light" ? "light" : "dark";
}
function rgbToHex(r, g, b) {
    const toHex = (value) => {
        const clamped = Math.max(0, Math.min(255, Math.round(value)));
        return clamped.toString(16).padStart(2, "0");
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
