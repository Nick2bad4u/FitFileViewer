import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getActiveFitRouteData,
    getFitRouteCoordinates,
    getFitRouteRecordLatitude,
    getFitRouteRecordLongitude,
    getFitRouteRecords,
    hasActiveFitRouteData,
    isFitRouteRecord,
    semicirclesToDegrees,
} from "../../../../../electron-app/utils/state/domain/fitRouteDataState.js";

describe("fitRouteDataState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("returns route-ready coordinate data from active FIT state", () => {
        expect.assertions(2);

        const rawData = {
            lapMesgs: [{ start_index: 0, end_index: 1 }],
            recordMesgs: [
                { positionLat: 0, positionLong: 0 },
                { positionLat: 1_073_741_824, positionLong: -1_073_741_824 },
            ],
        };
        stateManager.setState("fitFile.rawData", rawData, { source: "test" });

        expect(getActiveFitRouteData()).toStrictEqual({
            coordinateCount: 2,
            lapMesgs: rawData.lapMesgs,
            rawData,
            ready: true,
            recordMesgs: rawData.recordMesgs,
            routeCoordinates: [
                {
                    latitude: 0,
                    longitude: 0,
                    record: rawData.recordMesgs[0],
                    recordIndex: 0,
                },
                {
                    latitude: 90,
                    longitude: -90,
                    record: rawData.recordMesgs[1],
                    recordIndex: 1,
                },
            ],
            totalRecords: 2,
        });
        expect(hasActiveFitRouteData()).toBe(true);
    });

    it("accepts snake-case FIT coordinates and filters invalid route rows", () => {
        expect.assertions(2);

        const validSnakeCaseRecord = {
            position_lat: 536_870_912,
            position_long: -536_870_912,
        };
        const validCamelCaseRecord = {
            positionLat: -536_870_912,
            positionLong: 536_870_912,
        };
        const source = {
            lapMesgs: [{ start_index: 0, end_index: 2 }],
            recordMesgs: [
                null,
                validSnakeCaseRecord,
                { positionLat: "bad", positionLong: 1 },
                [validCamelCaseRecord],
                validCamelCaseRecord,
            ],
        };

        expect(getFitRouteRecords(source)).toStrictEqual([
            validSnakeCaseRecord,
            { positionLat: "bad", positionLong: 1 },
            validCamelCaseRecord,
        ]);
        expect(getActiveFitRouteData(source)).toStrictEqual({
            coordinateCount: 2,
            lapMesgs: source.lapMesgs,
            rawData: source,
            ready: true,
            recordMesgs: [
                validSnakeCaseRecord,
                { positionLat: "bad", positionLong: 1 },
                validCamelCaseRecord,
            ],
            routeCoordinates: [
                {
                    latitude: 45,
                    longitude: -45,
                    record: validSnakeCaseRecord,
                    recordIndex: 0,
                },
                {
                    latitude: -45,
                    longitude: 45,
                    record: validCamelCaseRecord,
                    recordIndex: 2,
                },
            ],
            totalRecords: 3,
        });
    });

    it("reports not-ready state when route coordinates are missing", () => {
        expect.assertions(3);

        expect(getActiveFitRouteData(null)).toStrictEqual({
            coordinateCount: 0,
            lapMesgs: [],
            rawData: null,
            ready: false,
            recordMesgs: [],
            routeCoordinates: [],
            totalRecords: 0,
        });
        expect(getActiveFitRouteData({ recordMesgs: [{}] })).toStrictEqual({
            coordinateCount: 0,
            lapMesgs: [],
            rawData: { recordMesgs: [{}] },
            ready: false,
            recordMesgs: [{}],
            routeCoordinates: [],
            totalRecords: 1,
        });
        expect(getFitRouteCoordinates([{ positionLat: 0 }])).toStrictEqual([]);
    });

    it("validates records and converts semicircles", () => {
        expect.assertions(1);

        expect({
            invalidRecord: isFitRouteRecord([]),
            nonNumeric: semicirclesToDegrees("0"),
            snakeLatitude: getFitRouteRecordLatitude({
                position_lat: 536_870_912,
            }),
            snakeLongitude: getFitRouteRecordLongitude({
                position_long: -536_870_912,
            }),
            validNegative: semicirclesToDegrees(-1_073_741_824),
            validRecord: isFitRouteRecord({ positionLat: 0 }),
        }).toStrictEqual({
            invalidRecord: false,
            nonNumeric: null,
            snakeLatitude: 536_870_912,
            snakeLongitude: -536_870_912,
            validNegative: -90,
            validRecord: true,
        });
    });
});
