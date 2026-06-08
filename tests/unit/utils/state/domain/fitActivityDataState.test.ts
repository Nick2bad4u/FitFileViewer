import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getActiveFitActivityData,
    getActiveFitPowerInput,
    hasActiveFitRecords,
} from "../../../../../electron-app/utils/state/domain/fitActivityDataState.js";

describe("fitActivityDataState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads active parsed activity messages from the explicit fitFile raw-data slice", () => {
        expect.assertions(3);

        const rawData = {
            eventMesgs: [{ event: "start" }],
            lapMesgs: [{ total_distance: 1000 }],
            recordMesgs: [{ power: 220 }],
            sessionMesgs: [{ sport: "cycling" }],
            timeInZoneMesgs: [{ referenceMesg: "lap" }],
        };
        stateManager.setState("fitFile.rawData", rawData, { source: "test" });
        stateManager.setState(
            "globalData",
            { recordMesgs: [{ power: 1 }] },
            { source: "test" }
        );

        expect(getActiveFitActivityData()).toStrictEqual({
            eventMesgs: rawData.eventMesgs,
            lapMesgs: rawData.lapMesgs,
            rawData,
            recordMesgs: rawData.recordMesgs,
            sessionMesgs: rawData.sessionMesgs,
            timeInZoneMesgs: rawData.timeInZoneMesgs,
        });
        expect(getActiveFitPowerInput()).toStrictEqual({
            recordMesgs: rawData.recordMesgs,
            sessionMesgs: rawData.sessionMesgs,
        });
        expect(hasActiveFitRecords()).toBe(true);
    });

    it("does not read legacy globalData as active activity data", () => {
        expect.assertions(2);

        const compatibilityData = {
            eventMesgs: [{ event: "stop" }],
            recordMesgs: [{ cadence: 88 }],
            timeInZoneMesgs: [{ referenceMesg: "session" }],
        };
        stateManager.setState("globalData", compatibilityData, {
            source: "test",
        });

        expect(getActiveFitActivityData()).toStrictEqual({
            eventMesgs: [],
            lapMesgs: [],
            rawData: null,
            recordMesgs: [],
            sessionMesgs: [],
            timeInZoneMesgs: [],
        });
        expect(getActiveFitPowerInput()).toStrictEqual({
            recordMesgs: [],
        });
    });

    it("returns empty activity message arrays when no active FIT data is loaded", () => {
        expect.assertions(2);

        expect(getActiveFitActivityData()).toStrictEqual({
            eventMesgs: [],
            lapMesgs: [],
            rawData: null,
            recordMesgs: [],
            sessionMesgs: [],
            timeInZoneMesgs: [],
        });
        expect(hasActiveFitRecords()).toBe(false);
    });
});
