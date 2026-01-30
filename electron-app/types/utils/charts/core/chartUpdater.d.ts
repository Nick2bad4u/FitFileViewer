/**
 * Get status information about the chart update system
 *
 * @returns {Object}
 */
export function getChartUpdateSystemStatus(): Object;
/**
 * Check if chart state manager is available and properly initialized
 *
 * @returns {boolean}
 */
export function isModernChartSystemAvailable(): boolean;
/**
 * Unified interface for triggering chart updates
 *
 * @param {string} reason - Reason for the chart update (for logging)
 * @param {HTMLElement} [container] - Optional container element
 *
 * @returns {Promise<boolean>}
 */
export function updateCharts(
    reason: string,
    container?: HTMLElement
): Promise<boolean>;
/**
 * Handle data changes with proper chart updates
 *
 * @param {Object} newData - New data object
 *
 * @returns {Promise<boolean>}
 */
export function updateChartsForDataChange(newData: Object): Promise<boolean>;
/**
 * Handle setting changes with debounced chart updates
 *
 * @param {string} settingName - Name of the setting that changed
 * @param {any} newValue - New value of the setting
 * @param {HTMLElement} [container] - Optional container element
 *
 * @returns {Promise<boolean>}
 */
export function updateChartsForSettingChange(
    settingName: string,
    newValue: any,
    container?: HTMLElement
): Promise<boolean>;
/**
 * Handle tab activation with proper chart updates
 *
 * @returns {Promise<boolean>}
 */
export function updateChartsForTabActivation(): Promise<boolean>;
/**
 * Handle theme changes with proper chart updates
 *
 * @param {string} newTheme - The new theme name
 *
 * @returns {Promise<boolean>}
 */
export function updateChartsForThemeChange(newTheme: string): Promise<boolean>;
export namespace ChartUpdater {
    export { updateChartsForDataChange as dataChange };
    export { getChartUpdateSystemStatus as getStatus };
    export { isModernChartSystemAvailable as isModernSystemAvailable };
    export { updateChartsForSettingChange as settingChange };
    export { updateChartsForTabActivation as tabActivation };
    export { updateChartsForThemeChange as themeChange };
    export { updateCharts as update };
}
export default ChartUpdater;
