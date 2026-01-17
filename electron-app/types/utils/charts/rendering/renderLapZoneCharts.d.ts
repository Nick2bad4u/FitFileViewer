/**
 * @typedef {Object} LapZoneDatum
 * @property {string} label
 * @property {number} value
 * @property {string} color
 * @property {number} zoneIndex
 */
/**
 * @typedef {Object} LapZoneEntry
 * @property {string} lapLabel
 * @property {LapZoneDatum[]} zones
 */
/**
 * @typedef {Object} LapZoneVisibility
 * @property {boolean} hrStackedVisible
 * @property {boolean} hrIndividualVisible
 * @property {boolean} powerStackedVisible
 * @property {boolean} powerIndividualVisible
 */
/**
 * @typedef {Object} LapZoneChartsOptions
 * @property {LapZoneVisibility} [visibilitySettings]
 */
/**
 * @param {HTMLElement} container
 * @param {LapZoneChartsOptions} [options]
 */
export function renderLapZoneCharts(container: HTMLElement, options?: LapZoneChartsOptions): void;
export type LapZoneDatum = {
    label: string;
    value: number;
    color: string;
    zoneIndex: number;
};
export type LapZoneEntry = {
    lapLabel: string;
    zones: LapZoneDatum[];
};
export type LapZoneVisibility = {
    hrStackedVisible: boolean;
    hrIndividualVisible: boolean;
    powerStackedVisible: boolean;
    powerIndividualVisible: boolean;
};
export type LapZoneChartsOptions = {
    visibilitySettings?: LapZoneVisibility;
};
