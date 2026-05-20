import { describe, expect, it, vi } from "vitest";

const hiddenFields = vi.hoisted(() => new Set<string>());

vi.mock(
    import("../../../../../utils/state/domain/settingsStateManager.js"),
    () => ({
        getChartFieldVisibility: (field: string) =>
            hiddenFields.has(field) ? "hidden" : "visible",
    })
);

import { getChartCounts } from "../../../../../utils/charts/core/getChartCounts.js";

type ChartCountsTestGlobal = typeof globalThis & {
    _chartjsInstances?: Array<{ canvas?: { id?: string } }>;
    globalData?: unknown;
};

const testGlobal = globalThis as ChartCountsTestGlobal;

function resetGlobals(): void {
    hiddenFields.clear();
    delete testGlobal._chartjsInstances;
    delete testGlobal.globalData;
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

    it("counts metric, gps, analysis, zone, lap-zone, event, and developer charts", () => {
        expect.assertions(6);

        resetGlobals();
        hiddenFields.add("power");
        hiddenFields.add("gps_track");
        hiddenFields.add("power_lap_zone_individual");
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        testGlobal.globalData = {
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
        };

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
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {}),
            logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        testGlobal.globalData = {
            recordMesgs: [
                undefined,
                "bad row",
                { custom_field: "text", developer_signal: "NaN" },
            ],
        };

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
