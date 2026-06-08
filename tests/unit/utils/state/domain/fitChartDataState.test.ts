import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getActiveFitChartData,
    getFitChartActivityStartTime,
    getFitChartRecordMessages,
    hasActiveFitChartData,
    hasFitChartRecordMessages,
    isFitChartRecordArray,
    isNonEmptyFitChartRecordArray,
} from "../../../../../electron-app/utils/state/domain/fitChartDataState.js";

describe("fitChartDataState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("returns chart-ready record data from active FIT state", () => {
        expect.assertions(2);

        const rawData = {
            recordMesgs: [
                { distance: 0 },
                { speed: 4.2, timestamp: 1_780_000_000 },
            ],
        };
        stateManager.setState("fitFile.rawData", rawData, { source: "test" });

        expect(getActiveFitChartData()).toStrictEqual({
            activityStartTime: 1_780_000_000,
            rawData,
            ready: true,
            recordMesgs: rawData.recordMesgs,
            totalDataPoints: 2,
        });
        expect(hasActiveFitChartData()).toBe(true);
    });

    it("filters invalid record rows without accepting nested arrays", () => {
        expect.assertions(3);

        const validRecord = { timestamp: 1 };
        const source = {
            recordMesgs: [
                null,
                validRecord,
                [validRecord],
                "bad",
            ],
        };

        expect(getFitChartRecordMessages(source)).toStrictEqual([validRecord]);
        expect(hasFitChartRecordMessages(source)).toBe(false);
        expect(getActiveFitChartData(source)).toStrictEqual({
            activityStartTime: 1,
            rawData: source,
            ready: true,
            recordMesgs: [validRecord],
            totalDataPoints: 1,
        });
    });

    it("reports not-ready state when raw data or records are missing", () => {
        expect.assertions(3);

        expect(getActiveFitChartData(null)).toStrictEqual({
            activityStartTime: null,
            rawData: null,
            ready: false,
            recordMesgs: [],
            totalDataPoints: 0,
        });
        expect(getActiveFitChartData({ recordMesgs: [] })).toStrictEqual({
            activityStartTime: null,
            rawData: { recordMesgs: [] },
            ready: false,
            recordMesgs: [],
            totalDataPoints: 0,
        });
        expect(hasFitChartRecordMessages({ recordMesgs: [] })).toBe(false);
    });

    it("validates chart record arrays and activity timestamps", () => {
        expect.assertions(1);

        expect({
            firstStart: getFitChartActivityStartTime([
                { timestamp: "ignored" },
                { timestamp: new Date("2026-06-01T12:00:00Z") },
            ]),
            invalidRecordArray: isFitChartRecordArray([{}, null]),
            nonEmptyRecordArray: isNonEmptyFitChartRecordArray([{}]),
        }).toStrictEqual({
            firstStart: new Date("2026-06-01T12:00:00Z"),
            invalidRecordArray: false,
            nonEmptyRecordArray: true,
        });
    });
});
