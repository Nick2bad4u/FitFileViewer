import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import { getActiveFitUserDeviceData } from "../../../../../electron-app/utils/state/domain/fitUserDeviceDataState.js";

describe("fitUserDeviceDataState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("returns user profile and device info from explicit active FIT raw data", () => {
        expect.assertions(1);

        const rawData = {
            deviceInfoMesgs: [
                {
                    deviceIndex: "creator",
                    manufacturer: "garmin",
                    sourceType: "local",
                },
                {
                    manufacturer: "garmin",
                    sourceType: "antplus",
                },
            ],
            userProfileMesgs: [
                {
                    age: 42,
                    friendlyName: "Nick",
                },
            ],
        };

        stateManager.setState("fitFile.rawData", rawData, { source: "test" });

        expect(getActiveFitUserDeviceData()).toStrictEqual({
            deviceInfos: rawData.deviceInfoMesgs,
            rawData,
            userProfile: rawData.userProfileMesgs[0],
            userProfiles: rawData.userProfileMesgs,
        });
    });

    it("filters malformed arrays and reports empty data for invalid sources", () => {
        expect.assertions(2);

        expect(
            getActiveFitUserDeviceData({
                deviceInfoMesgs: [
                    null,
                    { manufacturer: "garmin" },
                    ["bad"],
                ],
                userProfileMesgs: ["bad", { friendlyName: "Nick" }],
            })
        ).toStrictEqual({
            deviceInfos: [{ manufacturer: "garmin" }],
            rawData: {
                deviceInfoMesgs: [
                    null,
                    { manufacturer: "garmin" },
                    ["bad"],
                ],
                userProfileMesgs: ["bad", { friendlyName: "Nick" }],
            },
            userProfile: { friendlyName: "Nick" },
            userProfiles: [{ friendlyName: "Nick" }],
        });

        expect(getActiveFitUserDeviceData(null)).toStrictEqual({
            deviceInfos: [],
            rawData: null,
            userProfile: {},
            userProfiles: [],
        });
    });
});
