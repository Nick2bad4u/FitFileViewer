import { hasChartDataRecordMessages } from "./renderChartDataPreparation.js";
function resolveHasValidData(dependencies) {
    const data = dependencies.getState("globalData");
    if (data === undefined || data === null) {
        return null;
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
              .filter(
                  (field) =>
                      (dependencies.getFieldVisibility(field) || "visible") !==
                      "hidden"
              )
        : [];
}
/**
 * Creates the read-only chart state view backed by the centralized state store.
 *
 * @param dependencies - State and formatting accessors supplied by
 *   renderChartJS.
 *
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
