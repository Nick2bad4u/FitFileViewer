import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererActiveTab,
    getRendererActiveTabContentFromState,
    getRendererActiveTabFromState,
    isRendererActiveTab,
    isRendererChartTab,
    isRendererTabName,
    normalizeRendererActiveTab,
    RENDERER_TAB_NAMES,
    replaceRendererActiveTab,
    setRendererActiveTab,
    setRendererActiveTabContentInState,
    setRendererActiveTabInState,
    subscribeToRendererActiveTab as subscribeToActiveTab,
    subscribeToRendererActiveTabInState,
    subscribeToRendererActiveTabSingletonInState,
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

    it("reads active tab values through an explicit state reader", () => {
        expect.assertions(3);

        const reads: string[] = [];
        const readState = (path: string): unknown => {
            reads.push(path);
            return "chartjs";
        };

        expect(getRendererActiveTabFromState(readState)).toBe("chartjs");
        expect(reads).toStrictEqual(["ui.activeTab"]);
        expect(getRendererActiveTabFromState(() => "unknown")).toBe("summary");
    });

    it("reads active tab content values through an explicit state reader", () => {
        expect.assertions(3);

        const reads: string[] = [];
        const readState = (path: string): unknown => {
            reads.push(path);
            return "map";
        };

        expect(getRendererActiveTabContentFromState(readState)).toBe("map");
        expect(reads).toStrictEqual(["ui.activeTabContent"]);
        expect(getRendererActiveTabContentFromState(() => "")).toBe("summary");
    });

    it("writes active tab values through an explicit state writer", () => {
        expect.assertions(1);

        const writes: Array<{
            options: unknown;
            path: string;
            value: unknown;
        }> = [];

        setRendererActiveTabInState(
            (path, value, options) => {
                writes.push({ options, path, value });
            },
            "unknown",
            { source: "test" }
        );

        expect(writes).toStrictEqual([
            {
                options: { source: "test" },
                path: "ui.activeTab",
                value: "summary",
            },
        ]);
    });

    it("writes active tab content values through an explicit state writer", () => {
        expect.assertions(1);

        const writes: Array<{
            options: unknown;
            path: string;
            value: unknown;
        }> = [];

        setRendererActiveTabContentInState(
            (path, value, options) => {
                writes.push({ options, path, value });
            },
            "unknown",
            { source: "test" }
        );

        expect(writes).toStrictEqual([
            {
                options: { source: "test" },
                path: "ui.activeTabContent",
                value: "summary",
            },
        ]);
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

    it("subscribes to active tab values through an explicit state subscriber", () => {
        expect.assertions(3);

        const changes: unknown[] = [];
        const calls: Array<{ callbackType: string; path: string }> = [];

        expect(
            subscribeToRendererActiveTabInState(
                (path, callback) => {
                    calls.push({ callbackType: typeof callback, path });
                    callback("map", "summary", path);
                    return "unsubscribe";
                },
                (newValue) => {
                    changes.push(newValue);
                }
            )
        ).toBe("unsubscribe");
        expect(calls).toStrictEqual([
            { callbackType: "function", path: "ui.activeTab" },
        ]);
        expect(changes).toStrictEqual(["map"]);
    });

    it("subscribes to active tab singleton values through an explicit state subscriber", () => {
        expect.assertions(3);

        const changes: unknown[] = [];
        const calls: Array<{
            callbackType: string;
            key: string;
            path: string;
        }> = [];

        expect(
            subscribeToRendererActiveTabSingletonInState(
                (path, key, callback) => {
                    calls.push({ callbackType: typeof callback, key, path });
                    callback("browser", "summary", path);
                    return "singleton";
                },
                "test-key",
                (newValue) => {
                    changes.push(newValue);
                }
            )
        ).toBe("singleton");
        expect(calls).toStrictEqual([
            {
                callbackType: "function",
                key: "test-key",
                path: "ui.activeTab",
            },
        ]);
        expect(changes).toStrictEqual(["browser"]);
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
