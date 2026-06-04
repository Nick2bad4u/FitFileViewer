import { showNotification } from "../../ui/notifications/showNotification.js";
import {
    exportUtils as rawExportUtils,
    type ExportableChart,
} from "./exportUtils.js";

type ChartExportUtils = {
    downloadChartAsPNG(chart: ExportableChart, filename: string): unknown;
};

type ChartExportGlobal = typeof globalThis & {
    _chartjsInstances?: ExportableChart[];
};

const chartExportGlobal = globalThis as ChartExportGlobal;

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
    const chartInstances = chartExportGlobal._chartjsInstances;
    const exportUtils = rawExportUtils as ChartExportUtils;

    if (!Array.isArray(chartInstances) || chartInstances.length === 0) {
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
