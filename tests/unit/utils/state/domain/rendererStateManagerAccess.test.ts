import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererCoreStateManager,
    toRendererStateManagerAccess,
} from "../../../../../electron-app/utils/state/domain/rendererStateManagerAccess.js";

describe("rendererStateManagerAccess", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("exposes the renderer core state manager through a typed adapter", () => {
        expect.assertions(2);

        const access = getRendererCoreStateManager();
        access?.setState("ui.activeTab", "map", { source: "test" });

        expect(access).toBeDefined();
        expect(access?.getState("ui.activeTab")).toBe("map");
    });

    it("normalizes only complete state manager candidates", () => {
        expect.assertions(3);

        const candidate = {
            getState: () => "summary",
            setState: () => undefined,
            subscribe: () => undefined,
        };

        expect(toRendererStateManagerAccess(candidate)).toEqual(candidate);
        expect(
            toRendererStateManagerAccess({ getState: () => "summary" })
        ).toBeUndefined();
        expect(toRendererStateManagerAccess(null)).toBeUndefined();
    });
});
