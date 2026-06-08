import { describe, expect, it, vi } from "vitest";
import { setActiveFitRawData } from "../../../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import { __resetStateManagerForTests } from "../../../../../electron-app/utils/state/core/stateManager.js";
import { clearChartInstanceRegistryForTests } from "../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";

const hiddenFields = vi.hoisted(() => new Set<string>());

vi.mock(
    import("../../../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        getChartFieldVisibility: (field: string) =>
            hiddenFields.has(field) ? "hidden" : "visible",
    })
);

import { getChartCounts } from "../../../../../electron-app/utils/charts/core/getChartCounts.js";

function resetGlobals(): void {
    __resetStateManagerForTests();
    clearChartInstanceRegistryForTests();
    hiddenFields.clear();
}

describe(getChartCounts, () => {
    it("returns empty counts when no record data is loaded", () => {
        expect.assertions(1);

        resetGlobals();

        expect(getChartCounts()).toStrictEqual({
            available: 0,
            categories: {
                analysis: { available: 0, total: 0, visible: 0 },
                gps: { available: 0, total: 0, visible: 0 },
                metrics: { available: 0, total: 0, visible: 0 },
                zones: { available: 0, total: 0, visible: 0 },
            },
            total: 0,
            visible: 0,
        });
    });

    it("returns empty counts when record messages contain no object rows", () => {
        expect.assertions(1);

        resetGlobals();
        setActiveFitRawData(
            {
                recordMesgs: [
                    null,
                    ["bad"],
                    "bad",
                ],
            },
            { source: "test" }
        );

        expect(getChartCounts()).toStrictEqual({
            available: 0,
            categories: {
                analysis: { available: 0, total: 0, visible: 0 },
                gps: { available: 0, total: 0, visible: 0 },
                metrics: { available: 0, total: 0, visible: 0 },
                zones: { available: 0, total: 0, visible: 0 },
            },
            total: 0,
            visible: 0,
        });
    });

    it("counts metric, gps, analysis, zone, lap-zone, event, and developer charts", () => {
        expect.assertions(6);

        resetGlobals();
        hiddenFields.add("power");
        hiddenFields.add("gps_track");
        hiddenFields.add("power_lap_zone_individual");
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        setActiveFitRawData(
            {
                eventMesgs: [{ event: "start" }],
                recordMesgs: [
                    null,
                    {
                        altitude: 50,
                        developer_stride: "42",
                        distance: 1_000,
                        enhancedSpeed: 6.1,
                        heartRate: 140,
                        positionLat: 52.5,
                        power: 210,
                        speed: "5.8",
                    },
                ],
                timeInZoneMesgs: [
                    {
                        referenceMesg: "session",
                        timeInHrZone: [1],
                        timeInPowerZone: [1],
                    },
                    {
                        referenceMesg: "lap",
                        timeInHrZone: [2],
                        timeInPowerZone: [3],
                    },
                ],
            },
            { source: "test" }
        );

        const counts = getChartCounts();

        expect(counts.categories.metrics).toStrictEqual({
            available: 8,
            total: 17,
            visible: 7,
        });
        expect(counts.categories.gps).toStrictEqual({
            available: 1,
            total: 1,
            visible: 0,
        });
        expect(counts.categories.analysis).toStrictEqual({
            available: 4,
            total: 4,
            visible: 4,
        });
        expect(counts.categories.zones).toStrictEqual({
            available: 6,
            total: 6,
            visible: 5,
        });
        expect(counts).toMatchObject({
            available: 19,
            total: 28,
            visible: 16,
        });
        expect(logSpy).toHaveBeenCalledWith(
            "[ChartStatus] Chart count breakdown:",
            expect.objectContaining({
                available: 19,
                total: 28,
                visible: 16,
            })
        );

        logSpy.mockRestore();
    });

    it("ignores malformed rows and nonnumeric developer values", () => {
        expect.assertions(2);

        resetGlobals();
        const errorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {}),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        setActiveFitRawData(
            {
                recordMesgs: [
                    undefined,
                    "bad row",
                    { custom_field: "text", developer_signal: "NaN" },
                ],
            },
            { source: "test" }
        );

        const counts = getChartCounts();

        expect(counts).toMatchObject({
            available: 0,
            total: 21,
            visible: 0,
        });
        expect(errorSpy).not.toHaveBeenCalled();

        errorSpy.mockRestore();
        logSpy.mockRestore();
    });
});
