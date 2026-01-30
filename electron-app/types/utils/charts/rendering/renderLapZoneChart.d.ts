/**
 * @typedef {Object} LapZoneDatum
 *
 * @property {string} label - Zone label (e.g., "HR Zone 1")
 * @property {number} value - Time in zone (seconds)
 * @property {string} [color] - Base color for the zone
 * @property {number} [zoneIndex] - Numeric zone index (0-based)
 */
/**
 * @typedef {Object} LapZoneEntry
 *
 * @property {string} lapLabel - Label for the lap (e.g., "Lap 1")
 * @property {LapZoneDatum[]} zones - Zone distribution for the lap
 */
/**
 * @typedef {Object} LapZoneChartOptions
 *
 * @property {string} [title]
 */
/**
 * Render lap-by-lap stacked zone chart (HR or Power) with robust guards &
 * typing.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {LapZoneEntry[]} lapZoneData
 * @param {LapZoneChartOptions} [options]
 *
 * @returns {any | null}
 */
export function renderLapZoneChart(
    canvas: HTMLCanvasElement,
    lapZoneData: LapZoneEntry[],
    options?: LapZoneChartOptions
): any | null;
export type LapZoneDatum = {
    /**
     * - Zone label (e.g., "HR Zone 1")
     */
    label: string;
    /**
     * - Time in zone (seconds)
     */
    value: number;
    /**
     * - Base color for the zone
     */
    color?: string;
    /**
     * - Numeric zone index (0-based)
     */
    zoneIndex?: number;
};
export type LapZoneEntry = {
    /**
     * - Label for the lap (e.g., "Lap 1")
     */
    lapLabel: string;
    /**
     * - Zone distribution for the lap
     */
    zones: LapZoneDatum[];
};
export type LapZoneChartOptions = {
    title?: string;
};
