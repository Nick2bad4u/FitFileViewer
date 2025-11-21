/**
 * Gets default value for a specific chart option
 * @param {string} optionId - The ID of the chart option
 * @returns {*} Default value for the option, or undefined if not found
 */
export function getDefaultValue(optionId: string): any;
/**
 * Gets performance warning level for max points value
 * @param {number|string} maxPoints - Max points value to check
 * @returns {string|null} Warning level ("slow", "very-slow", "not-recommended") or null if no warning
 */
export function getMaxPointsWarningLevel(maxPoints: number | string): string | null;
/**
 * Gets chart option configuration by ID
 * @param {string} optionId - The ID of the chart option
 * @returns {ChartOption|undefined} Chart option configuration or undefined if not found
 */
export function getOptionConfig(optionId: string): ChartOption | undefined;
/**
 * Validates if a value is valid for a given chart option
 * @param {string} optionId - The ID of the chart option
 * @param {*} value - Value to validate
 * @returns {boolean} True if value is valid for the option
 */
export function isValidOptionValue(optionId: string, value: any): boolean;
/**
 * @fileoverview Chart configuration options for FitFileViewer
 *
 * Defines the comprehensive configuration schema for chart customization
 * including data point limits, visualization types, styling options,
 * and unit preferences. Used by settings UI and chart rendering.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */
export const DEFAULT_MAX_POINTS: 250;
/**
 * Allowed options for maximum number of chart points
 *
 * WARNING: Selecting very high values may cause significant performance
 * issues or browser crashes, especially with large datasets. UI components
 * should enforce reasonable limits or display warnings for large values.
 *
 * @type {(number|string)[]}
 */
export const maxPointsOptions: (number | string)[];
/**
 * Chart option configuration object
 * @typedef {Object} ChartOption
 * @property {string} id - Unique identifier for the option (used as localStorage key)
 * @property {string} label - Human-readable label for UI display
 * @property {string} type - Option type: "select", "toggle", "range"
 * @property {Array<*>} [options] - Allowed values for "select" or "toggle" types
 * @property {number|string|boolean} default - Default value for the option
 * @property {string} description - Description of the option for tooltips/help
 * @property {number} [min] - Minimum value (for "range" type)
 * @property {number} [max] - Maximum value (for "range" type)
 * @property {number} [step] - Step size (for "range" type)
 */
/**
 * Comprehensive chart configuration options
 *
 * Defines all available chart customization options including data limits,
 * visualization types, styling preferences, and unit settings. Each option
 * specifies its type, allowed values, default, and description.
 *
 * @type {ChartOption[]}
 *
 * @example
 * import { chartOptionsConfig } from './chartOptionsConfig.js';
 * // Iterate over options to build a settings UI
 * chartOptionsConfig.forEach(opt => {
 *   console.log(`${opt.label}: ${opt.default}`);
 * });
 */
export const chartOptionsConfig: ChartOption[];
/**
 * Chart option configuration object
 */
export type ChartOption = {
    /**
     * - Unique identifier for the option (used as localStorage key)
     */
    id: string;
    /**
     * - Human-readable label for UI display
     */
    label: string;
    /**
     * - Option type: "select", "toggle", "range"
     */
    type: string;
    /**
     * - Allowed values for "select" or "toggle" types
     */
    options?: Array<any>;
    /**
     * - Default value for the option
     */
    default: number | string | boolean;
    /**
     * - Description of the option for tooltips/help
     */
    description: string;
    /**
     * - Minimum value (for "range" type)
     */
    min?: number;
    /**
     * - Maximum value (for "range" type)
     */
    max?: number;
    /**
     * - Step size (for "range" type)
     */
    step?: number;
};
//# sourceMappingURL=chartOptionsConfig.d.ts.map
