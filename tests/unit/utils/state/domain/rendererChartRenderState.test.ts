import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    areRendererChartsRendered,
    clearRendererChartRenderState,
    completeRendererChartRenderState,
    getRendererChartData,
    getRendererChartOptions,
    getRendererChartState,
    getRendererSelectedChart,
    initializeRendererChartRenderState,
    isRendererChartRendering,
    normalizeRendererChartsRendered,
    resetRendererChartRenderStateForDataChange,
    setRendererChartLastRenderTime,
    setRendererChartPreviousState,
    setRendererChartRendering,
    setRendererChartTabActive,
    setRendererChartsRendered,
    setRendererSelectedChart,
    subscribeToRendererChartsRendered,
    subscribeToRendererSelectedChart as subscribeToSelectedChart,
    updateRendererChartState,
} from "../../../../../electron-app/utils/state/domain/rendererChartRenderState.js";

describe("rendererChartRenderState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes chart rendered state through typed helpers", () => {
        expect.assertions(3);

        expect(areRendererChartsRendered()).toBe(false);

        setRendererChartsRendered(true);
        expect(areRendererChartsRendered()).toBe(true);

        setRendererChartsRendered(false);
        expect(areRendererChartsRendered()).toBe(false);
    });

    it("normalizes chart rendered values", () => {
        expect.assertions(3);

        expect(normalizeRendererChartsRendered(true)).toBe(true);
        expect(normalizeRendererChartsRendered(false)).toBe(false);
        expect(normalizeRendererChartsRendered("true")).toBe(false);
    });

    it("stores normalized chart render flags through direct state writes", () => {
        expect.assertions(5);

        stateManager.setState("charts.isRendered", "true", { source: "test" });
        expect(stateManager.getState("charts.isRendered")).toBe(false);

        stateManager.setState("charts.isRendering", "true", {
            source: "test",
        });
        expect(stateManager.getState("charts.isRendering")).toBe(false);

        stateManager.setState("charts.tabActive", true, { source: "test" });
        expect(stateManager.getState("charts.tabActive")).toBe(true);

        stateManager.setState(
            "charts",
            {
                controlsVisible: undefined,
                isRendered: true,
                isRendering: "true",
                tabActive: "yes",
            },
            { source: "test" }
        );
        expect(stateManager.getState("charts")).toMatchObject({
            isRendered: true,
            isRendering: false,
            tabActive: false,
        });
        expect(stateManager.getState("charts.controlsVisible")).toBeUndefined();
    });

    it("reads and updates the aggregate renderer chart state", () => {
        expect.assertions(4);

        expect(getRendererChartState()).toBeDefined();

        updateRendererChartState(
            {
                chartData: null,
                chartOptions: { responsive: true },
                isRendered: false,
                tabActive: false,
            },
            { source: "test" }
        );

        expect(getRendererChartState()).toMatchObject({
            chartData: null,
            chartOptions: { responsive: true },
            isRendered: false,
            tabActive: false,
        });
        expect(getRendererChartData()).toBeNull();
        expect(getRendererChartOptions()).toStrictEqual({ responsive: true });
    });

    it("initializes chart render state through the typed helper", () => {
        expect.assertions(1);

        initializeRendererChartRenderState({ source: "test.initialize" });

        expect(getRendererChartState()).toMatchObject({
            chartData: null,
            controlsVisible: true,
            isRendered: false,
            isRendering: false,
            previousState: {
                chartCount: 0,
                timestamp: 0,
                visibleFields: 0,
            },
            renderedCount: 0,
            selectedChart: "elevation",
        });
    });

    it("clears chart render state through the typed helper", () => {
        expect.assertions(1);

        updateRendererChartState(
            {
                chartData: { rows: [1] },
                isRendered: true,
                renderedCount: 4,
            },
            { source: "test" }
        );

        clearRendererChartRenderState({ source: "test.clear" });

        expect(getRendererChartState()).toMatchObject({
            chartData: null,
            isRendered: false,
            renderedCount: 0,
        });
    });

    it("resets data-change chart render state through the typed helper", () => {
        expect.assertions(1);

        updateRendererChartState(
            {
                chartData: { rows: [1] },
                isRendered: true,
                tabActive: true,
            },
            { source: "test" }
        );

        resetRendererChartRenderStateForDataChange({
            source: "test.dataChange",
        });

        expect(getRendererChartState()).toMatchObject({
            chartData: null,
            isRendered: false,
            tabActive: false,
        });
    });

    it("completes successful chart render state through the typed helper", () => {
        expect.assertions(1);

        completeRendererChartRenderState(
            {
                isRendered: true,
                lastRenderTime: 1234,
                renderedCount: 5,
            },
            { source: "test.complete" }
        );

        expect(getRendererChartState()).toMatchObject({
            isRendered: true,
            isRendering: false,
            lastRenderTime: 1234,
            renderedCount: 5,
        });
    });

    it("completes failed chart render state without changing success counters", () => {
        expect.assertions(1);

        updateRendererChartState(
            {
                isRendered: true,
                lastRenderTime: 1234,
                renderedCount: 5,
            },
            { source: "test" }
        );

        completeRendererChartRenderState(
            { isRendered: false },
            { source: "test.failed" }
        );

        expect(getRendererChartState()).toMatchObject({
            isRendered: false,
            isRendering: false,
            lastRenderTime: 1234,
            renderedCount: 5,
        });
    });

    it("writes chart rendering lifecycle flags", () => {
        expect.assertions(5);

        expect(isRendererChartRendering()).toBe(false);
        setRendererChartRendering(true, { source: "test" });
        setRendererChartTabActive(true, { source: "test" });
        setRendererChartLastRenderTime(1234, { source: "test" });

        expect(isRendererChartRendering()).toBe(true);
        expect(stateManager.getState("charts.isRendering")).toBe(true);
        expect(stateManager.getState("charts.tabActive")).toBe(true);
        expect(stateManager.getState("charts.lastRenderTime")).toBe(1234);
    });

    it("subscribes to selected chart changes", () => {
        expect.assertions(4);

        const changes: unknown[] = [];
        const unsubscribe = subscribeToSelectedChart((newValue) => {
            changes.push(newValue);
        });

        expect(getRendererSelectedChart()).toBe("elevation");

        setRendererSelectedChart("power", { source: "test" });
        expect(changes).toStrictEqual(["power"]);
        expect(getRendererSelectedChart()).toBe("power");

        unsubscribe();
        stateManager.setState("charts.selectedChart", "speed", {
            source: "test",
        });
        expect(changes).toStrictEqual(["power"]);
    });

    it("subscribes to chart rendered changes", () => {
        expect.assertions(2);

        const changes: unknown[] = [];
        const chartFlagSubscription = {
            stop: subscribeToRendererChartsRendered((newValue) => {
                changes.push(newValue);
            }),
        };

        setRendererChartsRendered(true, { source: "test" });
        expect(changes).toStrictEqual([true]);

        chartFlagSubscription.stop();
        setRendererChartsRendered(false, { source: "test" });
        expect(changes).toStrictEqual([true]);
    });

    it("writes previous chart render state", () => {
        expect.assertions(1);

        setRendererChartPreviousState(
            {
                chartCount: 4,
                timestamp: 1234,
                visibleFields: 3,
            },
            { source: "test" }
        );

        expect(stateManager.getState("charts.previousState")).toEqual({
            chartCount: 4,
            timestamp: 1234,
            visibleFields: 3,
        });
    });
});
