// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import {
    get,
    set,
} from "../../../../../electron-app/utils/state/core/unifiedStateManager.js";
import {
    __resetStateManagerForTests,
    getState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

describe("unifiedStateManager globalData legacy path", () => {
    beforeEach(() => {
        __resetStateManagerForTests();
        Reflect.deleteProperty(globalThis, "globalData");
    });

    it("does not route the legacy globalData facade to active FIT raw data", () => {
        expect.assertions(3);

        const activityData = { recordMesgs: [{ distance: 1200 }] };
        const fallback = { empty: true };

        set("globalData", activityData, { source: "test" });

        expect(getState("fitFile.rawData")).toBeNull();
        expect(getState("globalData")).toBeUndefined();
        expect(get("globalData", fallback)).toBe(fallback);
    });
});
