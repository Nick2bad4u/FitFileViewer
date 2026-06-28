import type { ChartStateView } from "./renderChartStateView.js";
import type { MiddlewareDefinition } from "../../state/core/stateMiddleware.js";
import {
    initializeChartStateManagement as initializeChartStateManagementImpl,
    refreshChartsIfNeeded as refreshChartsIfNeededImpl,
} from "./renderChartStateManagement.js";

type ChartRefreshActions = {
    requestRerender(reason: string): void;
};

type NotificationType = "error" | "info" | "success" | "warning";

interface CreateChartStateManagementApiDependencies {
    chartActions: ChartRefreshActions;
    chartState: ChartStateView;
    getComputedStateManager(): {
        addComputed(key: string, compute: () => unknown): void;
    };
    getLastRenderTime(): unknown;
    getRenderedCount(): unknown;
    middlewareManager: {
        has?(key: string): boolean;
        register?(key: string, middleware: MiddlewareDefinition): void;
    };
    notify(
        message: string,
        type: "error" | "info" | "success" | "warning"
    ): unknown;
    initializeChartRenderState(options: unknown): void;
}

function normalizeNotificationType(type: string): NotificationType {
    return type === "error" ||
        type === "info" ||
        type === "success" ||
        type === "warning"
        ? type
        : "info";
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
                getComputedStateManager: () =>
                    dependencies.getComputedStateManager(),
                getLastRenderTime: dependencies.getLastRenderTime,
                getRenderedCount: dependencies.getRenderedCount,
                initializeChartRenderState: (options) =>
                    dependencies.initializeChartRenderState(options),
                middlewareManager: dependencies.middlewareManager,
                notify: (message, type) =>
                    dependencies.notify(
                        message,
                        normalizeNotificationType(type)
                    ),
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
