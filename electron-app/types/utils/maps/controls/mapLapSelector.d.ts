/**
 * @typedef {Object} LapMesg
 * @property {number} [zone] - Zone identifier
 * @property {string} [label] - Zone label
 * @property {number} [time] - Time value
 */
/**
 * @typedef {Object} GlobalData
 * @property {LapMesg[]} lapMesgs - Array of lap messages
 */
/**
 * @typedef {Object} WindowWithGlobalData
 * @property {GlobalData} globalData - Global data object
 */
/**
 * @typedef {Object} ThemeColors
 * @property {string} surface - Surface color
 * @property {string} primary - Primary color
 * @property {string} accent - Accent color
 * @property {string} text - Text color
 * @property {string} textSecondary - Secondary text color
 */
/**
 * @typedef {Object} MapDrawLapsFunction
 * @property {Function} call - Function to draw laps on map
 */
/**
 * Adds lap selector control to map
 * @param {any} _map - Leaflet map instance (unused in current implementation)
 * @param {HTMLElement} container - Container element for the control
 * @param {Function} mapDrawLaps - Function to draw laps on map
 * @returns {void}
 */
export function addLapSelector(_map: any, container: HTMLElement, mapDrawLaps: Function): void;
export type LapMesg = {
    /**
     * - Zone identifier
     */
    zone?: number;
    /**
     * - Zone label
     */
    label?: string;
    /**
     * - Time value
     */
    time?: number;
};
export type GlobalData = {
    /**
     * - Array of lap messages
     */
    lapMesgs: LapMesg[];
};
export type WindowWithGlobalData = {
    /**
     * - Global data object
     */
    globalData: GlobalData;
};
export type ThemeColors = {
    /**
     * - Surface color
     */
    surface: string;
    /**
     * - Primary color
     */
    primary: string;
    /**
     * - Accent color
     */
    accent: string;
    /**
     * - Text color
     */
    text: string;
    /**
     * - Secondary text color
     */
    textSecondary: string;
};
export type MapDrawLapsFunction = {
    /**
     * - Function to draw laps on map
     */
    call: Function;
};
