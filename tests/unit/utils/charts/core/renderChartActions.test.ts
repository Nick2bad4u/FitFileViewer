import { describe, expect, it, vi } from "vitest";

import { createChartActions } from "../../../../../electron-app/utils/charts/core/renderChartActions.js";

function createDependencies() {
    const state = {
        charts: {
            controlsVisible: true,
            isRendered: false,
            isRendering: true,
            lastRenderTime: 0,
            renderedCount: 0,
            selectedChart: "elevation",
        },
        isLoading: true,
        performanceRenderTimes: {
            chart: 0,
        },
    };
    const dependencies = {
        appActions: {},
        clearChartRenderState: vi.fn(() => {
            Object.assign(state.charts, {
                chartData: null,
                isRendered: false,
                renderedCount: 0,
            });
        }),
        completeChartRenderLifecycleState: vi.fn((renderState: unknown) => {
            if (typeof renderState !== "object" || renderState === null) {
                return;
            }

            Object.assign(state.charts, {
                isRendered: false,
                isRendering: false,
                ...renderState,
            });
        }),
        dateNow: vi.fn(() => 1_717_249_600_000),
        debouncedDirectRerender: vi.fn(),
        getControlsVisible: vi.fn(() => state.charts.controlsVisible),
        getDebouncedChartStateManager: vi.fn(() => null),
        getPanelVisibilityManager: vi.fn(() => null),
        isLoadingStateSuppressed: vi.fn(() => false),
        isRendered: vi.fn(() => false),
        notifyChartRenderComplete: vi.fn(),
        setChartControlsVisible: vi.fn((visible: boolean) => {
            state.charts.controlsVisible = visible;
        }),
        setChartRendering: vi.fn((rendering: boolean) => {
            state.charts.isRendering = rendering;
        }),
        setLoadingState: vi.fn((loading: boolean) => {
            state.isLoading = loading;
        }),
        setSelectedChart: vi.fn((chartType: string) => {
            state.charts.selectedChart = chartType;
        }),
        updateState: vi.fn((path: string, value: unknown) => {
            if (typeof value !== "object" || value === null) {
                return;
            }

            if (path === "charts") {
                Object.assign(state.charts, value);
            }

            if (path === "performance.renderTimes") {
                Object.assign(state.performanceRenderTimes, value);
            }
        }),
    };

    return { dependencies, state };
}

describe("createChartActions", () => {
    it("clears chart render state through the chart render-state dependency", () => {
        expect.assertions(4);

        const { dependencies, state } = createDependencies();
        state.charts.isRendered = true;
        state.charts.renderedCount = 5;
        const actions = createChartActions(dependencies);

        actions.clearCharts();

        expect(state.charts).toMatchObject({
            isRendered: false,
            renderedCount: 0,
        });
        expect(dependencies.clearChartRenderState).toHaveBeenCalledWith({
            silent: false,
            source: "chartActions.clearCharts",
        });
        expect(dependencies.updateState).not.toHaveBeenCalledWith(
            "charts",
            expect.objectContaining({ isRendered: false }),
            expect.any(Object)
        );
        expect(dependencies.updateState).not.toHaveBeenCalledWith(
            "charts",
            expect.objectContaining({ renderedCount: 0 }),
            expect.any(Object)
        );
    });

    it("records successful render timestamps through the injected clock", () => {
        expect.assertions(6);

        const { dependencies, state } = createDependencies();
        const actions = createChartActions(dependencies);

        actions.completeRendering(true, 5, 250);

        expect(state).toStrictEqual({
            charts: {
                controlsVisible: true,
                isRendered: true,
                isRendering: false,
                lastRenderTime: 1_717_249_600_000,
                renderedCount: 5,
                selectedChart: "elevation",
            },
            isLoading: false,
            performanceRenderTimes: {
                chart: 250,
            },
        });
        expect(dependencies.dateNow).toHaveBeenCalledOnce();
        expect(
            dependencies.completeChartRenderLifecycleState
        ).toHaveBeenCalledWith(
            {
                isRendered: true,
                lastRenderTime: 1_717_249_600_000,
                renderedCount: 5,
            },
            { silent: false, source: "chartActions.completeRendering" }
        );
        expect(dependencies.setLoadingState).toHaveBeenCalledWith(false, {
            silent: false,
            source: "chartActions.completeRendering",
        });
        expect(dependencies.updateState).toHaveBeenCalledWith(
            "performance.renderTimes",
            { chart: 250 },
            { silent: false, source: "chartActions.completeRendering" }
        );
        expect(dependencies.notifyChartRenderComplete).toHaveBeenCalledWith(
            dependencies.appActions,
            5
        );
    });

    it("does not read the render timestamp clock for failed renders", () => {
        expect.assertions(4);

        const { dependencies, state } = createDependencies();
        const actions = createChartActions(dependencies);

        actions.completeRendering(false, 0, 100);

        expect(state).toStrictEqual({
            charts: {
                controlsVisible: true,
                isRendered: false,
                isRendering: false,
                lastRenderTime: 0,
                renderedCount: 0,
                selectedChart: "elevation",
            },
            isLoading: false,
            performanceRenderTimes: {
                chart: 0,
            },
        });
        expect(dependencies.dateNow).not.toHaveBeenCalled();
        expect(
            dependencies.completeChartRenderLifecycleState
        ).toHaveBeenCalledWith(
            { isRendered: false },
            { silent: false, source: "chartActions.completeRendering" }
        );
        expect(dependencies.notifyChartRenderComplete).not.toHaveBeenCalled();
    });

    it("starts rendering through the chart render-state dependency", () => {
        expect.assertions(4);

        const { dependencies, state } = createDependencies();
        state.charts.isRendering = false;
        state.isLoading = false;
        const actions = createChartActions(dependencies);

        actions.startRendering();

        expect(state.charts.isRendering).toBe(true);
        expect(state.isLoading).toBe(true);
        expect(dependencies.setChartRendering).toHaveBeenCalledWith(true, {
            silent: false,
            source: "chartActions.startRendering",
        });
        expect(dependencies.setLoadingState).toHaveBeenCalledWith(true, {
            silent: false,
            source: "chartActions.startRendering",
        });
    });

    it("selects charts through the chart render-state dependency", () => {
        expect.assertions(3);

        const { dependencies, state } = createDependencies();
        dependencies.isRendered.mockReturnValue(true);
        const actions = createChartActions(dependencies);

        actions.selectChart("power");

        expect(state.charts.selectedChart).toBe("power");
        expect(dependencies.setSelectedChart).toHaveBeenCalledWith("power", {
            silent: false,
            source: "chartActions.selectChart",
        });
        expect(dependencies.debouncedDirectRerender).toHaveBeenCalledWith(
            "Chart selection changed"
        );
    });

    it("toggles controls through the chart controls-state dependency", () => {
        expect.assertions(3);

        const { dependencies, state } = createDependencies();
        const actions = createChartActions(dependencies);

        actions.toggleControls();

        expect(state.charts.controlsVisible).toBe(false);
        expect(dependencies.setChartControlsVisible).toHaveBeenCalledWith(
            false,
            {
                silent: false,
                source: "chartActions.toggleControls",
            }
        );
        expect(dependencies.getPanelVisibilityManager).toHaveBeenCalledWith();
    });
});
