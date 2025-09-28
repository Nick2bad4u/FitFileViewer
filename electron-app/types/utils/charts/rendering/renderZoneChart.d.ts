/**
 * Render a zone chart (doughnut or bar)
 * @param {HTMLElement} container
 * @param {string} title
 * @param {import("../../types/sharedChartTypes.d.ts").ZoneData[]} zoneData
 * @param {string} chartId
 * @param {{ chartType?: string, showLegend?: boolean }} [options]
 * @returns {void}
 */
export function renderZoneChart(container: HTMLElement, title: string, zoneData: import("../../types/sharedChartTypes.d.ts").ZoneData[], chartId: string, options?: {
    chartType?: string;
    showLegend?: boolean;
}): void;
//# sourceMappingURL=renderZoneChart.d.ts.map