// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import {
    get,
    set,
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
        expect.assertions(6);

        const activityData = { recordMesgs: [{ distance: 1200 }] };
        const fallback = { empty: true };

        set("globalData", activityData, { source: "test" });
        set("globalData.recordMesgs", activityData.recordMesgs, {
            source: "test",
        });

        expect(unifiedState.isLegacyPath("globalData")).toBe(false);
        expect(Reflect.has(globalThis, "globalData")).toBe(false);
        expect(getState("fitFile.rawData")).toBeNull();
        expect(getState("globalData")).toBeUndefined();
        expect(getState("globalData.recordMesgs")).toBeUndefined();
        expect(get("globalData", fallback)).toBe(fallback);
    });
});
