import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// From tests/unit/utils/rendering/helpers -> utils/... requires going up 5 levels
const SUT = "../../../../../utils/rendering/helpers/renderSummaryHelpers.js";

describe("renderSummaryHelpers core functions", () => {
    /** Save originals to restore after tests */
    const origWindow: any = global.window;
    const origLocalStorage: any = global.localStorage;

    beforeEach(() => {
        // Ensure jsdom window/localStorage exist
        expect(global.window).toBeDefined();
        expect(global.localStorage).toBeDefined();
        // Clean localStorage and reset modules/mocks
        global.localStorage.clear();
        vi.resetModules();
        vi.restoreAllMocks();
        // Clean any globals we may set
        (global.window as any).globalData = undefined;
        (global.window as any).activeFitFileName = undefined;
    });

    afterEach(() => {
        // Restore globals as safety (jsdom resets between tests, but keep explicit)
        global.window = origWindow;
        global.localStorage = origLocalStorage;
    });

    it("getRowLabel returns Summary or Lap N", async () => {
        const { getRowLabel } = await import(SUT);
        expect(getRowLabel(0, false)).toBe("Summary");
        expect(getRowLabel(0, true)).toBe("Lap 1");
        expect(getRowLabel(2, true)).toBe("Lap 3");
    });

    it("getStorageKey prefers window.globalData.cachedFilePath and encodes it", async () => {
        const { getStorageKey } = await import(SUT);
        (global.window as any).globalData = { cachedFilePath: "C:/Users/Me/My Activity.fit" };
        const key = getStorageKey({});
        expect(key.startsWith("summaryColSel_")).toBe(true);
        expect(key).toContain(encodeURIComponent("C:/Users/Me/My Activity.fit"));
    });

    it("getStorageKey falls back to data.cachedFilePath when window.globalData missing", async () => {
        const { getStorageKey } = await import(SUT);
        // ensure no globalData
        (global.window as any).globalData = undefined;
        const data: any = { cachedFilePath: "/tmp/äctivity file.fit" };
        const key = getStorageKey(data);
        expect(key).toBe("summaryColSel_" + encodeURIComponent("/tmp/äctivity file.fit"));
    });

    it("getStorageKey falls back to window.activeFitFileName and defaults otherwise", async () => {
        const { getStorageKey } = await import(SUT);
        // Remove others
        (global.window as any).globalData = undefined;
        const keyDefault = getStorageKey(undefined as any);
        expect(keyDefault).toBe("summaryColSel_default");
        // Now set activeFitFileName
        (global.window as any).activeFitFileName = "JustAName.fit";
        const keyActive = getStorageKey(undefined as any);
        expect(keyActive).toBe("summaryColSel_" + encodeURIComponent("JustAName.fit"));
    });

    it("loadColPrefs returns array of strings from localStorage and handles bad values", async () => {
        const { loadColPrefs } = await import(SUT);
        const key = "summaryColSel_test";
        // Valid array
        localStorage.setItem(key, JSON.stringify(["a", "b", "c"]));
        expect(loadColPrefs(key)).toEqual(["a", "b", "c"]);
        // Not an array -> null
        localStorage.setItem(key, JSON.stringify({ a: 1 }));
        expect(loadColPrefs(key)).toBeNull();
        // Invalid JSON -> null
        localStorage.setItem(key, "not-json");
        expect(loadColPrefs(key)).toBeNull();
        // getItem throwing -> null (caught)
        const origGet = localStorage.getItem;
        (localStorage as any).getItem = vi.fn(() => {
            throw new Error("boom");
        });
        expect(loadColPrefs(key)).toBeNull();
        // restore
        (localStorage as any).getItem = origGet;
    });

    it("saveColPrefs stores JSON and swallows errors", async () => {
        const { saveColPrefs } = await import(SUT);
        const key = "summaryColSel_store";
        const cols = ["Speed", "Distance"];
        saveColPrefs(key, cols, undefined as any);
        expect(JSON.parse(localStorage.getItem(key) || "[]")).toEqual(cols);
        // setItem throwing should not propagate
        const origSet = localStorage.setItem;
        (localStorage as any).setItem = vi.fn(() => {
            throw new Error("nope");
        });
        expect(() => saveColPrefs(key, ["X"], undefined as any)).not.toThrow();
        // restore
        (localStorage as any).setItem = origSet;
    });
});
