import { getHRZoneVisibilitySettings } from "../../ui/controls/createHRZoneControls.js";
import { getPowerZoneVisibilitySettings } from "../../ui/controls/createPowerZoneControls.js";
import { isDevelopmentEnvironment } from "../../runtime/processEnvironment.js";
import {
    getHeartRateZones,
    getPowerZones,
} from "../../data/zones/zoneDataState.js";
import type { ZoneData } from "../../types/sharedChartTypes.js";
import { isObjectRecord } from "../core/renderChartModuleHelpers.js";
import { renderZoneChart } from "./renderZoneChart.js";

interface TimeInZoneChartOptions {
    readonly chartType?: string;
    readonly showGrid?: boolean;
    readonly showLegend?: boolean;
    readonly showTitle?: boolean;
    readonly zoomPluginConfig?: Record<string, unknown>;
    readonly [key: string]: unknown;
}

interface TimeInZoneRuntimeGlobal {
    readonly __FFV_debugCharts?: unknown;
}

interface ZoneVisibilitySettings {
    readonly doughnutVisible?: boolean;
}

const chartGlobal = globalThis as typeof globalThis & TimeInZoneRuntimeGlobal;

/**
 * Render HR / Power time-in-zone charts into a container.
 */
export function renderTimeInZoneCharts(
    container: HTMLElement | null | undefined,
    options: TimeInZoneChartOptions = {}
): void {
    try {
        const isDebugLoggingEnabled =
            isDevelopmentEnvironment() &&
            Boolean(chartGlobal.__FFV_debugCharts);

        if (!container) {
            return;
        }

        if (isDebugLoggingEnabled) {
            console.log("[ChartJS] renderTimeInZoneCharts called");
        }

        const hrZones = getZoneData(getHeartRateZones()),
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

        const powerZones = getZoneData(getPowerZones()),
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

function getVisibleZoneSettings(
    settings: ZoneVisibilitySettings | undefined
): ZoneVisibilitySettings {
    return settings ?? { doughnutVisible: true };
}

function getZoneData(value: unknown): ZoneData[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(isZoneData);
}

function isZoneData(value: unknown): value is ZoneData {
    return isObjectRecord(value);
}
