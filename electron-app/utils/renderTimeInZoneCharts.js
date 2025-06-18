import { renderZoneChart } from "./renderZoneChart.js";
import { getPowerZoneVisibilitySettings } from "./createPowerZoneControls.js";
import { getHRZoneVisibilitySettings } from "./createHRZoneControls.js";

// Time in zone charts renderer
export function renderTimeInZoneCharts(container, options) {
    try {
        console.log("[ChartJS] renderTimeInZoneCharts called");
        console.log("[ChartJS] window.heartRateZones:", window.heartRateZones);
        console.log("[ChartJS] window.powerZones:", window.powerZones); // Check for heart rate zone data and visibility using new HR zone controls
        const hrZoneSettings = getHRZoneVisibilitySettings();
        if (
            hrZoneSettings.doughnutVisible &&
            window.heartRateZones &&
            Array.isArray(window.heartRateZones) &&
            window.heartRateZones.length > 0
        ) {
            console.log("[ChartJS] Rendering HR zone chart with data:", window.heartRateZones);
            renderZoneChart(
                container,
                "HR Zone Distribution (Doughnut)",
                window.heartRateZones,
                "heart-rate-zones",
                options
            );
        } else {
            console.log("[ChartJS] HR zone doughnut chart hidden or no data available");
        }

        // Check for power zone data and visibility using new power zone controls
        const powerZoneSettings = getPowerZoneVisibilitySettings();
        if (
            powerZoneSettings.doughnutVisible &&
            window.powerZones &&
            Array.isArray(window.powerZones) &&
            window.powerZones.length > 0
        ) {
            console.log("[ChartJS] Rendering power zone doughnut chart with data:", window.powerZones);
            renderZoneChart(container, "Power Zone Distribution (Doughnut)", window.powerZones, "power-zones", options);
        } else {
            console.log("[ChartJS] Power zone doughnut chart hidden or no data available");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering time in zone charts:", error);
    }
}
