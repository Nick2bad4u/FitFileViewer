import { setupZoneData } from "../../data/processing/setupZoneData.js";
import { convertValueToUserUnits } from "../../formatting/converters/convertValueToUserUnits.js";
import { formatChartFields } from "../../formatting/display/formatChartFields.js";
import { computedStateManager } from "../../state/core/computedStateManager.js";
import { settingsStateManager } from "../../state/domain/settingsStateManager.js";
import { showRenderNotification } from "../../ui/notifications/showRenderNotification.js";
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
