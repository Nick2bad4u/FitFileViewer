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
import {
    getInjectedModule,
    getRecordFunction,
    getTypedRecordFunction,
    getRecordValue,
    isObjectRecord,
} from "./renderChartModuleHelpers.js";
import { getGlobalPanelVisibilityManager } from "./renderChartRuntimeHelpers.js";

interface ComputedStateManagerAccess {
    invalidateComputed?(key: string): unknown;
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

function isComputedStateManagerAccess(
    value: unknown
): value is ComputedStateManagerAccess {
    return (
        isObjectRecord(value) &&
        getRecordFunction(value, "invalidateComputed") !== null
    );
}

function isSettingsStateManagerAccess(
    value: unknown
): value is SettingsStateManagerAccess {
    return (
        isObjectRecord(value) &&
        (getRecordFunction(value, "getChartSettings") !== null ||
            getRecordFunction(value, "getSetting") !== null)
    );
}

/** Returns the computed state manager, preferring test-injected modules. */
export function getComputedStateManagerSafe(): ComputedStateManagerAccess {
    try {
        const mod = getInjectedModule(
            "../../state/core/computedStateManager.js"
        );
        const defaultExport = getRecordValue(mod, "default");
        const nested =
            getRecordValue(mod, "computedStateManager") ||
            getRecordValue(defaultExport, "computedStateManager") ||
            defaultExport;
        if (isComputedStateManagerAccess(nested)) {
            return nested;
        }

        if (isComputedStateManagerAccess(mod)) {
            return mod;
        }
    } catch {
        // Fall back to direct import below.
    }

    return computedStateManager;
}

/** Returns the user-unit field converter, preferring test-injected modules. */
export function getConvertersSafe(): FieldConverter {
    try {
        const mod = getInjectedModule(
            "../../formatting/converters/convertValueToUserUnits.js"
        );
        const convert = getRecordFunction(mod, "convertValueToUserUnits");
        if (convert) {
            return convert as FieldConverter;
        }
    } catch {
        // Fall back to direct import below.
    }

    return convertValueToUserUnits as FieldConverter;
}

/** Returns chartable field keys, preferring test-injected modules. */
export function getFormatChartFieldsSafe(): readonly string[] {
    try {
        const mod = getInjectedModule(
            "../../formatting/display/formatChartFields.js"
        );
        const defaultExport = getRecordValue(mod, "default");
        const fields =
            getRecordValue(mod, "formatChartFields") ||
            getRecordValue(defaultExport, "formatChartFields");
        return Array.isArray(fields) ? fields : formatChartFields;
    } catch {
        return formatChartFields;
    }
}

/** Returns chart hover plugin hooks, preferring test-injected modules. */
export function getHoverPluginsSafe(): HoverPluginAccessors {
    const result: HoverPluginAccessors = {
        addChartHoverEffects,
        addHoverEffectsToExistingCharts,
        removeChartHoverEffects,
    };

    try {
        const mod = getInjectedModule("../plugins/addChartHoverEffects.js");
        const injectedAdd = getTypedRecordFunction<typeof addChartHoverEffects>(
            mod,
            "addChartHoverEffects"
        );
        const injectedAddExisting = getTypedRecordFunction<
            typeof addHoverEffectsToExistingCharts
        >(mod, "addHoverEffectsToExistingCharts");
        const injectedRemove = getTypedRecordFunction<
            typeof removeChartHoverEffects
        >(mod, "removeChartHoverEffects");
        if (injectedAdd) {
            result.addChartHoverEffects = injectedAdd;
        }
        if (injectedAddExisting) {
            result.addHoverEffectsToExistingCharts = injectedAddExisting;
        }
        if (injectedRemove) {
            result.removeChartHoverEffects = injectedRemove;
        }
    } catch {
        // Keep direct imports.
    }

    return result;
}

/** Returns chart renderer modules, preferring test-injected modules. */
export function getRendererModulesSafe(): RendererModuleAccessors {
    const result: RendererModuleAccessors = {
        createChartCanvas,
        createEnhancedChart,
        renderEventMessagesChart,
        renderGPSTimeChart,
        renderGPSTrackChart,
        renderLapZoneCharts,
        renderPerformanceAnalysisCharts,
        renderTimeInZoneCharts,
    };

    try {
        const canvasModule = getInjectedModule(
            "../components/createChartCanvas.js"
        );
        const injectedCanvas = getTypedRecordFunction<typeof createChartCanvas>(
            canvasModule,
            "createChartCanvas"
        );
        if (injectedCanvas) {
            result.createChartCanvas = injectedCanvas;
        }

        const enhancedChartModule = getInjectedModule(
            "../components/createEnhancedChart.js"
        );
        const injectedEnhancedChart = getTypedRecordFunction<
            typeof createEnhancedChart
        >(enhancedChartModule, "createEnhancedChart");
        if (injectedEnhancedChart) {
            result.createEnhancedChart = injectedEnhancedChart;
        }

        const eventMessagesModule = getInjectedModule(
            "../rendering/renderEventMessagesChart.js"
        );
        const injectedEventMessages = getTypedRecordFunction<
            typeof renderEventMessagesChart
        >(eventMessagesModule, "renderEventMessagesChart");
        if (injectedEventMessages) {
            result.renderEventMessagesChart = injectedEventMessages;
        }

        const gpsTimeModule = getInjectedModule(
            "../rendering/renderGPSTimeChart.js"
        );
        const injectedGpsTime = getTypedRecordFunction<
            typeof renderGPSTimeChart
        >(gpsTimeModule, "renderGPSTimeChart");
        if (injectedGpsTime) {
            result.renderGPSTimeChart = injectedGpsTime;
        }

        const gpsTrackModule = getInjectedModule(
            "../rendering/renderGPSTrackChart.js"
        );
        const injectedGpsTrack = getTypedRecordFunction<
            typeof renderGPSTrackChart
        >(gpsTrackModule, "renderGPSTrackChart");
        if (injectedGpsTrack) {
            result.renderGPSTrackChart = injectedGpsTrack;
        }

        const lapZoneModule = getInjectedModule(
            "../rendering/renderLapZoneCharts.js"
        );
        const injectedLapZone = getTypedRecordFunction<
            typeof renderLapZoneCharts
        >(lapZoneModule, "renderLapZoneCharts");
        if (injectedLapZone) {
            result.renderLapZoneCharts = injectedLapZone;
        }

        const performanceModule = getInjectedModule(
            "../rendering/renderPerformanceAnalysisCharts.js"
        );
        const injectedPerformance = getTypedRecordFunction<
            typeof renderPerformanceAnalysisCharts
        >(performanceModule, "renderPerformanceAnalysisCharts");
        if (injectedPerformance) {
            result.renderPerformanceAnalysisCharts = injectedPerformance;
        }

        const timeInZoneModule = getInjectedModule(
            "../rendering/renderTimeInZoneCharts.js"
        );
        const injectedTimeInZone = getTypedRecordFunction<
            typeof renderTimeInZoneCharts
        >(timeInZoneModule, "renderTimeInZoneCharts");
        if (injectedTimeInZone) {
            result.renderTimeInZoneCharts = injectedTimeInZone;
        }
    } catch {
        // Keep direct imports.
    }

    return result;
}

/** Returns the settings manager, preferring test-injected modules. */
export function getSettingsStateManagerSafe(): SettingsStateManagerAccess {
    try {
        const mod = getInjectedModule(
            "../../state/domain/settingsStateManager.js"
        );
        if (isSettingsStateManagerAccess(mod)) {
            return mod;
        }

        const defaultExport = getRecordValue(mod, "default");
        const nested =
            getRecordValue(mod, "settingsStateManager") ||
            getRecordValue(defaultExport, "settingsStateManager");
        if (isSettingsStateManagerAccess(nested)) {
            return nested;
        }
    } catch {
        // Fall back to direct import below.
    }

    return importedSettingsStateManager;
}

/** Returns the zone-data setup function, preferring test-injected modules. */
export function getSetupZoneDataSafe(): SetupZoneDataFunction {
    try {
        const mod = getInjectedModule("../../data/processing/setupZoneData.js");
        const setup = getRecordFunction(mod, "setupZoneData");
        if (setup) {
            return setup as SetupZoneDataFunction;
        }
    } catch {
        // Fall back to direct import below.
    }

    return setupZoneData;
}

/** Returns the UI state manager when the app or tests expose one. */
export function getUIStateManagerMaybe(): UIStateManagerAccess | null {
    try {
        const ui = getGlobalPanelVisibilityManager();
        if (ui) {
            return ui as UIStateManagerAccess;
        }

        try {
            const mod = getInjectedModule(
                "../../state/domain/uiStateManager.js"
            );
            const defaultExport = getRecordValue(mod, "default");
            const candidate =
                getRecordValue(mod, "uiStateManager") ||
                getRecordValue(defaultExport, "uiStateManager") ||
                defaultExport;
            return isObjectRecord(candidate) ? candidate : null;
        } catch {
            // Fall through to null.
        }

        return null;
    } catch {
        return null;
    }
}

/** Returns the render-notification policy, preferring test-injected modules. */
export function getShowRenderNotificationSafe(): ShowRenderNotificationFunction {
    try {
        const mod = getInjectedModule(
            "../../ui/notifications/showRenderNotification.js"
        );
        const show = getRecordFunction(mod, "showRenderNotification");
        if (show) {
            return show as ShowRenderNotificationFunction;
        }
    } catch {
        // Fall back to direct import below.
    }

    return showRenderNotification;
}
