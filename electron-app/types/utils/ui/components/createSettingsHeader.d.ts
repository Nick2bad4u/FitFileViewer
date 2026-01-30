/**
 * @typedef {Object} WindowExtensions
 *
 * @property {any[]} [_chartjsInstances] - ChartJS instances
 * @property {Object} [globalData] - Global data object
 * @property {any[]} [globalData.timeInZoneMesgs] - Time in zone messages
 * @property {any[]} [globalData.eventMesgs] - Event messages
 * @property {any[]} [globalData.recordMesgs] - Record messages
 */
/**
 * @typedef {Object} ChartOption
 *
 * @property {string} id - Option identifier
 * @property {string} label - Display label
 * @property {string} type - Option type (slider, toggle, select)
 * @property {number} [min] - Minimum value for sliders
 * @property {number} [max] - Maximum value for sliders
 * @property {number} [step] - Step value for sliders
 * @property {any} [defaultValue] - Default value
 * @property {any} [default] - Default value (alternate property)
 * @property {any[]} [options] - Options for select controls
 */
/**
 * @typedef {HTMLInputElement & { timeout?: any }} HTMLInputElementExtended
 */
/**
 * @typedef {HTMLDivElement & { _updateFromReset?: Function }} HTMLDivElementExtended
 */
export function applySettingsPanelStyles(wrapper: HTMLElement): void;
/**
 * Creates the main controls section with dropdowns and sliders
 *
 * @param {HTMLElement} wrapper - The wrapper element to add the controls to
 */
export function createControlsSection(wrapper: HTMLElement): void;
export function createExportSection(wrapper: HTMLElement): void;
export function createFieldTogglesSection(wrapper: HTMLElement): void;
/**
 * Creates the settings header with title and global actions
 *
 * @param {HTMLElement} wrapper - The wrapper element to add the header to
 */
export function createSettingsHeader(wrapper: HTMLElement): void;
export function showChartSelectionModal(
    actionType: any,
    singleCallback: any,
    combinedCallback: any
): void;
export type WindowExtensions = {
    /**
     * - ChartJS instances
     */
    _chartjsInstances?: any[];
    /**
     * - Global data object
     */
    globalData?: {
        timeInZoneMesgs?: any[] | undefined;
        eventMesgs?: any[] | undefined;
        recordMesgs?: any[] | undefined;
    };
};
export type ChartOption = {
    /**
     * - Option identifier
     */
    id: string;
    /**
     * - Display label
     */
    label: string;
    /**
     * - Option type (slider, toggle, select)
     */
    type: string;
    /**
     * - Minimum value for sliders
     */
    min?: number;
    /**
     * - Maximum value for sliders
     */
    max?: number;
    /**
     * - Step value for sliders
     */
    step?: number;
    /**
     * - Default value
     */
    defaultValue?: any;
    /**
     * - Default value (alternate property)
     */
    default?: any;
    /**
     * - Options for select controls
     */
    options?: any[];
};
export type HTMLInputElementExtended = HTMLInputElement & {
    timeout?: any;
};
export type HTMLDivElementExtended = HTMLDivElement & {
    _updateFromReset?: Function;
};
