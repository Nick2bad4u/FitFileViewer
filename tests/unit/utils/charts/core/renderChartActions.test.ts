import { describe, expect, it, vi } from "vitest";

import { createChartActions } from "../../../../../electron-app/utils/charts/core/renderChartActions.js";

function createDependencies() {
    const state = {
        charts: {
            isRendered: false,
            isRendering: true,
            lastRenderTime: 0,
            renderedCount: 0,
        },
        isLoading: true,
        performanceRenderTimes: {
            chart: 0,
        },
    };
    const dependencies = {
        appActions: {},
        dateNow: vi.fn(() => 1_717_249_600_000),
        debouncedDirectRerender: vi.fn(),
        getControlsVisible: vi.fn(() => true),
        getDebouncedChartStateManager: vi.fn(() => null),
        getPanelVisibilityManager: vi.fn(() => null),
        isLoadingStateSuppressed: vi.fn(() => false),
        isRendered: vi.fn(() => false),
        notifyChartRenderComplete: vi.fn(),
        setState: vi.fn((path: string, value: unknown) => {
            if (path === "isLoading") {
                state.isLoading = Boolean(value);
            }
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
    it("records successful render timestamps through the injected clock", () => {
        expect.assertions(6);

        const { dependencies, state } = createDependencies();
        const actions = createChartActions(dependencies);

        actions.completeRendering(true, 5, 250);

        expect(state).toStrictEqual({
            charts: {
                isRendered: true,
                isRendering: false,
                lastRenderTime: 1_717_249_600_000,
                renderedCount: 5,
            },
            isLoading: false,
            performanceRenderTimes: {
                chart: 250,
            },
        });
        expect(dependencies.dateNow).toHaveBeenCalledOnce();
        expect(dependencies.updateState).toHaveBeenNthCalledWith(
            1,
            "charts",
            {
                isRendered: true,
                isRendering: false,
                lastRenderTime: 1_717_249_600_000,
                renderedCount: 5,
            },
            { silent: false, source: "chartActions.completeRendering" }
        );
        expect(dependencies.setState).toHaveBeenCalledWith(
            "isLoading",
            false,
            { silent: false, source: "chartActions.completeRendering" }
        );
        expect(dependencies.updateState).toHaveBeenNthCalledWith(
            2,
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
                isRendered: false,
                isRendering: false,
                lastRenderTime: 0,
                renderedCount: 0,
            },
            isLoading: false,
            performanceRenderTimes: {
                chart: 0,
            },
        });
        expect(dependencies.dateNow).not.toHaveBeenCalled();
        expect(dependencies.updateState).toHaveBeenCalledWith(
            "charts",
            {
                isRendered: false,
                isRendering: false,
            },
            { silent: false, source: "chartActions.completeRendering" }
        );
        expect(dependencies.notifyChartRenderComplete).not.toHaveBeenCalled();
    });
});
