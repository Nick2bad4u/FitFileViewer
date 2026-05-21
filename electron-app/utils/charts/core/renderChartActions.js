import { hasDestroy, isObjectRecord } from "./renderChartModuleHelpers.js";
function isPanelVisibilityManager(value) {
    return (isObjectRecord(value) &&
        typeof value["updatePanelVisibility"] === "function");
}
function getPanelVisibilityManager(value) {
    return isPanelVisibilityManager(value) ? value : null;
}
/**
 * Creates chart action handlers backed by the centralized state store.
 *
 * @param dependencies - Runtime state, rendering, and global bridge
 *   dependencies.
 *
 * @returns Mutable chart action handlers for the renderer public API.
 */
export function createChartActions(dependencies) {
    return {
        clearCharts() {
            if (dependencies.chartGlobal._chartjsInstances) {
                for (const [index, chart,] of dependencies.chartGlobal._chartjsInstances.entries()) {
                    try {
                        if (hasDestroy(chart)) {
                            chart.destroy();
                        }
                    }
                    catch (error) {
                        console.warn(`[ChartJS] Error destroying chart ${index}:`, error);
                    }
                }
                dependencies.chartGlobal._chartjsInstances = [];
            }
            dependencies.updateState("charts", {
                chartData: null,
                isRendered: false,
                renderedCount: 0,
            }, { silent: false, source: "chartActions.clearCharts" });
        },
        completeRendering(success, chartCount = 0, renderTime = 0) {
            dependencies.updateState("charts", {
                isRendered: success,
                isRendering: false,
                ...(success && {
                    lastRenderTime: Date.now(),
                    renderedCount: chartCount,
                }),
            }, { silent: false, source: "chartActions.completeRendering" });
            if (!dependencies.isLoadingStateSuppressed()) {
                dependencies.setState("isLoading", false, {
                    silent: false,
                    source: "chartActions.completeRendering",
                });
            }
            if (success) {
                dependencies.updateState("performance.renderTimes", {
                    chart: renderTime,
                }, { silent: false, source: "chartActions.completeRendering" });
                dependencies.notifyChartRenderComplete(dependencies.appActions, chartCount);
            }
        },
        requestRerender(reason = "State change") {
            console.log(`[ChartJS] Re-render requested: ${reason}`);
            const chartStateManager = dependencies.getDebouncedChartStateManager();
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
            dependencies.setState("charts.isRendering", true, {
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
            const uiManager = getPanelVisibilityManager(dependencies.getPanelVisibilityManager());
            uiManager?.updatePanelVisibility("chart-controls", newVisibility);
        },
    };
}
