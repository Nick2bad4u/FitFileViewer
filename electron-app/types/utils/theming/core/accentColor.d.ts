/**
 * Applies accent color to CSS variables
 * @param {string} color - Accent color hex
 * @param {string} theme - Current theme ('dark' or 'light')
 */
export function applyAccentColor(color: string, theme: string): void;
/**
 * Clears the custom accent color (revert to default)
 * @returns {boolean} True if cleared successfully
 */
export function clearAccentColor(): boolean;
/**
 * Generates color variations from a base accent color
 * @param {string} baseColor - Base accent color hex
 * @param {string} theme - Current theme ('dark' or 'light')
 * @returns {Object} Color variations object
 */
export function generateAccentColorVariations(baseColor: string, theme: string): Object;
/**
 * Gets the default accent color for the current theme
 * @param {string} theme - Current theme ('dark' or 'light')
 * @returns {string} Default accent color hex
 */
export function getDefaultAccentColor(theme: string): string;
/**
 * Gets the effective accent color (custom or default)
 * @param {string} theme - Current theme ('dark' or 'light')
 * @returns {string} Accent color hex
 */
export function getEffectiveAccentColor(theme: string): string;
/**
 * Initializes accent color on page load
 * @param {string} theme - Current theme ('dark' or 'light')
 * @returns {string} The applied accent color
 */
export function initializeAccentColor(theme: string): string;
/**
 * Validates if a string is a valid hex color
 * @param {string} color - Color string to validate
 * @returns {boolean} True if valid hex color
 */
export function isValidHexColor(color: string): boolean;
/**
 * Loads the custom accent color from localStorage
 * @returns {string|null} Custom accent color or null if not set
 */
export function loadAccentColor(): string | null;
/**
 * Resets accent color to theme default
 * @param {string} theme - Current theme ('dark' or 'light')
 * @returns {string} The default accent color
 */
export function resetAccentColor(theme: string): string;
/**
 * Saves the custom accent color to localStorage
 * @param {string} color - Hex color to save
 * @returns {boolean} True if saved successfully
 */
export function saveAccentColor(color: string): boolean;
/**
 * Sets a new custom accent color
 * @param {string} color - New accent color hex
 * @param {string} theme - Current theme ('dark' or 'light')
 * @returns {boolean} True if set successfully
 */
export function setAccentColor(color: string, theme: string): boolean;
//# sourceMappingURL=accentColor.d.ts.map