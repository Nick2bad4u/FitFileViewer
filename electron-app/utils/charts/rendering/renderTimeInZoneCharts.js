import { getHRZoneVisibilitySettings } from "../../ui/controls/createHRZoneControls.js";
import { getPowerZoneVisibilitySettings } from "../../ui/controls/createPowerZoneControls.js";
import { renderZoneChart } from "./renderZoneChart.js";
/** @typedef {import("../../../global").ZoneInfo} ZoneInfo */
/** @typedef {{ doughnutVisible?: boolean }} ZoneVisibilitySettings */

/**
 * Render HR / Power time-in-zone charts (doughnut by default) into a container.
 *
 * @param {HTMLElement} container Parent element to append charts into
 * @param {{ chartType?: string } & Record<string, any>} [options] Optional
 *   chart options forwarded to renderZoneChart
 */
export function renderTimeInZoneCharts(container, options = {}) {
    try {
        const isDevEnvironment =
            typeof process !== "undefined" &&
            process.env?.NODE_ENV === "development";
        const isDebugLoggingEnabled =
            isDevEnvironment &&
            Boolean(/** @type {any} */ (globalThis).__FFV_debugCharts);

        if (!container) {
            return;
        }
        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] renderTimeInZoneCharts called");
        }

        /** @type {ZoneInfo[] | undefined} */
        const hrZones = Array.isArray(globalThis.heartRateZones)
                ? globalThis.heartRateZones
                : undefined,
            /** @type {ZoneVisibilitySettings} */
            hrZoneSettings = (getHRZoneVisibilitySettings &&
                getHRZoneVisibilitySettings()) || {
                doughnutVisible: true,
            },
            /** @type {ZoneInfo[] | undefined} */
            powerZones = Array.isArray(globalThis.powerZones)
                ? globalThis.powerZones
                : undefined;
        if (hrZoneSettings.doughnutVisible && hrZones && hrZones.length > 0) {
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
        } else {
            if (isDebugLoggingEnabled) {
                console.log(
                    "[ChartJS] HR zone doughnut chart hidden or no data available"
                );
            }
        }

        /** @type {ZoneVisibilitySettings} */
        const powerZoneSettings = (getPowerZoneVisibilitySettings &&
            getPowerZoneVisibilitySettings()) || {
            doughnutVisible: true,
        };
        if (
            powerZoneSettings.doughnutVisible &&
            powerZones &&
            powerZones.length > 0
        ) {
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
        } else {
            if (isDebugLoggingEnabled) {
                console.log(
                    "[ChartJS] Power zone doughnut chart hidden or no data available"
                );
            }
        }
    } catch (error) {
        console.error("[ChartJS] Error rendering time in zone charts:", error);
    }
}
