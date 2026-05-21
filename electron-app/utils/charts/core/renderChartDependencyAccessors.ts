import { setupZoneData } from "../../data/processing/setupZoneData.js";
import { convertValueToUserUnits } from "../../formatting/converters/convertValueToUserUnits.js";
import { formatChartFields } from "../../formatting/display/formatChartFields.js";
import { computedStateManager } from "../../state/core/computedStateManager.js";
import { showRenderNotification } from "../../ui/notifications/showRenderNotification.js";
import {
    getInjectedModule,
    getRecordFunction,
    getRecordValue,
} from "./renderChartModuleHelpers.js";

type ComputedStateManagerAccess = Record<string, unknown>;
type FieldConverter = (value: number, field: string) => number;
type SetupZoneDataFunction = typeof setupZoneData;
type ShowRenderNotificationFunction = typeof showRenderNotification;

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
