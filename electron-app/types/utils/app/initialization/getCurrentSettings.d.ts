/**
 * @typedef {Object} ChartOptionConfig
 * @property {string} id
 * @property {string} label
 * @property {string} type - select|toggle|range|other
 * @property {*} default
 * @property {number} [min]
 * @property {number} [max]
 */
/**
 * @typedef {Object.<string, string>} FieldColorMap
 */
/**
 * @typedef {Object} ChartSettings
 * @property {FieldColorMap} colors
 * @property {Object.<string, any>} [extra]
 */
/**
 * Gets current settings from settings state and DOM
 *
 * Retrieves all chart settings from the settings state manager with fallbacks to
 * default values. Handles type conversion and validation for different
 * setting types (select, toggle, range, colors).
 *
 * @returns {Object} Current settings object
 */
export function getCurrentSettings(): Object;
/**
 * Gets default settings object based on chart configuration
 *
 * Creates a settings object with all default values from the chart
 * options configuration and default field colors.
 *
 * @returns {Object} Default settings object
 */
export function getDefaultSettings(): Object;
/**
 * Re-renders charts after a setting change
 * @param {string} settingName - Name of the setting that changed
 * @param {*} newValue - New value of the setting
 */
export function reRenderChartsAfterSettingChange(settingName: string, newValue: any): void;
/**
 * Resets all chart settings to their default values
 *
 * Clears all chart-related settings from the settings state manager, resets UI controls
 * to default values, and re-renders charts with the default configuration.
 * Shows a success notification when complete.
 *
 * @returns {boolean} True if reset was successful, false otherwise
 */
export function resetAllSettings(): boolean;
export type ResettableElement = HTMLElement & {
    _updateFromReset?: Function;
};
export type ChartOptionConfig = {
    id: string;
    label: string;
    /**
     * - select|toggle|range|other
     */
    type: string;
    default: any;
    min?: number;
    max?: number;
};
export type FieldColorMap = {
    [x: string]: string;
};
export type ChartSettings = {
    colors: FieldColorMap;
    extra?: {
        [x: string]: any;
    };
};
