import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererActiveTab,
    isRendererActiveTab,
    isRendererChartTab,
    isRendererTabName,
    normalizeRendererActiveTab,
    RENDERER_TAB_NAMES,
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
        expect.assertions(4);

        expect(normalizeRendererActiveTab("data")).toBe("data");
        expect(normalizeRendererActiveTab("table")).toBe("summary");
        expect(normalizeRendererActiveTab("")).toBe("summary");
        expect(normalizeRendererActiveTab(null)).toBe("summary");
    });

    it("exports the known renderer tab names used by tab state callers", () => {
        expect.assertions(3);

        expect(RENDERER_TAB_NAMES).toStrictEqual([
            "altfit",
            "browser",
            "chart",
            "chartjs",
            "data",
            "map",
            "summary",
            "zwift",
        ]);
        expect(isRendererTabName("zwift")).toBe(true);
        expect(isRendererTabName("table")).toBe(false);
    });

    it("detects chart renderer tabs through the shared normalized tab contract", () => {
        expect.assertions(6);

        expect(isRendererChartTab("chart")).toBe(true);
        expect(isRendererChartTab("chartjs")).toBe(true);
        expect(isRendererChartTab("charts")).toBe(false);
        expect(isRendererChartTab("data")).toBe(false);
        expect(isRendererChartTab("table")).toBe(false);
        expect(isRendererChartTab(null)).toBe(false);
    });
});
