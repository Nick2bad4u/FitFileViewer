import { chartStateManager } from "../../charts/core/chartStateManager.js";
import { renderChartJS } from "../../charts/core/renderChartJS.js";
import {
    setChartFieldVisibility,
    setChartSetting,
} from "../../state/domain/settingsStateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
let sharedConfigurationRefreshTimeout;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseSharedConfiguration(configParam) {
    const parsed = JSON.parse(atob(configParam));
    if (!isRecord(parsed)) {
        throw new TypeError("Shared chart configuration must be an object");
    }
    return parsed;
}
function normalizeVisibility(rawValue) {
    return rawValue === "hidden" || rawValue === false ? "hidden" : "visible";
}
function applySharedConfiguration(settings) {
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
function scheduleChartRefresh() {
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
export function loadSharedConfiguration() {
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
