import { isRecord } from "./renderChartModuleHelpers.js";
function normalizeMaxpoints(rawMaxpoints, defaultMaxPoints) {
    if (rawMaxpoints === "all") {
        return "all";
    }
    if (typeof rawMaxpoints === "number" && Number.isFinite(rawMaxpoints)) {
        return rawMaxpoints;
    }
    if (typeof rawMaxpoints === "string" &&
        Number.isFinite(Number(rawMaxpoints))) {
        return Number(rawMaxpoints);
    }
    return defaultMaxPoints;
}
function resolveChartSettingsApi(manager) {
    return {
        getChartFieldVisibility: manager.getChartFieldVisibility
            ? (fieldKey, defaultVisibility) => manager.getChartFieldVisibility?.(fieldKey, defaultVisibility)
            : (fieldKey, defaultVisibility = "visible") => {
                const visibilityMap = manager.getSetting?.("chart", "fieldVisibility") ?? {};
                return isRecord(visibilityMap)
                    ? (visibilityMap[fieldKey] ?? defaultVisibility)
                    : defaultVisibility;
            },
        getChartSettings: manager.getUserChartSettings
            ? () => manager.getUserChartSettings?.()
            : manager.getChartSettings
                ? () => manager.getChartSettings?.()
                : () => manager.getSetting?.("chart") ?? {},
        setChartFieldVisibility: manager.setChartFieldVisibility
            ? (fieldKey, visibility) => manager.setChartFieldVisibility?.(fieldKey, visibility)
            : (fieldKey, visibility) => {
                const visibilityMap = manager.getSetting?.("chart", "fieldVisibility") ?? {};
                const nextVisibility = {
                    ...(isRecord(visibilityMap) ? visibilityMap : {}),
                    [fieldKey]: visibility,
                };
                manager.setSetting?.("chart", nextVisibility, "fieldVisibility");
                return nextVisibility;
            },
        updateChartSettings: manager.updateChartSettings
            ? (updates) => manager.updateChartSettings?.(updates)
            : (updates) => {
                for (const [key, value] of Object.entries(updates)) {
                    if (key === "fieldVisibility" && isRecord(value)) {
                        const existing = manager.getSetting?.("chart", "fieldVisibility") ?? {};
                        manager.setSetting?.("chart", {
                            ...(isRecord(existing) ? existing : {}),
                            ...value,
                        }, "fieldVisibility");
                        continue;
                    }
                    manager.setSetting?.("chart", value, key);
                }
            },
    };
}
function resolveSettingsApi(dependencies) {
    return resolveChartSettingsApi(dependencies.getSettingsStateManager());
}
function normalizeChartSettings(settings, dependencies) {
    const resolved = isRecord(settings) ? settings : {};
    const rawMaxpoints = dependencies.getRecordValue(resolved, "maxpoints");
    return {
        ...resolved,
        animation: resolved["animation"] || "normal",
        chartType: resolved["chartType"] || "line",
        colors: resolved["colors"] || [],
        exportTheme: resolved["exportTheme"] || "auto",
        interpolation: resolved["interpolation"] || "linear",
        maxpoints: normalizeMaxpoints(rawMaxpoints, dependencies.defaultMaxPoints),
        showFill: resolved["showFill"] === true,
        showGrid: resolved["showGrid"] !== false,
        showLegend: resolved["showLegend"] !== false,
        showPoints: resolved["showPoints"] === true,
        showTitle: resolved["showTitle"] !== false,
        smoothing: resolved["smoothing"] || 0.1,
    };
}
function hasDataSettingsUpdate(newSettings, dataSignatureSources) {
    return dataSignatureSources.some(({ settingKey }) => settingKey in newSettings);
}
/**
 * Creates the chart settings manager used by renderChartJS orchestration.
 *
 * @param dependencies - State, persistence, invalidation, and rendering hooks.
 * @returns Chart settings manager facade.
 */
export function createChartSettingsManager(dependencies) {
    return {
        getFieldVisibility(field) {
            return resolveSettingsApi(dependencies).getChartFieldVisibility(field, "visible");
        },
        getSettings() {
            let settings = dependencies.getState("settings.charts");
            if (!settings) {
                settings = resolveSettingsApi(dependencies).getChartSettings();
                dependencies.setState("settings.charts", settings, {
                    silent: false,
                    source: "chartSettingsManager.getSettings",
                });
            }
            return normalizeChartSettings(settings, dependencies);
        },
        setFieldVisibility(field, visibility) {
            resolveSettingsApi(dependencies).setChartFieldVisibility(field, visibility);
            try {
                dependencies
                    .getComputedStateManager()
                    .invalidateComputed?.("charts.renderableFieldCount");
            }
            catch {
                // Ignore computed-state invalidation failures.
            }
            if (dependencies.isRendered()) {
                dependencies.requestRerender(`Field ${field} visibility changed to ${visibility}`);
            }
        },
        updateSettings(newSettings) {
            const currentSettings = this.getSettings();
            const updatedSettings = { ...currentSettings, ...newSettings };
            const previousDataSignature = dependencies.createDataSettingsSignature(currentSettings);
            const nextDataSignature = dependencies.createDataSettingsSignature(updatedSettings);
            const dataSettingsChanged = hasDataSettingsUpdate(newSettings, dependencies.dataSignatureSources);
            resolveSettingsApi(dependencies).updateChartSettings(updatedSettings);
            dependencies.updateState("settings.charts", updatedSettings, {
                silent: false,
                source: "chartSettingsManager.updateSettings",
            });
            if (dataSettingsChanged ||
                previousDataSignature !== nextDataSignature) {
                dependencies.invalidateChartRenderCache("settings-update:data-changing");
            }
            if (dependencies.isRendered()) {
                dependencies.requestRerender("Settings updated");
            }
        },
    };
}
