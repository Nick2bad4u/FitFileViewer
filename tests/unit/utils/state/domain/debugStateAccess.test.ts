import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getDebugStateHistory,
    getDebugStateRoot,
    subscribeToDebugStateChanges,
} from "../../../../../electron-app/utils/state/domain/debugStateAccess.js";

describe("debugStateAccess", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
        stateManager.clearStateHistory();
    });

    it("reads the root state and history for debug tooling", () => {
        expect.assertions(2);

        stateManager.setState("ui.activeTab", "map", { source: "test" });

        expect(getDebugStateRoot()).toMatchObject({
            ui: {
                activeTab: "map",
            },
        });
        expect(getDebugStateHistory()).not.toHaveLength(0);
    });

    it("returns an empty debug history after state history reset", () => {
        expect.assertions(2);

        stateManager.setState("ui.activeTab", "map", { source: "test" });
        expect(getDebugStateHistory()).not.toHaveLength(0);

        stateManager.clearStateHistory();
        expect(getDebugStateHistory()).toStrictEqual([]);
    });

    it("subscribes to wildcard state changes", () => {
        expect.assertions(2);

        const unsubscribe = subscribeToDebugStateChanges(() => {
            return undefined;
        });

        expect(stateManager.getSubscriptions().paths).toContain("*");

        unsubscribe();
        expect(stateManager.getSubscriptions().paths).not.toContain("*");
    });
});
