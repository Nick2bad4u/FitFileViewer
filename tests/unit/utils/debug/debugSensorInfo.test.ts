// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    checkDataAvailability,
    debugSensorInfo,
    showDataKeys,
    showSensorNames,
} from "../../../../electron-app/utils/debug/debugSensorInfo.js";
import {
    __resetStateManagerForTests,
    setState,
} from "../../../../electron-app/utils/state/core/stateManager.js";

const GLOBAL_DATA_PROPERTY = "globalData";

function setActiveFitRawData(data: unknown): void {
    setState("fitFile.rawData", data, {
        source: "debugSensorInfo.test",
    });
}

describe("debugSensorInfo", () => {
    beforeEach(() => {
        __resetStateManagerForTests();
        Reflect.deleteProperty(globalThis, GLOBAL_DATA_PROPERTY);
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        __resetStateManagerForTests();
        Reflect.deleteProperty(globalThis, GLOBAL_DATA_PROPERTY);
    });

    it("checks availability from active FIT state before stale legacy globals", () => {
        expect.assertions(4);

        const activeFitData = {
            deviceInfoMesgs: [{ manufacturer: "garmin", product: 1 }],
            sessionMesgs: [{ manufacturer: "garmin" }],
        };
        Object.defineProperty(globalThis, GLOBAL_DATA_PROPERTY, {
            configurable: true,
            enumerable: true,
            value: { stale: true },
            writable: true,
        });
        setActiveFitRawData(activeFitData);

        expect(checkDataAvailability()).toBe(activeFitData);
        expect(console.log).toHaveBeenCalledWith(
            "Active FIT data exists: true"
        );
        expect(console.log).toHaveBeenCalledWith(
            "Sensor-related keys: deviceInfoMesgs, sessionMesgs"
        );
        expect(Reflect.get(globalThis, GLOBAL_DATA_PROPERTY)).toEqual({
            stale: true,
        });
    });

    it("analyzes sensor entries from active FIT state", () => {
        expect.assertions(2);

        setActiveFitRawData({
            deviceInfoMesgs: [{ manufacturer: "garmin", product: 1 }],
            fileIdMesgs: [{ manufacturer: "garmin", product: 2 }],
        });

        const analysis = debugSensorInfo();

        expect(analysis?.totalSensors).toBe(2);
        expect(console.warn).not.toHaveBeenCalled();
    });

    it("shows active FIT data keys and sensor names", () => {
        expect.assertions(3);

        const activeFitData = {
            deviceInfoMesgs: [{ manufacturer: "garmin", product: 1 }],
            recordMesgs: [{ distance: 100 }],
        };
        setActiveFitRawData(activeFitData);

        showDataKeys();
        showSensorNames();

        expect(checkDataAvailability()).toBe(activeFitData);
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("deviceInfoMesgs: 1 items")
        );
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("1."));
    });

    it("returns null when no active FIT data is loaded", () => {
        expect.assertions(2);

        expect(debugSensorInfo()).toBeNull();
        expect(console.warn).toHaveBeenCalledWith(
            "❌ No active FIT data available. Load a FIT file first."
        );
    });
});
