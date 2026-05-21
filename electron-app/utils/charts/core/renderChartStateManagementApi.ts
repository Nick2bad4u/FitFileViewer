import type { ChartStateView } from "./renderChartStateView.js";
import type { MiddlewareDefinition } from "../../state/core/stateMiddleware.js";
import {
    initializeChartStateManagement as initializeChartStateManagementImpl,
    refreshChartsIfNeeded as refreshChartsIfNeededImpl,
} from "./renderChartStateManagement.js";

type ChartRefreshActions = {
    requestRerender(reason: string): void;
};

interface CreateChartStateManagementApiDependencies {
    chartActions: ChartRefreshActions;
    chartState: ChartStateView;
    getComputedStateManager(): {
        define?(key: string, compute: () => unknown): void;
    };
    getState(path: string): unknown;
    middlewareManager: {
        has?(key: string): boolean;
        register?(key: string, middleware: MiddlewareDefinition): void;
    };
    notify(
        message: string,
        type: "error" | "info" | "success" | "warning"
    ): unknown;
    updateState(path: string, value: unknown, options: unknown): void;
}

/** Public chart state-management facade exported through renderChartJS. */
export interface ChartStateManagementApi {
    initializeChartStateManagement(): void;
    refreshChartsIfNeeded(): boolean;
}

/**
 * Creates the state-management API exported by renderChartJS.
 *
 * @param dependencies - Runtime state, chart view, and refresh actions.
 *
 * @returns State-management methods preserving the renderChartJS public API.
 */
export function createChartStateManagementApi(
    dependencies: CreateChartStateManagementApiDependencies
): ChartStateManagementApi {
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
                hasValidData: () =>
                    Boolean(dependencies.chartState.hasValidData),
                isRendering: () => dependencies.chartState.isRendering,
                requestRerender: (reason) =>
                    dependencies.chartActions.requestRerender(reason),
            });
        },
    };
}
