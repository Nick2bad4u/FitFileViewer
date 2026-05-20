/**
 * Theme names that influence accent color contrast calculations.
 */
export type AccentTheme = "dark" | "light";
/**
 * CSS variable values derived from a base accent color.
 */
export type AccentColorVariations = {
    accent: string;
    accentHover: string;
    accentRgb: string;
    accentSecondary: string;
    btnBg: string;
    btnBgSolid: string;
    btnHover: string;
    heroGlow: string;
    heroGlowStrong: string;
    info: string;
    modalBg: string;
    svgIconStroke: string;
};
/**
 * Applies accent color CSS variables to the document root and body.
 *
 * @param color - Accent color hex value.
 * @param theme - Current theme.
 */
export function applyAccentColor(color: string, theme: string): void;
/**
 * Clears the custom accent color.
 *
 * @returns True when localStorage was updated.
 */
export function clearAccentColor(): boolean;
/**
 * Generates CSS variable values from a base accent color.
 *
 * @param baseColor - Base accent color hex value.
 * @param theme - Current theme.
 * @returns Color variation map.
 */
export function generateAccentColorVariations(
    baseColor: string,
    theme: string
): AccentColorVariations;
/**
 * Gets the default accent color for a theme.
 *
 * @param theme - Current theme.
 * @returns Default accent color hex value.
 */
export function getDefaultAccentColor(theme: string): string;
/**
 * Gets the custom accent color or theme default.
 *
 * @param theme - Current theme.
 * @returns Effective accent color hex value.
 */
export function getEffectiveAccentColor(theme: string): string;
/**
 * Initializes accent color CSS variables for the current theme.
 *
 * @param theme - Current theme.
 * @returns Applied accent color hex value.
 */
export function initializeAccentColor(theme: string): string;
/**
 * Checks whether a value is a six-digit hex color.
 *
 * @param color - Color candidate.
 * @returns True when the value is a valid hex color.
 */
export function isValidHexColor(color: unknown): color is string;
/**
 * Loads the custom accent color from localStorage.
 *
 * @returns Stored accent color, or null when absent or invalid.
 */
export function loadAccentColor(): null | string;
/**
 * Resets the accent color to the current theme default.
 *
 * @param theme - Current theme.
 * @returns Default accent color hex value.
 */
export function resetAccentColor(theme: string): string;
/**
 * Saves the custom accent color to localStorage.
 *
 * @param color - Hex color to save.
 * @returns True when saved successfully.
 */
export function saveAccentColor(color: string): boolean;
/**
 * Sets and applies a custom accent color.
 *
 * @param color - New accent color hex value.
 * @param theme - Current theme.
 * @returns True when the value was saved and applied.
 */
export function setAccentColor(color: string, theme: string): boolean;
