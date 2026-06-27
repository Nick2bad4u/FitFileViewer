import { setupZoneData } from "../../data/processing/setupZoneData.js";
import { convertValueToUserUnits } from "../../formatting/converters/convertValueToUserUnits.js";
import { formatChartFields } from "../../formatting/display/formatChartFields.js";
import { computedStateManager } from "../../state/core/computedStateManager.js";
import {
    getChartFieldVisibility,
    getChartSetting,
    getChartSettings,
    getUserChartSettings,
    setChartFieldVisibility,
    setChartSetting,
    settingsStateManager,
    updateChartSettings,
} from "../../state/domain/settingsStateManager.js";
import { showRenderNotification } from "../../ui/notifications/showRenderNotification.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { createEnhancedChart } from "../components/createEnhancedChart.js";
import {
    addChartHoverEffects,
    addHoverEffectsToExistingCharts,
    removeChartHoverEffects,
} from "../plugins/addChartHoverEffects.js";
import { renderEventMessagesChart } from "../rendering/renderEventMessagesChart.js";
import { renderGPSTimeChart } from "../rendering/renderGPSTimeChart.js";
import { renderGPSTrackChart } from "../rendering/renderGPSTrackChart.js";
import { renderLapZoneCharts } from "../rendering/renderLapZoneCharts.js";
import { renderPerformanceAnalysisCharts } from "../rendering/renderPerformanceAnalysisCharts.js";
import { renderTimeInZoneCharts } from "../rendering/renderTimeInZoneCharts.js";

interface ComputedStateManagerAccess {
    addComputed(key: string, compute: () => unknown): unknown;
    get?(key: string): unknown;
    invalidate?(key: string): unknown;
    invalidateComputed?(key: string): unknown;
    list?(): unknown;
}

type FieldConverter = (value: number, field: string) => number;

interface HoverPluginAccessors {
    addChartHoverEffects: typeof addChartHoverEffects;
    addHoverEffectsToExistingCharts: typeof addHoverEffectsToExistingCharts;
    removeChartHoverEffects: typeof removeChartHoverEffects;
}

interface RendererModuleAccessors {
    createChartCanvas: typeof createChartCanvas;
    createEnhancedChart: typeof createEnhancedChart;
    renderEventMessagesChart: typeof renderEventMessagesChart;
    renderGPSTimeChart: typeof renderGPSTimeChart;
    renderGPSTrackChart: typeof renderGPSTrackChart;
    renderLapZoneCharts: typeof renderLapZoneCharts;
    renderPerformanceAnalysisCharts: typeof renderPerformanceAnalysisCharts;
    renderTimeInZoneCharts: typeof renderTimeInZoneCharts;
}

/** Legacy settings manager methods used by chart rendering. */
export interface SettingsStateManagerAccess {
    getChartFieldVisibility?(
        fieldKey: string,
        defaultVisibility?: string
    ): unknown;
    getChartSetting?(key: string): unknown;
    getChartSettings?(): unknown;
    getSetting?(category: string, key?: string): unknown;
    getUserChartSettings?(): unknown;
    setChartFieldVisibility?(fieldKey: string, visibility: string): unknown;
    setChartSetting?(key: string, value: unknown): unknown;
    setSetting?(category: string, value: unknown, key?: string): unknown;
    updateChartSettings?(updates: Record<string, unknown>): unknown;
}
type SetupZoneDataFunction = typeof setupZoneData;
type ShowRenderNotificationFunction = typeof showRenderNotification;

/** Optional UI manager methods used by chart rendering. */
export interface UIStateManagerAccess extends Record<string, unknown> {
    updateChartControlsUI?(enabled: boolean): unknown;
    updatePanelVisibility?(panelId: string, visible: boolean): unknown;
}

const importedSettingsStateManager: SettingsStateManagerAccess = {
    getChartFieldVisibility,
    getChartSetting,
    getChartSettings,
    getSetting: (category, key) =>
        settingsStateManager.getSetting(category, key),
    getUserChartSettings,
    setChartFieldVisibility,
    setChartSetting,
    setSetting: (category, value, key) =>
        settingsStateManager.setSetting(category, value, key),
    updateChartSettings,
};

/** Returns the computed state manager used by chart rendering. */
export function getComputedStateManagerSafe(): ComputedStateManagerAccess {
    return computedStateManager;
}

/** Returns the user-unit field converter. */
export function getConvertersSafe(): FieldConverter {
    return convertValueToUserUnits;
}

/** Returns chartable field keys. */
export function getFormatChartFieldsSafe(): readonly string[] {
    return formatChartFields;
}

/** Returns chart hover plugin hooks. */
export function getHoverPluginsSafe(): HoverPluginAccessors {
    return {
        addChartHoverEffects,
        addHoverEffectsToExistingCharts,
        removeChartHoverEffects,
    };
}

/** Returns chart renderer modules. */
export function getRendererModulesSafe(): RendererModuleAccessors {
    return {
        createChartCanvas,
        createEnhancedChart,
        renderEventMessagesChart,
        renderGPSTimeChart,
        renderGPSTrackChart,
        renderLapZoneCharts,
        renderPerformanceAnalysisCharts,
        renderTimeInZoneCharts,
    };
}

/** Returns the settings manager used by chart rendering. */
export function getSettingsStateManagerSafe(): SettingsStateManagerAccess {
    return importedSettingsStateManager;
}

/** Returns the zone-data setup function. */
export function getSetupZoneDataSafe(): SetupZoneDataFunction {
    return setupZoneData;
}

/**
 * Returns no optional panel manager; chart controls visibility is state-driven
 * through ChartStateManager subscriptions.
 */
export function getUIStateManagerMaybe(): UIStateManagerAccess | null {
    return null;
}

/** Returns the render-notification policy. */
export function getShowRenderNotificationSafe(): ShowRenderNotificationFunction {
    return showRenderNotification;
}
