// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import {
    defineLegacyGlobalDataBridge,
    getGlobalData,
    setGlobalData,
} from "../../../../../electron-app/utils/state/core/globalDataStore.js";
import {
    __resetStateManagerForTests,
    getState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

type GlobalDataTestScope = typeof globalThis & {
    globalData?: unknown;
};

const GLOBAL_DATA_PROPERTY = "globalData";

function resetGlobalDataStoreTestState(): void {
    __resetStateManagerForTests();
    Reflect.deleteProperty(globalThis, GLOBAL_DATA_PROPERTY);
}

describe("globalDataStore", () => {
    beforeEach(() => {
        resetGlobalDataStoreTestState();
    });

    it("reads and writes global data through the managed state store", () => {
        expect.assertions(3);

        const testGlobal = globalThis as GlobalDataTestScope;
        const data = { recordMesgs: [{ distance: 1000 }] };

        setGlobalData(data, { source: "test" });

        expect(getState("globalData")).toBe(data);
        expect(getGlobalData()).toBe(data);
        expect(testGlobal.globalData).toBe(data);
    });

    it("falls back to a plain legacy globalData value before the bridge is installed", () => {
        expect.assertions(1);

        const data = { legacy: true };
        Object.defineProperty(globalThis, GLOBAL_DATA_PROPERTY, {
            configurable: true,
            enumerable: true,
            value: data,
            writable: true,
        });

        expect(getGlobalData()).toBe(data);
    });

    it("defines a temporary legacy globalData bridge backed by managed state", () => {
        expect.assertions(3);

        const testGlobal = globalThis as GlobalDataTestScope;
        const firstData = { active: true };
        const secondData = { active: false };

        expect(
            defineLegacyGlobalDataBridge({
                silent: false,
                source: "test.globalData",
            })
        ).toBe(true);

        setGlobalData(firstData, { source: "test" });
        expect(testGlobal.globalData).toBe(firstData);

        testGlobal.globalData = secondData;
        expect(getState("globalData")).toBe(secondData);
    });

    it("synchronizes an existing legacy globalData accessor", () => {
        expect.assertions(4);

        const data = { recordMesgs: [{ distance: 2000 }] };
        const descriptorTarget = {
            value: null as unknown,
        };

        Object.defineProperty(globalThis, GLOBAL_DATA_PROPERTY, {
            configurable: true,
            enumerable: true,
            get() {
                return descriptorTarget.value;
            },
            set(value: unknown) {
                descriptorTarget.value = value;
            },
        });

        setGlobalData(data, { source: "test" });

        expect(getState("globalData")).toBe(data);
        expect(getGlobalData()).toBe(data);
        expect(descriptorTarget.value).toBe(data);
        expect(
            Object.getOwnPropertyDescriptor(globalThis, GLOBAL_DATA_PROPERTY)
        ).toHaveProperty("set");
    });

    it("does not replace a non-configurable legacy globalData property", () => {
        expect.assertions(2);

        const data = { locked: true };
        const scope = {};
        Object.defineProperty(scope, GLOBAL_DATA_PROPERTY, {
            configurable: false,
            enumerable: true,
            value: data,
            writable: true,
        });

        expect(
            defineLegacyGlobalDataBridge({
                scope: scope as GlobalDataTestScope,
                source: "test.globalData",
            })
        ).toBe(false);
        expect(getGlobalData(scope as GlobalDataTestScope)).toBe(data);
    });
});
