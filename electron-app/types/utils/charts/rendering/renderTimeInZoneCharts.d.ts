/** @typedef {import("../../../global").ZoneInfo} ZoneInfo */
/** @typedef {{ doughnutVisible?: boolean }} ZoneVisibilitySettings */
/**
 * Render HR / Power time-in-zone charts (doughnut by default) into a container.
 *
 * @param {HTMLElement} container Parent element to append charts into
 * @param {{ chartType?: string } & Record<string, any>} [options] Optional
 *   chart options forwarded to renderZoneChart
 */
export function renderTimeInZoneCharts(
    container: HTMLElement,
    options?: {
        chartType?: string;
    } & Record<string, any>
): void;
export type ZoneInfo = import("../../../global").ZoneInfo;
export type ZoneVisibilitySettings = {
    doughnutVisible?: boolean;
};
