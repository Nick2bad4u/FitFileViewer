/**
 * Creates a map theme toggle button for controlling map inversion
 *
 * @returns {HTMLElement} The configured map theme toggle button
 */
export function createMapThemeToggle(): HTMLElement;
/**
 * Gets the current map theme preference
 *
 * @returns {boolean} True if map should use dark theme, false for light theme
 */
export function getMapThemeInverted(): boolean;
/**
 * Sets the map theme preference
 *
 * @param {boolean} inverted - Whether map should use dark theme (true) or light
 *   theme (false)
 */
export function setMapThemeInverted(inverted: boolean): void;
export namespace MAP_THEME_EVENTS {
    let CHANGED: string;
}
export const MAP_THEME_STORAGE_KEY: "ffv-map-theme-inverted";
