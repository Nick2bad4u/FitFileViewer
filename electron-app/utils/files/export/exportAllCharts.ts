import { showNotification } from "../../ui/notifications/showNotification.js";
import { getRegisteredChartInstances } from "../../charts/core/chartInstanceRegistry.js";
import {
    exportUtils as rawExportUtils,
    type ExportableChart,
} from "./exportUtils.js";

type ChartExportUtils = {
    downloadChartAsPNG(chart: ExportableChart, filename: string): unknown;
};

function getChartLabel(chart: ExportableChart, index: number): string {
    const label = chart.data?.datasets?.[0]?.label;
    return typeof label === "string" && label.length > 0
        ? label
        : `chart-${index}`;
}

function getChartExportFilename(chart: ExportableChart, index: number): string {
    const field = getChartLabel(chart, index);
    return `${field.replaceAll(/\s+/g, "-").toLowerCase()}-chart.png`;
}

/**
 * Exports every currently rendered Chart.js instance as an individual PNG.
 */
export function exportAllCharts(): void {
    const chartInstances = getRegisteredChartInstances() as ExportableChart[];
    const exportUtils = rawExportUtils as ChartExportUtils;

    if (chartInstances.length === 0) {
        showNotification("No charts available to export", "warning");
        return;
    }

    try {
        for (const [index, chart] of chartInstances.entries()) {
            exportUtils.downloadChartAsPNG(
                chart,
                getChartExportFilename(chart, index)
            );
        }

        showNotification(`Exported ${chartInstances.length} charts`, "success");
    } catch (error) {
        console.error("Error exporting all charts:", error);
        showNotification("Failed to export charts", "error");
    }
}
