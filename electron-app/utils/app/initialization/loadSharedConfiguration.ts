import { chartStateManager } from "../../charts/core/chartStateManager.js";
import { renderChartJS } from "../../charts/core/renderChartJS.js";
import {
    type ChartFieldVisibility,
    setChartFieldVisibility,
    setChartSetting,
} from "../../state/domain/settingsStateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

type SharedChartConfiguration = Record<string, unknown> & {
    visibleFields?: Record<string, unknown>;
};

let sharedConfigurationRefreshTimeout:
    | ReturnType<typeof setTimeout>
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
    if (sharedConfigurationRefreshTimeout !== undefined) {
        clearTimeout(sharedConfigurationRefreshTimeout);
    }

    sharedConfigurationRefreshTimeout = setTimeout(() => {
        sharedConfigurationRefreshTimeout = undefined;

        if (chartStateManager) {
            chartStateManager.debouncedRender("Configuration loaded from URL");
            return;
        }

        renderChartJS();
    }, 100);
}

/**
 * Load shared chart configuration from the current URL.
 */
export function loadSharedConfiguration(): void {
    try {
        const urlParams = new URLSearchParams(globalThis.location.search);
        const configParam = urlParams.get("chartConfig");

        if (!configParam) {
            return;
        }

        applySharedConfiguration(parseSharedConfiguration(configParam));
        showNotification("Chart configuration loaded from URL", "success");
        scheduleChartRefresh();
    } catch (error) {
        console.error("Error loading shared configuration:", error);
        showNotification("Failed to load shared configuration", "warning");
    }
}
