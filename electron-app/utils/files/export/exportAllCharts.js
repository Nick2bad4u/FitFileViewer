import { showNotification } from "../../ui/notifications/showNotification.js";
import { exportUtils as rawExportUtils } from "./exportUtils.js";
const chartExportGlobal = globalThis;
const exportUtils = rawExportUtils;
function getChartLabel(chart, index) {
    const label = chart.data?.datasets?.[0]?.label;
    return typeof label === "string" && label.length > 0
        ? label
        : `chart-${index}`;
}
function getChartExportFilename(chart, index) {
    const field = getChartLabel(chart, index);
    return `${field.replaceAll(/\s+/g, "-").toLowerCase()}-chart.png`;
}
/**
 * Exports every currently rendered Chart.js instance as an individual PNG.
 */
export function exportAllCharts() {
    const chartInstances = chartExportGlobal._chartjsInstances;
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
