import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getActiveFitMessageArray,
    getActiveFitRawData,
    setActiveFitRawData,
    subscribeToActiveFitRawData,
    subscribeToActiveFitRawDataChange,
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

    it("reads message arrays from own raw-data properties only", () => {
        expect.assertions(2);

        const inheritedRecord = { timestamp: 1 };
        const validRecord = { timestamp: 2 };
        const source = Object.create({
            recordMesgs: [inheritedRecord],
        }) as { recordMesgs?: unknown };

        source.recordMesgs = [validRecord];

        expect(getActiveFitMessageArray("recordMesgs", source)).toStrictEqual([
            validRecord,
        ]);
        expect(
            getActiveFitMessageArray(
                "recordMesgs",
                Object.create({
                    recordMesgs: [inheritedRecord],
                })
            )
        ).toStrictEqual([]);
    });

    it("returns empty arrays for missing, primitive, or array sources", () => {
        expect.assertions(4);

        expect(getActiveFitRawData()).toBeNull();
        expect(getActiveFitMessageArray("recordMesgs")).toStrictEqual([]);
        expect(getActiveFitMessageArray("recordMesgs", null)).toStrictEqual([]);
        expect(getActiveFitMessageArray("recordMesgs", [])).toStrictEqual([]);
    });

    it("subscribes to active FIT raw-data changes through the domain helper", () => {
        expect.assertions(3);

        const listenerValues: unknown[] = [];
        const unsubscribe = subscribeToActiveFitRawData((data) => {
            listenerValues.push(data);
        });
        const rawData = { recordMesgs: [{ timestamp: 1 }] };

        setActiveFitRawData(rawData, { source: "test" });
        stateManager.setState("fitFile.rawData", [], { source: "test" });

        unsubscribe();
        setActiveFitRawData(
            { recordMesgs: [{ timestamp: 2 }] },
            {
                source: "test",
            }
        );

        expect(listenerValues).toHaveLength(2);
        expect(listenerValues[0]).toBe(rawData);
        expect(listenerValues[1]).toBeNull();
    });

    it("subscribes to active FIT raw-data changes with previous values", () => {
        expect.assertions(1);

        const listenerValues: unknown[] = [];
        const unsubscribe = subscribeToActiveFitRawDataChange(
            (data, previousData) => {
                listenerValues.push([data, previousData]);
            }
        );
        const firstRawData = { recordMesgs: [{ timestamp: 1 }] };
        const secondRawData = { recordMesgs: [{ timestamp: 2 }] };

        setActiveFitRawData(firstRawData, { source: "test" });
        setActiveFitRawData(secondRawData, { source: "test" });

        unsubscribe();

        expect(listenerValues).toEqual([
            [firstRawData, null],
            [secondRawData, firstRawData],
        ]);
    });
});
