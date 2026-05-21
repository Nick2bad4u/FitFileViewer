import { hasChartDataRecordMessages } from "./renderChartDataPreparation.js";
const STATE_MANAGER_MODULE_IDS = [
    "../../state/core/stateManager.js",
    "../../../state/core/stateManager.js",
    "../../../../utils/state/core/stateManager.js",
    "../../../../state/core/stateManager.js",
];
function readInjectedGlobalData(dependencies) {
    for (const id of STATE_MANAGER_MODULE_IDS) {
        try {
            const moduleValue = dependencies.getInjectedModule(id);
            const defaultExport = dependencies.getRecordValue(moduleValue, "default");
            const getState = dependencies.getRecordFunction(moduleValue, "getState") ??
                dependencies.getRecordFunction(defaultExport, "getState");
            if (getState) {
                const value = getState("globalData");
                if (value !== undefined) {
                    return value;
                }
            }
        }
        catch {
            // Try the next injected module id.
        }
    }
    return undefined;
}
function hasModuleInjection(dependencies) {
    return Boolean(dependencies.getInjectedModule("../../state/core/stateManager.js"));
}
function resolveHasValidData(dependencies) {
    let data = dependencies.getState("globalData");
    if (data === undefined || data === null) {
        try {
            const injectedData = readInjectedGlobalData(dependencies);
            if (injectedData !== undefined) {
                data = injectedData;
            }
        }
        catch {
            // Keep the original state value.
        }
    }
    if (data === undefined) {
        return null;
    }
    if (data === null) {
        return hasModuleInjection(dependencies) ? false : null;
    }
    return hasChartDataRecordMessages(data);
}
function resolveRenderableFields(state, dependencies) {
    if (!state.hasValidData) {
        return [];
    }
    const fields = dependencies.getFormatChartFields();
    return Array.isArray(fields)
        ? fields
            .filter((field) => typeof field === "string")
            .filter((field) => (dependencies.getFieldVisibility(field) || "visible") !==
            "hidden")
        : [];
}
/**
 * Creates the read-only chart state view backed by the centralized state store.
 *
 * @param dependencies - State and formatting accessors supplied by renderChartJS.
 * @returns A live chart state view.
 */
export function createChartStateView(dependencies) {
    const state = {
        get chartData() {
            return dependencies.getState("charts.chartData");
        },
        get chartOptions() {
            return dependencies.getState("charts.chartOptions") || {};
        },
        get controlsVisible() {
            return dependencies.getState("charts.controlsVisible") !== false;
        },
        get hasValidData() {
            return resolveHasValidData(dependencies);
        },
        get isRendered() {
            return Boolean(dependencies.getState("charts.isRendered"));
        },
        get isRendering() {
            return Boolean(dependencies.getState("charts.isRendering"));
        },
        get renderableFields() {
            return resolveRenderableFields(state, dependencies);
        },
        get selectedChart() {
            return dependencies.getState("charts.selectedChart") || "elevation";
        },
    };
    return state;
}
