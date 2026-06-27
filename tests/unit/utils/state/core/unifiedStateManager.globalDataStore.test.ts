// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import {
    get,
    set,
    subscribe,
    unifiedState,
} from "../../../../../electron-app/utils/state/core/unifiedStateManager.js";
import {
    __resetStateManagerForTests,
    getState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

describe("unifiedStateManager retired globalData path", () => {
    beforeEach(() => {
        __resetStateManagerForTests();
    });

    it("does not route the retired globalData facade to active FIT raw data", () => {
        expect.assertions(8);

        const activityData = { recordMesgs: [{ distance: 1200 }] };
        const fallback = { empty: true };
        let subscriptionCalls = 0;

        const unsubscribe = subscribe("globalData", () => {
            subscriptionCalls += 1;
        });

        set("globalData", activityData, { source: "test" });
        set("globalData.recordMesgs", activityData.recordMesgs, {
            source: "test",
        });
        unsubscribe();

        expect(subscriptionCalls).toBe(0);
        expect(typeof unsubscribe).toBe("function");
        expect(Reflect.has(globalThis, "globalData")).toBe(false);
        expect("isLegacyPath" in unifiedState).toBe(false);
        expect(getState("fitFile.rawData")).toBeNull();
        expect(getState("globalData")).toBeUndefined();
        expect(getState("globalData.recordMesgs")).toBeUndefined();
        expect(get("globalData", fallback)).toBe(fallback);
    });

    it("does not expose legacy path routing or synchronization state", () => {
        expect.assertions(5);

        const loadedFilePath = "C:/activities/direct.fit";

        set("loadedFitFilePath", loadedFilePath, {
            source: "test",
            syncLegacy: false,
        } as Parameters<typeof set>[2]);

        const snapshot = unifiedState.getSnapshot();

        expect(getState("loadedFitFilePath")).toBe(loadedFilePath);
        expect("isLegacyPath" in unifiedState).toBe(false);
        expect("setSyncEnabled" in unifiedState).toBe(false);
        expect("legacyPaths" in snapshot).toBe(false);
        expect("syncEnabled" in snapshot).toBe(false);
    });
});
