import { ExportUtils } from "./ExportUtils.js";
import { showNotification } from "./showNotification.js";


export function exportAllCharts() {
    if (!window._chartjsInstances || window._chartjsInstances.length === 0) {
        showNotification("No charts available to export", "warning");
        return;
    }

    try {
        window._chartjsInstances.forEach((chart, index) => {
            const field = chart.data.datasets[0]?.label || `chart-${index}`;
            const filename = `${field.replace(/\s+/g, "-").toLowerCase()}-chart.png`;
            ExportUtils.downloadChartAsPNG(chart, filename);
        });
        showNotification(`Exported ${window._chartjsInstances.length} charts`, "success");
    } catch (error) {
        console.error("Error exporting all charts:", error);
        showNotification("Failed to export charts", "error");
    }
}
