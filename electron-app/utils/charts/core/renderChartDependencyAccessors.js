import { setupZoneData } from "../../data/processing/setupZoneData.js";
import { convertValueToUserUnits } from "../../formatting/converters/convertValueToUserUnits.js";
import { formatChartFields } from "../../formatting/display/formatChartFields.js";
import { computedStateManager } from "../../state/core/computedStateManager.js";
import { settingsStateManager } from "../../state/domain/settingsStateManager.js";
import { showRenderNotification } from "../../ui/notifications/showRenderNotification.js";
import { createChartCanvas } from "../components/createChartCanvas.js";
import { createEnhancedChart } from "../components/createEnhancedChart.js";
import { addChartHoverEffects, addHoverEffectsToExistingCharts, removeChartHoverEffects, } from "../plugins/addChartHoverEffects.js";
import { renderEventMessagesChart } from "../rendering/renderEventMessagesChart.js";
import { renderGPSTimeChart } from "../rendering/renderGPSTimeChart.js";
import { renderGPSTrackChart } from "../rendering/renderGPSTrackChart.js";
import { renderLapZoneCharts } from "../rendering/renderLapZoneCharts.js";
import { renderPerformanceAnalysisCharts } from "../rendering/renderPerformanceAnalysisCharts.js";
import { renderTimeInZoneCharts } from "../rendering/renderTimeInZoneCharts.js";
import { getInjectedModule, getRecordFunction, getRecordValue, } from "./renderChartModuleHelpers.js";
import { getGlobalPanelVisibilityManager } from "./renderChartRuntimeHelpers.js";
/** Returns the computed state manager, preferring test-injected modules. */
export function getComputedStateManagerSafe() {
    try {
        const mod = getInjectedModule("../../state/core/computedStateManager.js");
        const defaultExport = getRecordValue(mod, "default");
        const nested = getRecordValue(mod, "computedStateManager") ||
            getRecordValue(defaultExport, "computedStateManager") ||
            defaultExport;
        if (nested && typeof nested === "object") {
            return nested;
        }
        if (getRecordFunction(mod, "invalidateComputed")) {
            return mod;
        }
    }
    catch {
        // Fall back to direct import below.
    }
    return computedStateManager;
}
/** Returns the user-unit field converter, preferring test-injected modules. */
export function getConvertersSafe() {
    try {
        const mod = getInjectedModule("../../formatting/converters/convertValueToUserUnits.js");
        const convert = getRecordFunction(mod, "convertValueToUserUnits");
        if (convert) {
            return convert;
        }
    }
    catch {
        // Fall back to direct import below.
    }
    return convertValueToUserUnits;
}
/** Returns chartable field keys, preferring test-injected modules. */
export function getFormatChartFieldsSafe() {
    try {
        const mod = getInjectedModule("../../formatting/display/formatChartFields.js");
        const defaultExport = getRecordValue(mod, "default");
        const fields = getRecordValue(mod, "formatChartFields") ||
            getRecordValue(defaultExport, "formatChartFields");
        return Array.isArray(fields) ? fields : formatChartFields;
    }
    catch {
        return formatChartFields;
    }
}
/** Returns chart hover plugin hooks, preferring test-injected modules. */
export function getHoverPluginsSafe() {
    const result = {
        addChartHoverEffects: addChartHoverEffects,
        addHoverEffectsToExistingCharts: addHoverEffectsToExistingCharts,
        removeChartHoverEffects: removeChartHoverEffects,
    };
    try {
        const mod = getInjectedModule("../plugins/addChartHoverEffects.js");
        const injectedAdd = getRecordFunction(mod, "addChartHoverEffects");
        const injectedAddExisting = getRecordFunction(mod, "addHoverEffectsToExistingCharts");
        const injectedRemove = getRecordFunction(mod, "removeChartHoverEffects");
        if (injectedAdd) {
            result.addChartHoverEffects = injectedAdd;
        }
        if (injectedAddExisting) {
            result.addHoverEffectsToExistingCharts = injectedAddExisting;
        }
        if (injectedRemove) {
            result.removeChartHoverEffects = injectedRemove;
        }
    }
    catch {
        // Keep direct imports.
    }
    return result;
}
/** Returns chart renderer modules, preferring test-injected modules. */
export function getRendererModulesSafe() {
    const result = {
        createChartCanvas: createChartCanvas,
        createEnhancedChart: createEnhancedChart,
        renderEventMessagesChart: renderEventMessagesChart,
        renderGPSTimeChart: renderGPSTimeChart,
        renderGPSTrackChart: renderGPSTrackChart,
        renderLapZoneCharts: renderLapZoneCharts,
        renderPerformanceAnalysisCharts: renderPerformanceAnalysisCharts,
        renderTimeInZoneCharts: renderTimeInZoneCharts,
    };
    try {
        const canvasModule = getInjectedModule("../components/createChartCanvas.js");
        const injectedCanvas = getRecordFunction(canvasModule, "createChartCanvas");
        if (injectedCanvas) {
            result.createChartCanvas = injectedCanvas;
        }
        const enhancedChartModule = getInjectedModule("../components/createEnhancedChart.js");
        const injectedEnhancedChart = getRecordFunction(enhancedChartModule, "createEnhancedChart");
        if (injectedEnhancedChart) {
            result.createEnhancedChart = injectedEnhancedChart;
        }
        const eventMessagesModule = getInjectedModule("../rendering/renderEventMessagesChart.js");
        const injectedEventMessages = getRecordFunction(eventMessagesModule, "renderEventMessagesChart");
        if (injectedEventMessages) {
            result.renderEventMessagesChart = injectedEventMessages;
        }
        const gpsTimeModule = getInjectedModule("../rendering/renderGPSTimeChart.js");
        const injectedGpsTime = getRecordFunction(gpsTimeModule, "renderGPSTimeChart");
        if (injectedGpsTime) {
            result.renderGPSTimeChart = injectedGpsTime;
        }
        const gpsTrackModule = getInjectedModule("../rendering/renderGPSTrackChart.js");
        const injectedGpsTrack = getRecordFunction(gpsTrackModule, "renderGPSTrackChart");
        if (injectedGpsTrack) {
            result.renderGPSTrackChart = injectedGpsTrack;
        }
        const lapZoneModule = getInjectedModule("../rendering/renderLapZoneCharts.js");
        const injectedLapZone = getRecordFunction(lapZoneModule, "renderLapZoneCharts");
        if (injectedLapZone) {
            result.renderLapZoneCharts = injectedLapZone;
        }
        const performanceModule = getInjectedModule("../rendering/renderPerformanceAnalysisCharts.js");
        const injectedPerformance = getRecordFunction(performanceModule, "renderPerformanceAnalysisCharts");
        if (injectedPerformance) {
            result.renderPerformanceAnalysisCharts = injectedPerformance;
        }
        const timeInZoneModule = getInjectedModule("../rendering/renderTimeInZoneCharts.js");
        const injectedTimeInZone = getRecordFunction(timeInZoneModule, "renderTimeInZoneCharts");
        if (injectedTimeInZone) {
            result.renderTimeInZoneCharts = injectedTimeInZone;
        }
    }
    catch {
        // Keep direct imports.
    }
    return result;
}
/** Returns the settings manager, preferring test-injected modules. */
export function getSettingsStateManagerSafe() {
    try {
        const mod = getInjectedModule("../../state/domain/settingsStateManager.js");
        if (getRecordFunction(mod, "getChartSettings")) {
            return mod;
        }
        const defaultExport = getRecordValue(mod, "default");
        const nested = getRecordValue(mod, "settingsStateManager") ||
            getRecordValue(defaultExport, "settingsStateManager");
        if (nested && typeof nested === "object") {
            return nested;
        }
    }
    catch {
        // Fall back to direct import below.
    }
    return settingsStateManager;
}
/** Returns the zone-data setup function, preferring test-injected modules. */
export function getSetupZoneDataSafe() {
    try {
        const mod = getInjectedModule("../../data/processing/setupZoneData.js");
        const setup = getRecordFunction(mod, "setupZoneData");
        if (setup) {
            return setup;
        }
    }
    catch {
        // Fall back to direct import below.
    }
    return setupZoneData;
}
/** Returns the UI state manager when the app or tests expose one. */
export function getUIStateManagerMaybe() {
    try {
        const ui = getGlobalPanelVisibilityManager();
        if (ui) {
            return ui;
        }
        try {
            const mod = getInjectedModule("../../state/domain/uiStateManager.js");
            const defaultExport = getRecordValue(mod, "default");
            const candidate = getRecordValue(mod, "uiStateManager") ||
                getRecordValue(defaultExport, "uiStateManager") ||
                defaultExport;
            return candidate && typeof candidate === "object"
                ? candidate
                : null;
        }
        catch {
            // Fall through to null.
        }
        return null;
    }
    catch {
        return null;
    }
}
/** Returns the render-notification policy, preferring test-injected modules. */
export function getShowRenderNotificationSafe() {
    try {
        const mod = getInjectedModule("../../ui/notifications/showRenderNotification.js");
        const show = getRecordFunction(mod, "showRenderNotification");
        if (show) {
            return show;
        }
    }
    catch {
        // Fall back to direct import below.
    }
    return showRenderNotification;
}
