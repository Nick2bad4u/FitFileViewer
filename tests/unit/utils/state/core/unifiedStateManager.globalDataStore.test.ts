// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { getGlobalData } from "../../../../../electron-app/utils/state/core/globalDataStore.js";
import {
    get,
    set,
} from "../../../../../electron-app/utils/state/core/unifiedStateManager.js";
import {
    __resetStateManagerForTests,
    getState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

describe("unifiedStateManager globalData routing", () => {
    beforeEach(() => {
        __resetStateManagerForTests();
        Reflect.deleteProperty(globalThis, "globalData");
    });

    it("routes the legacy globalData facade through globalDataStore", () => {
        expect.assertions(3);

        const activityData = { recordMesgs: [{ distance: 1200 }] };

        set("globalData", activityData, { source: "test" });

        expect(getState("globalData")).toBe(activityData);
        expect(getGlobalData()).toBe(activityData);
        expect(get("globalData")).toBe(activityData);
    });
});
