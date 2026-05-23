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
import { getGlobalPanelVisibilityManager } from "./renderChartRuntimeHelpers.js";
const importedSettingsStateManager = {
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
export function getComputedStateManagerSafe() {
    return computedStateManager;
}
/** Returns the user-unit field converter. */
export function getConvertersSafe() {
    return convertValueToUserUnits;
}
/** Returns chartable field keys. */
export function getFormatChartFieldsSafe() {
    return formatChartFields;
}
/** Returns chart hover plugin hooks. */
export function getHoverPluginsSafe() {
    return {
        addChartHoverEffects,
        addHoverEffectsToExistingCharts,
        removeChartHoverEffects,
    };
}
/** Returns chart renderer modules. */
export function getRendererModulesSafe() {
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
export function getSettingsStateManagerSafe() {
    return importedSettingsStateManager;
}
/** Returns the zone-data setup function. */
export function getSetupZoneDataSafe() {
    return setupZoneData;
}
/** Returns the UI state manager when the app or tests expose one. */
export function getUIStateManagerMaybe() {
    try {
        const ui = getGlobalPanelVisibilityManager();
        if (ui) {
            return ui;
        }
        return null;
    } catch {
        return null;
    }
}
/** Returns the render-notification policy. */
export function getShowRenderNotificationSafe() {
    return showRenderNotification;
}
