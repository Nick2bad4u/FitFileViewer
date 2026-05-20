/** Creates a map theme toggle button for controlling map inversion. */
export function createMapThemeToggle(): HTMLElement;
/** Gets whether the map should currently use the dark inverted theme. */
export function getMapThemeInverted(): boolean;
/** Sets whether the map should use the dark inverted theme. */
export function setMapThemeInverted(inverted: boolean): void;
/** Custom map theme event names emitted by the map theme toggle. */
export const MAP_THEME_EVENTS: {
    readonly CHANGED: "mapThemeChanged";
};
/** Local storage key used for the map theme preference. */
export const MAP_THEME_STORAGE_KEY: "ffv-map-theme-inverted";
