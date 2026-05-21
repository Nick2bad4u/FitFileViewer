import { describe, expect, it, vi } from "vitest";

import {
    getActivityStartTime,
    getRecordMessages,
    isChartDataObject,
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
        ]).toStrictEqual([true, true, false, false]);
    });

    it("returns non-empty record messages from global chart data", () => {
        expect.assertions(3);

        const recordMesgs = [{ timestamp: "2026-05-21T12:00:00Z" }];

        expect(getRecordMessages({ recordMesgs })).toBe(recordMesgs);
        expect(getRecordMessages({ recordMesgs: [] })).toBeNull();
        expect(getRecordMessages({ sessionMesgs: recordMesgs })).toBeNull();
    });

    it("finds the first non-null timestamp from record messages", () => {
        expect.assertions(2);

        expect(
            getActivityStartTime([
                { distance: 0 },
                { timestamp: null },
                { timestamp: 1_779_363_600 },
            ])
        ).toBe(1_779_363_600);
        expect(getActivityStartTime([{ distance: 0 }])).toBeNull();
    });

    it("stores prepared chart data in state with render source metadata", () => {
        expect.assertions(2);

        let storedPath = "";
        let storedValue: unknown;
        let storedOptions: unknown;
        const setState = vi.fn<
            (path: string, value: unknown, options: unknown) => void
        >((path, value, options) => {
            storedPath = path;
            storedValue = value;
            storedOptions = options;
        });
        const recordMesgs = [{ timestamp: "2026-05-21T12:00:00Z" }];

        storeChartData({ setState }, recordMesgs, recordMesgs[0]!.timestamp);

        expect(storedPath).toBe("charts.chartData");
        expect({ options: storedOptions, value: storedValue }).toStrictEqual({
            options: { silent: false, source: "renderChartJS" },
            value: {
                activityStartTime: "2026-05-21T12:00:00Z",
                recordMesgs,
                totalDataPoints: 1,
            },
        });
    });
});
