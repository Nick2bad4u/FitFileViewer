import { initializeChartStateManagement as initializeChartStateManagementImpl, refreshChartsIfNeeded as refreshChartsIfNeededImpl, } from "./renderChartStateManagement.js";
/**
 * Creates the state-management API exported by renderChartJS.
 *
 * @param dependencies - Runtime state, chart view, and refresh actions.
 * @returns State-management methods preserving the renderChartJS public API.
 */
export function createChartStateManagementApi(dependencies) {
    return {
        initializeChartStateManagement() {
            return initializeChartStateManagementImpl({
                getChartSummaryState: () => ({
                    hasValidData: Boolean(dependencies.chartState.hasValidData),
                    isRendered: dependencies.chartState.isRendered,
                    renderableFields: dependencies.chartState.renderableFields,
                }),
                getComputedStateManager: dependencies.getComputedStateManager,
                getState: dependencies.getState,
                middlewareManager: dependencies.middlewareManager,
                notify: dependencies.notify,
                updateState: dependencies.updateState,
            });
        },
        refreshChartsIfNeeded() {
            return refreshChartsIfNeededImpl({
                hasValidData: () => Boolean(dependencies.chartState.hasValidData),
                isRendering: () => dependencies.chartState.isRendering,
                requestRerender: (reason) => dependencies.chartActions.requestRerender(reason),
            });
        },
    };
}
