import { describe, expect, it, vi } from "vitest";

import {
    getActivityStartTime,
    getRecordMessages,
    isChartDataObject,
    type PreparedChartData,
    storeChartData,
} from "../../../../../utils/charts/core/renderChartDataPreparation.js";

describe("renderChartDataPreparation", () => {
    it("accepts record-like chart data objects only", () => {
        expect.assertions(1);

        expect([
            isChartDataObject({ recordMesgs: [] }),
            isChartDataObject([]),
            isChartDataObject(null),
            isChartDataObject("recordMesgs"),
        ]).toStrictEqual([true, false, false, false]);
    });

    it("returns non-empty object record messages from global chart data", () => {
        expect.assertions(4);

        const recordMesgs = [{ timestamp: "2026-05-21T12:00:00Z" }];

        expect(getRecordMessages({ recordMesgs })).toBe(recordMesgs);
        expect(getRecordMessages({ recordMesgs: [null, ...recordMesgs] }))
            .toStrictEqual(recordMesgs);
        expect(getRecordMessages({ recordMesgs: [] })).toBeNull();
        expect(getRecordMessages({ sessionMesgs: recordMesgs })).toBeNull();
    });

    it("finds the first supported activity start time from record messages", () => {
        expect.assertions(2);

        expect(
            getActivityStartTime([
                { distance: 0 },
                { timestamp: "2026-05-21T12:00:00Z" },
                { timestamp: null },
                { timestamp: 1_779_363_600 },
            ])
        ).toBe(1_779_363_600);
        expect(getActivityStartTime([{ distance: 0 }])).toBeNull();
    });

    it("stores prepared chart data in state with render source metadata", () => {
        expect.assertions(2);

        let storedPath = "";
        let storedValue: PreparedChartData | undefined;
        let storedOptions: unknown;
        const setState = vi.fn<
            (path: string, value: PreparedChartData, options: unknown) => void
        >((path, value, options) => {
            storedPath = path;
            storedValue = value;
            storedOptions = options;
        });
        const activityStartTime = new Date("2026-05-21T12:00:00Z");
        const recordMesgs = [{ timestamp: activityStartTime }];

        storeChartData({ setState }, recordMesgs, activityStartTime);

        expect(storedPath).toBe("charts.chartData");
        expect({ options: storedOptions, value: storedValue }).toStrictEqual({
            options: { silent: false, source: "renderChartJS" },
            value: {
                activityStartTime,
                recordMesgs,
                totalDataPoints: 1,
            },
        });
    });
});
