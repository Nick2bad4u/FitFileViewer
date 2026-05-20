/** Install document/window listeners that keep map tiles synced to theme state. */
export function installUpdateMapThemeListeners(): void;
/** Remove listeners installed by installUpdateMapThemeListeners. */
export function uninstallUpdateMapThemeListeners(): void;
/**
 * Updates the Leaflet map theme based on the user's map theme preference.
 *
 * Applies dark theme inversion to tile panes when the user prefers dark maps,
 * regardless of UI theme.
 */
export function updateMapTheme(): void;
