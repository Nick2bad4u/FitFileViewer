import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    areRendererChartsRendered,
    getRendererChartState,
    normalizeRendererChartsRendered,
    setRendererChartLastRenderTime,
    setRendererChartPreviousState,
    setRendererChartRendering,
    setRendererChartTabActive,
    setRendererChartsRendered,
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
        expect.assertions(2);

        expect(getRendererChartState()).toBeDefined();

        updateRendererChartState(
            {
                chartData: null,
                isRendered: false,
                tabActive: false,
            },
            { source: "test" }
        );

        expect(getRendererChartState()).toMatchObject({
            chartData: null,
            isRendered: false,
            tabActive: false,
        });
    });

    it("writes chart rendering lifecycle flags", () => {
        expect.assertions(3);

        setRendererChartRendering(true, { source: "test" });
        setRendererChartTabActive(true, { source: "test" });
        setRendererChartLastRenderTime(1234, { source: "test" });

        expect(stateManager.getState("charts.isRendering")).toBe(true);
        expect(stateManager.getState("charts.tabActive")).toBe(true);
        expect(stateManager.getState("charts.lastRenderTime")).toBe(1234);
    });

    it("subscribes to selected chart changes", () => {
        expect.assertions(2);

        const changes: unknown[] = [];
        const unsubscribe = subscribeToSelectedChart((newValue) => {
            changes.push(newValue);
        });

        stateManager.setState("charts.selectedChart", "power", {
            source: "test",
        });
        expect(changes).toStrictEqual(["power"]);

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
