import { renderZoneChart } from "./renderZoneChart.js";

// Time in zone charts renderer
export function renderTimeInZoneCharts(container, options) {
    try {
        console.log("[ChartJS] renderTimeInZoneCharts called");
        console.log("[ChartJS] window.heartRateZones:", window.heartRateZones);
        console.log("[ChartJS] window.powerZones:", window.powerZones);

        // Check for heart rate zone data and visibility
        const hrDoughnutVisible = localStorage.getItem("chartjs_field_hr_zone_doughnut") !== "hidden";
        if (hrDoughnutVisible && window.heartRateZones && Array.isArray(window.heartRateZones) && window.heartRateZones.length > 0) {
            console.log("[ChartJS] Rendering HR zone chart with data:", window.heartRateZones);
            renderZoneChart(container, "Heart Rate Zones", window.heartRateZones, "heart-rate-zones", options);
        } else {
            console.log("[ChartJS] HR zone doughnut chart hidden or no data available");
        }
        // Check for power zone data and visibility
        const powerDoughnutVisible = localStorage.getItem("chartjs_field_power_zone_doughnut") !== "hidden";
        if (powerDoughnutVisible && window.powerZones && Array.isArray(window.powerZones) && window.powerZones.length > 0) {
            console.log("[ChartJS] Rendering power zone chart with data:", window.powerZones);
            renderZoneChart(container, "Power Zones", window.powerZones, "power-zones", options);
        } else {
            console.log("[ChartJS] Power zone doughnut chart hidden or no data available");
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering time in zone charts:", error);
    }
}
