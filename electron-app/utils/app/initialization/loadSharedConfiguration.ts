import { getRegisteredChartStateManager } from "../../charts/core/chartStateManagerRegistry.js";
import { renderChartJS } from "../../charts/core/renderChartJS.js";
import {
    type ChartFieldVisibility,
    setChartFieldVisibility,
    setChartSetting,
} from "../../state/domain/settingsStateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import {
    getLoadSharedConfigurationRuntime,
    type LoadSharedConfigurationTimerHandle,
} from "./loadSharedConfigurationRuntime.js";

type SharedChartConfiguration = Record<string, unknown> & {
    visibleFields?: Record<string, unknown>;
};

let sharedConfigurationRefreshTimeout:
    | LoadSharedConfigurationTimerHandle
    | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSharedConfiguration(
    configParam: string
): SharedChartConfiguration {
    const parsed: unknown = JSON.parse(atob(configParam));

    if (!isRecord(parsed)) {
        throw new TypeError("Shared chart configuration must be an object");
    }

    return parsed;
}

function normalizeVisibility(rawValue: unknown): ChartFieldVisibility {
    return rawValue === "hidden" || rawValue === false ? "hidden" : "visible";
}

function applySharedConfiguration(settings: SharedChartConfiguration): void {
    for (const [key, value] of Object.entries(settings)) {
        if (key !== "visibleFields") {
            setChartSetting(key, value);
            continue;
        }

        if (!isRecord(value)) {
            continue;
        }

        for (const [field, rawValue] of Object.entries(value)) {
            setChartFieldVisibility(field, normalizeVisibility(rawValue));
        }
    }
}

function scheduleChartRefresh(): void {
    const runtime = getLoadSharedConfigurationRuntime();

    if (sharedConfigurationRefreshTimeout !== undefined) {
        runtime.clearTimeout(sharedConfigurationRefreshTimeout);
    }

    sharedConfigurationRefreshTimeout = runtime.setTimeout(() => {
        sharedConfigurationRefreshTimeout = undefined;

        const chartStateManager = getRegisteredChartStateManager();
        if (chartStateManager) {
            chartStateManager.debouncedRender("Configuration loaded from URL");
            return;
        }

        void Promise.resolve(renderChartJS()).catch((error: unknown) => {
            console.error("Error refreshing chart after shared config:", error);
        });
    }, 100);
}

function showSharedConfigurationNotification(
    message: string,
    type: "success" | "warning"
): void {
    void Promise.resolve(showNotification(message, type)).catch(
        (error: unknown) => {
            console.error(
                "Error showing shared configuration notification:",
                error
            );
        }
    );
}

/**
 * Load shared chart configuration from the current URL.
 */
export function loadSharedConfiguration(): void {
    try {
        const { locationSearch } = getLoadSharedConfigurationRuntime();
        const urlParams = new URLSearchParams(locationSearch);
        const configParam = urlParams.get("chartConfig");

        if (!configParam) {
            return;
        }

        applySharedConfiguration(parseSharedConfiguration(configParam));
        showSharedConfigurationNotification(
            "Chart configuration loaded from URL",
            "success"
        );
        scheduleChartRefresh();
    } catch (error) {
        console.error("Error loading shared configuration:", error);
        showSharedConfigurationNotification(
            "Failed to load shared configuration",
            "warning"
        );
    }
}
