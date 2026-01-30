import { showNotification } from "../../ui/notifications/showNotification.js";
import { exportUtils } from "./exportUtils.js";

export function exportAllCharts() {
    if (
        !globalThis._chartjsInstances ||
        globalThis._chartjsInstances.length === 0
    ) {
        showNotification("No charts available to export", "warning");
        return;
    }

    try {
        for (const [index, chart] of globalThis._chartjsInstances.entries()) {
            const field = chart.data.datasets[0]?.label || `chart-${index}`,
                filename = `${field.replaceAll(/\s+/g, "-").toLowerCase()}-chart.png`;
            exportUtils.downloadChartAsPNG(chart, filename);
        }
        showNotification(
            `Exported ${globalThis._chartjsInstances.length} charts`,
            "success"
        );
    } catch (error) {
        console.error("Error exporting all charts:", error);
        showNotification("Failed to export charts", "error");
    }
}
