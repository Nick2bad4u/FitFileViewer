import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getStorageKey, saveColPrefs, loadColPrefs, getRowLabel } from "../utils/renderSummaryHelpers.js";

describe("getStorageKey", () => {
    it("should use globalData.cachedFilePath if available", () => {
        window.globalData = { cachedFilePath: "foo.fit" };
        expect(getStorageKey()).toContain("foo.fit");
        delete window.globalData;
    });
    it("should use data.cachedFilePath if provided", () => {
        expect(getStorageKey({ cachedFilePath: "bar.fit" })).toContain("bar.fit");
    });
    it("should use window.activeFitFileName if available", () => {
        window.activeFitFileName = "baz.fit";
        expect(getStorageKey()).toContain("baz.fit");
        delete window.activeFitFileName;
    });
    it("should return default if nothing is available", () => {
        expect(getStorageKey({})).toBe("summaryColSel_default");
    });
});

describe("saveColPrefs and loadColPrefs", () => {
    it("should save and load visible columns", () => {
        saveColPrefs("testKey", ["a", "b"]);
        expect(loadColPrefs("testKey")).toEqual(["a", "b"]);
        localStorage.removeItem("testKey");
    });
    it("should return null if not set", () => {
        expect(loadColPrefs("notSet")).toBeNull();
    });
});

describe("getRowLabel", () => {
    it("should return Lap N if isLap is true", () => {
        expect(getRowLabel(2, true)).toBe("Lap 3");
    });
    it("should return Summary if isLap is false", () => {
        expect(getRowLabel(0, false)).toBe("Summary");
    });
});
