import { isObjectRecord } from "./renderChartModuleHelpers.js";

interface ComputedStateManager {
    invalidateComputed?(key: string): void;
}

interface DataSignatureSource {
    settingKey: string;
}

interface SettingsStateManager {
    getChartFieldVisibility?(
        fieldKey: string,
        defaultVisibility: string
    ): unknown;
    getChartSetting?(key: string): unknown;
    getChartSettings?(): unknown;
    getSetting?(scope: string, key?: string): unknown;
    getUserChartSettings?(): unknown;
    setChartFieldVisibility?(fieldKey: string, visibility: string): unknown;
    setChartSetting?(key: string, value: unknown): unknown;
    setSetting?(scope: string, value: unknown, key?: string): unknown;
    updateChartSettings?(updates: Record<string, unknown>): unknown;
}

interface ChartSettingsApi {
    getChartFieldVisibility(
        fieldKey: string,
        defaultVisibility: string
    ): unknown;
    getChartSettings(): unknown;
    setChartFieldVisibility(fieldKey: string, visibility: string): unknown;
    updateChartSettings(updates: Record<string, unknown>): unknown;
}

type CachedChartSettings = Record<string, unknown>;

interface CreateChartSettingsManagerDependencies {
    createDataSettingsSignature(settings: unknown): string;
    dataSignatureSources: readonly DataSignatureSource[];
    defaultMaxPoints: number;
    getComputedStateManager(): ComputedStateManager;
    getCachedChartSettings(): unknown;
    getRecordValue(value: unknown, key: string): unknown;
    getSettingsStateManager(): SettingsStateManager;
    invalidateChartRenderCache(reason: string): void;
    isRendered(): boolean;
    requestRerender(reason: string): void;
    setCachedChartSettings(
        settings: CachedChartSettings,
        options: unknown
    ): void;
    updateCachedChartSettings(
        settings: CachedChartSettings,
        options: unknown
    ): void;
}

/** State-backed chart settings access and mutation API. */
export interface ChartSettingsManager {
    getFieldVisibility(field: string): unknown;
    getSettings(): Record<string, unknown>;
    setFieldVisibility(field: string, visibility: string): void;
    updateSettings(newSettings: Record<string, unknown>): void;
}

function normalizeMaxpoints(
    rawMaxpoints: unknown,
    defaultMaxPoints: number
): number | "all" {
    if (rawMaxpoints === "all") {
        return "all";
    }

    if (typeof rawMaxpoints === "number" && Number.isFinite(rawMaxpoints)) {
        return rawMaxpoints;
    }

    if (
        typeof rawMaxpoints === "string" &&
        Number.isFinite(Number(rawMaxpoints))
    ) {
        return Number(rawMaxpoints);
    }

    return defaultMaxPoints;
}

function resolveChartSettingsApi(
    manager: SettingsStateManager
): ChartSettingsApi {
    const getChartSettings = manager.getUserChartSettings
        ? () => manager.getUserChartSettings?.()
        : resolveFallbackChartSettingsGetter(manager);

    return {
        getChartFieldVisibility: manager.getChartFieldVisibility
            ? (fieldKey, defaultVisibility) =>
                  manager.getChartFieldVisibility?.(fieldKey, defaultVisibility)
            : (fieldKey, defaultVisibility) => {
                  const visibilityMap =
                      manager.getSetting?.("chart", "fieldVisibility") ?? {};
                  return isObjectRecord(visibilityMap)
                      ? (visibilityMap[fieldKey] ?? defaultVisibility)
                      : defaultVisibility;
              },
        getChartSettings,
        setChartFieldVisibility: manager.setChartFieldVisibility
            ? (fieldKey, visibility) =>
                  manager.setChartFieldVisibility?.(fieldKey, visibility)
            : (fieldKey, visibility) => {
                  const visibilityMap =
                      manager.getSetting?.("chart", "fieldVisibility") ?? {};
                  const nextVisibility = {
                      ...(isObjectRecord(visibilityMap) ? visibilityMap : {}),
                      [fieldKey]: visibility,
                  };
                  manager.setSetting?.(
                      "chart",
                      nextVisibility,
                      "fieldVisibility"
                  );
                  return nextVisibility;
              },
        updateChartSettings: manager.updateChartSettings
            ? (updates) => manager.updateChartSettings?.(updates)
            : (updates) => {
                  for (const [key, value] of Object.entries(updates)) {
                      if (key === "fieldVisibility" && isObjectRecord(value)) {
                          const existing =
                              manager.getSetting?.(
                                  "chart",
                                  "fieldVisibility"
                              ) ?? {};
                          manager.setSetting?.(
                              "chart",
                              {
                                  ...(isObjectRecord(existing) ? existing : {}),
                                  ...value,
                              },
                              "fieldVisibility"
                          );
                          continue;
                      }
                      manager.setSetting?.("chart", value, key);
                  }
              },
    };
}

function resolveFallbackChartSettingsGetter(
    manager: SettingsStateManager
): ChartSettingsApi["getChartSettings"] {
    if (manager.getChartSettings) {
        return () => manager.getChartSettings?.();
    }

    return () => manager.getSetting?.("chart") ?? {};
}

function resolveSettingsApi(
    dependencies: CreateChartSettingsManagerDependencies
): ChartSettingsApi {
    return resolveChartSettingsApi(dependencies.getSettingsStateManager());
}

function normalizeChartSettings(
    settings: unknown,
    dependencies: CreateChartSettingsManagerDependencies
): Record<string, unknown> {
    const resolved = isObjectRecord(settings) ? settings : {};
    const rawMaxpoints = dependencies.getRecordValue(resolved, "maxpoints");

    return {
        ...resolved,
        animation: resolved["animation"] || "normal",
        chartType: resolved["chartType"] || "line",
        colors: resolved["colors"] || [],
        exportTheme: resolved["exportTheme"] || "auto",
        interpolation: resolved["interpolation"] || "linear",
        maxpoints: normalizeMaxpoints(
            rawMaxpoints,
            dependencies.defaultMaxPoints
        ),
        showFill: resolved["showFill"] === true,
        showGrid: resolved["showGrid"] !== false,
        showLegend: resolved["showLegend"] !== false,
        showPoints: resolved["showPoints"] === true,
        showTitle: resolved["showTitle"] !== false,
        smoothing: resolved["smoothing"] || 0.1,
    };
}

function asChartSettings(settings: unknown): CachedChartSettings {
    return isObjectRecord(settings) ? settings : {};
}

function hasDataSettingsUpdate(
    newSettings: Record<string, unknown>,
    dataSignatureSources: readonly DataSignatureSource[]
): boolean {
    return dataSignatureSources.some(
        ({ settingKey }) => settingKey in newSettings
    );
}

/**
 * Creates the chart settings manager used by renderChartJS orchestration.
 *
 * @param dependencies - State, persistence, invalidation, and rendering hooks.
 *
 * @returns Chart settings manager facade.
 */
export function createChartSettingsManager(
    dependencies: CreateChartSettingsManagerDependencies
): ChartSettingsManager {
    return {
        getFieldVisibility(field) {
            return resolveSettingsApi(dependencies).getChartFieldVisibility(
                field,
                "visible"
            );
        },

        getSettings() {
            let settings = dependencies.getCachedChartSettings();

            if (!settings) {
                settings = resolveSettingsApi(dependencies).getChartSettings();
                dependencies.setCachedChartSettings(asChartSettings(settings), {
                    silent: false,
                    source: "chartSettingsManager.getSettings",
                });
            }

            return normalizeChartSettings(settings, dependencies);
        },

        setFieldVisibility(field, visibility) {
            resolveSettingsApi(dependencies).setChartFieldVisibility(
                field,
                visibility
            );

            try {
                dependencies
                    .getComputedStateManager()
                    .invalidateComputed?.("charts.renderableFieldCount");
            } catch {
                // Ignore computed-state invalidation failures.
            }

            if (dependencies.isRendered()) {
                dependencies.requestRerender(
                    `Field ${field} visibility changed to ${visibility}`
                );
            }
        },

        updateSettings(newSettings) {
            const currentSettings = this.getSettings();
            const updatedSettings = { ...currentSettings, ...newSettings };
            const previousDataSignature =
                dependencies.createDataSettingsSignature(currentSettings);
            const nextDataSignature =
                dependencies.createDataSettingsSignature(updatedSettings);
            const dataSettingsChanged = hasDataSettingsUpdate(
                newSettings,
                dependencies.dataSignatureSources
            );

            resolveSettingsApi(dependencies).updateChartSettings(
                updatedSettings
            );

            dependencies.updateCachedChartSettings(updatedSettings, {
                silent: false,
                source: "chartSettingsManager.updateSettings",
            });

            if (
                dataSettingsChanged ||
                previousDataSignature !== nextDataSignature
            ) {
                dependencies.invalidateChartRenderCache(
                    "settings-update:data-changing"
                );
            }

            if (dependencies.isRendered()) {
                dependencies.requestRerender("Settings updated");
            }
        },
    };
}
