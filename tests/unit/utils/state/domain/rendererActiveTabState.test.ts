import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererActiveTab,
    isRendererActiveTab,
    normalizeRendererActiveTab,
    replaceRendererActiveTab,
    setRendererActiveTab,
    subscribeToRendererActiveTab as subscribeToActiveTab,
} from "../../../../../electron-app/utils/state/domain/rendererActiveTabState.js";

describe("rendererActiveTabState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes the active renderer tab through typed helpers", () => {
        expect.assertions(4);

        expect(getRendererActiveTab()).toBe("summary");

        setRendererActiveTab("browser", { source: "test" });

        expect(getRendererActiveTab()).toBe("browser");
        expect(isRendererActiveTab("browser")).toBe(true);
        expect(isRendererActiveTab("map")).toBe(false);
    });

    it("replaces the active renderer tab only when the expected tab is active", () => {
        expect.assertions(4);

        setRendererActiveTab("browser", { source: "test" });

        expect(replaceRendererActiveTab("map", "summary")).toBe(false);
        expect(getRendererActiveTab()).toBe("browser");

        expect(replaceRendererActiveTab("browser", "map")).toBe(true);
        expect(getRendererActiveTab()).toBe("map");
    });

    it("subscribes to active renderer tab changes", () => {
        expect.assertions(2);

        const changes: unknown[] = [];
        const unsubscribe = subscribeToActiveTab((newValue) => {
            changes.push(newValue);
        });

        setRendererActiveTab("chart", { source: "test" });
        expect(changes).toStrictEqual(["chart"]);

        unsubscribe();
        setRendererActiveTab("map", { source: "test" });
        expect(changes).toStrictEqual(["chart"]);
    });

    it("normalizes empty or non-string active-tab values", () => {
        expect.assertions(3);

        expect(normalizeRendererActiveTab("data")).toBe("data");
        expect(normalizeRendererActiveTab("")).toBe("summary");
        expect(normalizeRendererActiveTab(null)).toBe("summary");
    });
});
