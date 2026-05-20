/**
 * Gets current settings from settings state and DOM
 *
 * Retrieves all chart settings from the settings state manager with fallbacks
 * to default values. Handles type conversion and validation for different
 * setting types (select, toggle, range, colors).
 *
 * @returns Current settings object
 */
export function getCurrentSettings(): ChartSettings;
/**
 * Gets default settings object based on chart configuration
 *
 * Creates a settings object with all default values from the chart options
 * configuration and default field colors.
 *
 * @returns Default settings object
 */
export function getDefaultSettings(): ChartSettings;
/**
 * Re-renders charts after a setting change
 *
 * @param settingName - Name of the setting that changed
 * @param newValue - New value of the setting
 */
export function reRenderChartsAfterSettingChange(
    settingName: string,
    newValue: unknown
): void;
/**
 * Resets all chart settings to their default values
 *
 * Clears all chart-related settings from the settings state manager, resets UI
 * controls to default values, and re-renders charts with the default
 * configuration. Shows a success notification when complete.
 *
 * @returns True if reset was successful, false otherwise
 */
export function resetAllSettings(): boolean;
/**
 * Element that exposes the legacy chart settings reset hook.
 */
export type ResettableElement = HTMLElement & {
    _updateFromReset: () => void;
};
/**
 * Chart option configuration. Supported type values include select, toggle,
 * range, and legacy custom controls.
 */
export type ChartOptionConfig = {
    id: string;
    label: string;
    type: string;
    default: unknown;
    min?: number;
    max?: number;
};
/**
 * Map of chart field names to CSS color strings.
 */
export type FieldColorMap = Record<string, string>;
/**
 * Current chart settings keyed by chart option id, with colors grouped
 * separately by field name.
 */
export type ChartSettings = Record<string, unknown> & {
    colors: FieldColorMap;
};
