import { setupZoneData } from "../../data/processing/setupZoneData.js";
import { convertValueToUserUnits } from "../../formatting/converters/convertValueToUserUnits.js";
import { formatChartFields } from "../../formatting/display/formatChartFields.js";
import { computedStateManager } from "../../state/core/computedStateManager.js";
import { settingsStateManager } from "../../state/domain/settingsStateManager.js";
import { showRenderNotification } from "../../ui/notifications/showRenderNotification.js";
import {
    getInjectedModule,
    getRecordFunction,
    getRecordValue,
} from "./renderChartModuleHelpers.js";
import { getGlobalPanelVisibilityManager } from "./renderChartRuntimeHelpers.js";

type ComputedStateManagerAccess = Record<string, unknown>;
type FieldConverter = (value: number, field: string) => number;

/** Legacy settings manager methods used by chart rendering. */
export interface SettingsStateManagerAccess extends Record<string, unknown> {
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
        if (nested && typeof nested === "object") {
            return nested as ComputedStateManagerAccess;
        }

        if (getRecordFunction(mod, "invalidateComputed")) {
            return mod as ComputedStateManagerAccess;
        }
    } catch {
        // Fall back to direct import below.
    }

    return computedStateManager as unknown as ComputedStateManagerAccess;
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

/** Returns the settings manager, preferring test-injected modules. */
export function getSettingsStateManagerSafe(): SettingsStateManagerAccess {
    try {
        const mod = getInjectedModule(
            "../../state/domain/settingsStateManager.js"
        );
        if (getRecordFunction(mod, "getChartSettings")) {
            return mod as SettingsStateManagerAccess;
        }

        const defaultExport = getRecordValue(mod, "default");
        const nested =
            getRecordValue(mod, "settingsStateManager") ||
            getRecordValue(defaultExport, "settingsStateManager");
        if (nested && typeof nested === "object") {
            return nested as SettingsStateManagerAccess;
        }
    } catch {
        // Fall back to direct import below.
    }

    return settingsStateManager as unknown as SettingsStateManagerAccess;
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
            return candidate && typeof candidate === "object"
                ? (candidate as UIStateManagerAccess)
                : null;
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
