import { getActiveFitChartData } from "../../state/domain/fitChartDataState.js";

interface CreateChartStateViewDependencies {
    areChartsRendered(): boolean;
    areChartControlsVisible(): boolean;
    getChartData(): unknown;
    getChartOptions(): unknown;
    getFieldVisibility(field: string): unknown;
    getFormatChartFields(): unknown;
    getSelectedChart(): unknown;
    isChartRendering(): boolean;
}

/** Read-only live view of chart state derived from the centralized state store. */
export interface ChartStateView {
    readonly chartData: unknown;
    readonly chartOptions: unknown;
    readonly controlsVisible: boolean;
    readonly hasValidData: boolean | null;
    readonly isRendered: boolean;
    readonly isRendering: boolean;
    readonly renderableFields: string[];
    readonly selectedChart: unknown;
}

function resolveHasValidData(): boolean | null {
    const chartData = getActiveFitChartData();

    if (chartData.rawData === null) {
        return null;
    }

    return chartData.ready;
}

function resolveRenderableFields(
    state: ChartStateView,
    dependencies: CreateChartStateViewDependencies
): string[] {
    if (!state.hasValidData) {
        return [];
    }

    const fields = dependencies.getFormatChartFields();
    return Array.isArray(fields)
        ? fields
              .filter((field): field is string => typeof field === "string")
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
export function createChartStateView(
    dependencies: CreateChartStateViewDependencies
): ChartStateView {
    const state: ChartStateView = {
        get chartData() {
            return dependencies.getChartData();
        },

        get chartOptions() {
            return dependencies.getChartOptions();
        },

        get controlsVisible() {
            return dependencies.areChartControlsVisible();
        },

        get hasValidData() {
            return resolveHasValidData();
        },

        get isRendered() {
            return dependencies.areChartsRendered();
        },

        get isRendering() {
            return dependencies.isChartRendering();
        },

        get renderableFields() {
            return resolveRenderableFields(state, dependencies);
        },

        get selectedChart() {
            return dependencies.getSelectedChart();
        },
    };

    return state;
}
