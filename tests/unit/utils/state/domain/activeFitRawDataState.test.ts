import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getActiveFitMessageArray,
    getActiveFitRawData,
} from "../../../../../electron-app/utils/state/domain/activeFitRawDataState.js";

describe("activeFitRawDataState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads explicit FIT raw data from the domain slice", () => {
        expect.assertions(2);

        const explicitRawData = {
            recordMesgs: [{ timestamp: 1 }],
        };
        stateManager.setState("fitFile.rawData", explicitRawData, {
            source: "test",
        });

        expect(getActiveFitRawData()).toBe(explicitRawData);
        expect(getActiveFitMessageArray("recordMesgs")).toStrictEqual(
            explicitRawData.recordMesgs
        );
    });

    it("does not read legacy globalData as active FIT raw data", () => {
        expect.assertions(2);

        const compatibilityRawData = {
            lapMesgs: [{ start_index: 0 }],
        };
        stateManager.setState("globalData", compatibilityRawData, {
            source: "test",
        });

        expect(getActiveFitRawData()).toBeNull();
        expect(getActiveFitMessageArray("lapMesgs")).toStrictEqual([]);
    });

    it("filters malformed message rows from active and explicit sources", () => {
        expect.assertions(2);

        const validRecord = { timestamp: 1 };
        const source = {
            recordMesgs: [
                null,
                validRecord,
                [validRecord],
                "bad",
            ],
        };
        stateManager.setState("fitFile.rawData", source, { source: "test" });

        expect(getActiveFitMessageArray("recordMesgs")).toStrictEqual([
            validRecord,
        ]);
        expect(getActiveFitMessageArray("recordMesgs", source)).toStrictEqual([
            validRecord,
        ]);
    });

    it("returns empty arrays for missing, primitive, or array sources", () => {
        expect.assertions(4);

        expect(getActiveFitRawData()).toBeNull();
        expect(getActiveFitMessageArray("recordMesgs")).toStrictEqual([]);
        expect(getActiveFitMessageArray("recordMesgs", null)).toStrictEqual([]);
        expect(getActiveFitMessageArray("recordMesgs", [])).toStrictEqual([]);
    });
});
