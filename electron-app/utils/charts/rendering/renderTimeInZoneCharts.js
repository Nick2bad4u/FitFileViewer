import { getHRZoneVisibilitySettings } from "../../ui/controls/createHRZoneControls.js";
import { getPowerZoneVisibilitySettings } from "../../ui/controls/createPowerZoneControls.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { renderZoneChart } from "./renderZoneChart.js";
const chartGlobal = globalThis;
/**
 * Render HR / Power time-in-zone charts into a container.
 */
export function renderTimeInZoneCharts(container, options = {}) {
    try {
        const isDevEnvironment =
                typeof process !== "undefined" &&
                process.env?.["NODE_ENV"] === "development",
            isDebugLoggingEnabled =
                isDevEnvironment && Boolean(chartGlobal.__FFV_debugCharts);
        if (!container) {
            return;
        }
        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] renderTimeInZoneCharts called");
        }
        const hrZones = getZoneData(chartGlobal.heartRateZones),
            hrZoneSettings = getVisibleZoneSettings(
                getHRZoneVisibilitySettings()
            );
        if (hrZoneSettings.doughnutVisible && hrZones.length > 0) {
            if (isDebugLoggingEnabled) {
                console.log(
                    "[ChartJS] Rendering HR zone chart with data:",
                    hrZones
                );
            }
            renderZoneChart(
                container,
                "HR Zone Distribution (Doughnut)",
                hrZones,
                "heart-rate-zones",
                options
            );
        } else if (isDebugLoggingEnabled) {
            console.log(
                "[ChartJS] HR zone doughnut chart hidden or no data available"
            );
        }
        const powerZones = getZoneData(chartGlobal.powerZones),
            powerZoneSettings = getVisibleZoneSettings(
                getPowerZoneVisibilitySettings()
            );
        if (powerZoneSettings.doughnutVisible && powerZones.length > 0) {
            if (isDebugLoggingEnabled) {
                console.log(
                    "[ChartJS] Rendering power zone doughnut chart with data:",
                    powerZones
                );
            }
            renderZoneChart(
                container,
                "Power Zone Distribution (Doughnut)",
                powerZones,
                "power-zones",
                options
            );
        } else if (isDebugLoggingEnabled) {
            console.log(
                "[ChartJS] Power zone doughnut chart hidden or no data available"
            );
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering time in zone charts:", error);
    }
}
function getVisibleZoneSettings(settings) {
    return settings ?? { doughnutVisible: true };
}
function getZoneData(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter(isZoneData);
}
function isZoneData(value) {
    return isObjectRecord(value);
}
