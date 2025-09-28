/**
 * @typedef {Object} ZoneDataItem
 * @property {number} [zone]
 * @property {string} [label]
 * @property {number} [time]
 * @property {string} [color]
 */
/**
 * @typedef {Object} RenderZoneChartOptions
 * @property {string} [chartType] - "doughnut" | "bar"
 * @property {boolean} [showLegend]
 */
/**
 * @param {HTMLElement} container
 * @param {string} title
 * @param {ZoneDataItem[]} zoneData
 * @param {string} chartId
 * @param {RenderZoneChartOptions} [options]
 */
export function renderZoneChart(container: HTMLElement, title: string, zoneData: ZoneDataItem[], chartId: string, options?: RenderZoneChartOptions): void;
export type ZoneDataItem = {
    zone?: number;
    label?: string;
    time?: number;
    color?: string;
};
export type RenderZoneChartOptions = {
    /**
     * - "doughnut" | "bar"
     */
    chartType?: string;
    showLegend?: boolean;
};
//# sourceMappingURL=renderZoneChartNew.d.ts.map