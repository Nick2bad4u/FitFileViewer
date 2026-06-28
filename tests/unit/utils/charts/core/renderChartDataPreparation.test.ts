import { describe, expect, it, vi } from "vitest";

import {
    getActivityStartTime,
    getRecordMessages,
    hasChartDataRecordMessages,
    isChartDataRecordArray,
    isChartDataObject,
    isNonEmptyChartDataRecordArray,
    type PreparedChartData,
    storeChartData,
} from "../../../../../electron-app/utils/charts/core/renderChartDataPreparation.js";

describe("renderChartDataPreparation", () => {
    it("accepts record-like chart data objects only", () => {
        expect.assertions(1);

        expect([
            isChartDataObject({ recordMesgs: [] }),
            isChartDataObject([]),
            isChartDataObject(null),
            isChartDataObject("recordMesgs"),
        ]).toStrictEqual([
            true,
            false,
            false,
            false,
        ]);
    });

    it("returns non-empty object record messages from global chart data", () => {
        expect.assertions(4);

        const recordMesgs = [{ timestamp: "2026-05-21T12:00:00Z" }];

        expect(getRecordMessages({ recordMesgs })).toBe(recordMesgs);
        expect(
            getRecordMessages({ recordMesgs: [null, ...recordMesgs] })
        ).toStrictEqual(recordMesgs);
        expect(getRecordMessages({ recordMesgs: [] })).toBeNull();
        expect(getRecordMessages({ sessionMesgs: recordMesgs })).toBeNull();
    });

    it("validates reusable record-message boundaries", () => {
        expect.assertions(1);

        const recordMesgs = [{ timestamp: 1_779_363_600 }];

        expect([
            isChartDataRecordArray(recordMesgs),
            isNonEmptyChartDataRecordArray([]),
            hasChartDataRecordMessages({ recordMesgs }),
            hasChartDataRecordMessages({ recordMesgs: [recordMesgs, []] }),
            hasChartDataRecordMessages({ recordMesgs: [null] }),
        ]).toStrictEqual([
            true,
            false,
            true,
            false,
            false,
        ]);
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
        expect.assertions(1);

        let storedValue: PreparedChartData | undefined;
        let storedOptions: unknown;
        const setChartData = vi.fn<
            (value: PreparedChartData, options: unknown) => void
        >((value, options) => {
            storedValue = value;
            storedOptions = options;
        });
        const activityStartTime = new Date("2026-05-21T12:00:00Z");
        const recordMesgs = [{ timestamp: activityStartTime }];

        storeChartData({ setChartData }, recordMesgs, activityStartTime);

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
