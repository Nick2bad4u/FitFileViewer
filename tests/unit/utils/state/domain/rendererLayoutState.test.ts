import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    isRendererSidebarCollapsed,
    normalizeRendererSidebarCollapsed,
    setRendererSidebarCollapsed,
} from "../../../../../electron-app/utils/state/domain/rendererLayoutState.js";

describe("rendererLayoutState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes sidebar collapsed state through typed helpers", () => {
        expect.assertions(3);

        expect(isRendererSidebarCollapsed()).toBe(false);

        setRendererSidebarCollapsed(true, { source: "test" });
        expect(isRendererSidebarCollapsed()).toBe(true);

        setRendererSidebarCollapsed(false, { source: "test" });
        expect(isRendererSidebarCollapsed()).toBe(false);
    });

    it("normalizes only true as collapsed", () => {
        expect.assertions(4);

        expect(normalizeRendererSidebarCollapsed(true)).toBe(true);
        expect(normalizeRendererSidebarCollapsed(false)).toBe(false);
        expect(normalizeRendererSidebarCollapsed("true")).toBe(false);
        expect(normalizeRendererSidebarCollapsed(1)).toBe(false);
    });

    it("normalizes sidebar state direct writes", () => {
        expect.assertions(2);

        stateManager.setState("ui.sidebarCollapsed", "true", {
            source: "test",
        });
        expect(stateManager.getState("ui.sidebarCollapsed")).toBe(false);

        stateManager.setState(
            "ui",
            {
                sidebarCollapsed: true,
            },
            { source: "test" }
        );
        expect(stateManager.getState("ui.sidebarCollapsed")).toBe(true);
    });
});
