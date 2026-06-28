import { destroyRegisteredChartInstances } from "./chartInstanceRegistry.js";
import { isObjectRecord } from "./renderChartModuleHelpers.js";

interface DebouncedChartStateManager {
    debouncedRender(reason: string): void;
}

interface PanelVisibilityManager {
    updatePanelVisibility(panelId: string, visible: boolean): void;
}

interface CreateChartActionsDependencies {
    appActions: unknown;
    clearChartRenderState(options: unknown): unknown;
    dateNow(): number;
    debouncedDirectRerender(reason: string): void;
    getControlsVisible(): boolean;
    getDebouncedChartStateManager(): DebouncedChartStateManager | null;
    getPanelVisibilityManager(): unknown;
    isLoadingStateSuppressed(): boolean;
    isRendered(): boolean;
    notifyChartRenderComplete(appActions: unknown, chartCount: number): void;
    setChartRendering(rendering: boolean, options: unknown): unknown;
    setState(path: string, value: unknown, options: unknown): unknown;
    updateState(path: string, value: unknown, options: unknown): unknown;
}

/** State-backed actions used by chart rendering integrations. */
export interface ChartActions {
    clearCharts(): void;
    completeRendering(
        success: boolean,
        chartCount?: number,
        renderTime?: number
    ): void;
    requestRerender(reason?: string): void;
    selectChart(chartType: string): void;
    startRendering(): void;
    toggleControls(): void;
}

function isPanelVisibilityManager(
    value: unknown
): value is PanelVisibilityManager {
    return (
        isObjectRecord(value) &&
        typeof value["updatePanelVisibility"] === "function"
    );
}

function getPanelVisibilityManager(
    value: unknown
): PanelVisibilityManager | null {
    return isPanelVisibilityManager(value) ? value : null;
}

/**
 * Creates chart action handlers backed by the centralized state store.
 *
 * @param dependencies - Runtime state, rendering, and notification
 *   dependencies.
 *
 * @returns Mutable chart action handlers for the renderer public API.
 */
export function createChartActions(
    dependencies: CreateChartActionsDependencies
): ChartActions {
    return {
        clearCharts() {
            destroyRegisteredChartInstances((index, error) => {
                console.warn(
                    `[ChartJS] Error destroying chart ${index}:`,
                    error
                );
            });

            dependencies.clearChartRenderState({
                silent: false,
                source: "chartActions.clearCharts",
            });
        },

        completeRendering(success, chartCount = 0, renderTime = 0) {
            dependencies.updateState(
                "charts",
                {
                    isRendered: success,
                    isRendering: false,
                    ...(success && {
                        lastRenderTime: dependencies.dateNow(),
                        renderedCount: chartCount,
                    }),
                },
                { silent: false, source: "chartActions.completeRendering" }
            );

            if (!dependencies.isLoadingStateSuppressed()) {
                dependencies.setState("isLoading", false, {
                    silent: false,
                    source: "chartActions.completeRendering",
                });
            }

            if (success) {
                dependencies.updateState(
                    "performance.renderTimes",
                    {
                        chart: renderTime,
                    },
                    { silent: false, source: "chartActions.completeRendering" }
                );

                dependencies.notifyChartRenderComplete(
                    dependencies.appActions,
                    chartCount
                );
            }
        },

        requestRerender(reason = "State change") {
            console.log(`[ChartJS] Re-render requested: ${reason}`);

            const chartStateManager =
                dependencies.getDebouncedChartStateManager();
            if (chartStateManager) {
                chartStateManager.debouncedRender(reason);
                return;
            }

            dependencies.debouncedDirectRerender(reason);
        },

        selectChart(chartType) {
            dependencies.setState("charts.selectedChart", chartType, {
                silent: false,
                source: "chartActions.selectChart",
            });

            if (dependencies.isRendered()) {
                this.requestRerender("Chart selection changed");
            }
        },

        startRendering() {
            dependencies.setChartRendering(true, {
                silent: false,
                source: "chartActions.startRendering",
            });

            if (!dependencies.isLoadingStateSuppressed()) {
                dependencies.setState("isLoading", true, {
                    silent: false,
                    source: "chartActions.startRendering",
                });
            }
        },

        toggleControls() {
            const newVisibility = !dependencies.getControlsVisible();
            dependencies.setState("charts.controlsVisible", newVisibility, {
                silent: false,
                source: "chartActions.toggleControls",
            });

            const uiManager = getPanelVisibilityManager(
                dependencies.getPanelVisibilityManager()
            );
            uiManager?.updatePanelVisibility("chart-controls", newVisibility);
        },
    };
}
