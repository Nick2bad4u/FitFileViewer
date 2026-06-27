import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    areRendererTablesRendered,
    getRendererMapState,
    getRendererPerformanceMetrics,
    isRendererMapMeasurementModeEnabled,
    setAppInitialized,
    setAppIsOpeningFile,
    setMapMeasurementMode,
    setMapSelectedLap,
    setPerformanceLastLoadTime,
    setRendererTablesRendered,
    updateAppActionWindowState,
    updateRendererMapState,
    updateRendererPerformanceRenderTimes,
    updateRendererTableState,
} from "../../../../../electron-app/utils/state/domain/appActionsState.js";
import {
    getState,
    resetState,
    setState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

describe("appActionsState lifecycle facade", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockReturnValue(undefined);
        resetState();
    });

    it("writes app lifecycle, map, table, and performance paths", () => {
        expect.assertions(10);

        setAppInitialized(true, { source: "test" });
        setAppIsOpeningFile(true, { source: "test" });
        setMapSelectedLap(2, { source: "test" });
        setMapMeasurementMode(true, { source: "test" });
        setRendererTablesRendered(true, { source: "test" });
        setPerformanceLastLoadTime(123, { source: "test" });
        updateAppActionWindowState({ width: 1000 }, { source: "test" });
        updateRendererPerformanceRenderTimes({ chart: 12 }, { source: "test" });
        updateRendererTableState({ currentPage: 3 }, { source: "test" });
        updateRendererMapState(
            { center: [1, 2], isRendered: true, zoom: 9 },
            { source: "test" }
        );

        expect(getState("app.initialized")).toBe(true);
        expect(getState("app.isOpeningFile")).toBe(true);
        expect(getState("map.selectedLap")).toBe(2);
        expect(isRendererMapMeasurementModeEnabled()).toBe(true);
        expect(areRendererTablesRendered()).toBe(true);
        expect(getState("performance.lastLoadTime")).toBe(123);
        expect(getState("ui.windowState")).toMatchObject({ width: 1000 });
        expect(getState("performance.renderTimes")).toMatchObject({
            chart: 12,
        });
        expect(getState("tables")).toMatchObject({ currentPage: 3 });
        expect(getRendererMapState()).toMatchObject({
            center: [1, 2],
            isRendered: true,
            zoom: 9,
        });
    });

    it("normalizes missing map and performance state to records", () => {
        expect.assertions(2);

        setState("map", null, { source: "test" });
        setState("performance", null, { source: "test" });

        expect(getRendererMapState()).toStrictEqual({});
        expect(getRendererPerformanceMetrics()).toStrictEqual({});
    });

    it("stores normalized render flags through direct state writes", () => {
        expect.assertions(4);

        setState("map.measurementMode", "true", { source: "test" });
        expect(getState("map.measurementMode")).toBe(false);

        setState("map.measurementMode", true, { source: "test" });
        expect(isRendererMapMeasurementModeEnabled()).toBe(true);

        setState("tables.isRendered", "true", { source: "test" });
        expect(getState("tables.isRendered")).toBe(false);

        setState(
            "tables",
            { currentPage: 2, isRendered: true },
            { source: "test" }
        );
        expect(getState("tables")).toMatchObject({
            currentPage: 2,
            isRendered: true,
        });
    });
});
