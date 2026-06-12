import { describe, expect, it, vi } from "vitest";

import {
    getRowLabel,
    getStorageKey,
    loadColPrefs,
    saveColPrefs,
} from "../../../../../electron-app/utils/rendering/helpers/renderSummaryHelpers.js";
import {
    __resetStateManagerForTests,
    setState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

function resetSummaryFixture(): void {
    __resetStateManagerForTests();
    localStorage.clear();
}

describe("renderSummaryHelpers core functions", () => {
    it("getRowLabel returns Summary for non-lap rows and one-based labels for lap rows", () => {
        expect.assertions(3);

        expect(getRowLabel(0, false)).toBe("Summary");
        expect(getRowLabel(0, true)).toBe("Lap 1");
        expect(getRowLabel(2, true)).toBe("Lap 3");
    });

    it("getStorageKey prefers active FIT raw-data cached file path and ignores lower-priority names", () => {
        expect.assertions(3);

        resetSummaryFixture();

        try {
            const preferredFilePath = "C:/Users/Me/My Activity.fit";
            setState(
                "fitFile.rawData",
                { cachedFilePath: preferredFilePath },
                { source: "test" }
            );

            const key = getStorageKey(
                { cachedFilePath: "/tmp/ignored.fit" },
                []
            );

            expect(key).toBe(
                `summaryColSel_${encodeURIComponent(preferredFilePath)}`
            );
            expect(key).not.toContain(encodeURIComponent("/tmp/ignored.fit"));
            expect(key).toContain(encodeURIComponent("My Activity.fit"));
        } finally {
            resetSummaryFixture();
        }
    });

    it("getStorageKey falls back to data.cachedFilePath when active FIT raw data has no cached file path", () => {
        expect.assertions(2);

        resetSummaryFixture();

        try {
            const dataFilePath = "/tmp/äctivity file.fit";
            setState("fitFile.rawData", {}, { source: "test" });

            const key = getStorageKey({ cachedFilePath: dataFilePath });

            expect(key).toBe(
                `summaryColSel_${encodeURIComponent(dataFilePath)}`
            );
            expect(key).toContain(encodeURIComponent("äctivity file.fit"));
        } finally {
            resetSummaryFixture();
        }
    });

    it("getStorageKey uses the default key without legacy global file names", () => {
        expect.assertions(2);

        resetSummaryFixture();

        try {
            expect(getStorageKey()).toBe("summaryColSel_default");
            expect(getStorageKey({ other: "value" })).toBe(
                "summaryColSel_default"
            );
        } finally {
            resetSummaryFixture();
        }
    });

    it("getStorageKey returns the default key when no file identity is available", () => {
        expect.assertions(1);

        resetSummaryFixture();

        try {
            expect(getStorageKey()).toBe("summaryColSel_default");
        } finally {
            resetSummaryFixture();
        }
    });

    it("loadColPrefs returns a stored array when every value is a string", () => {
        expect.assertions(2);

        resetSummaryFixture();

        try {
            const key = "summaryColSel_valid";
            const storedColumns = [
                "speed",
                "distance",
                "timestamp",
            ];

            localStorage.setItem(key, JSON.stringify(storedColumns));

            expect(loadColPrefs(key)).toStrictEqual(storedColumns);
            expect(loadColPrefs("summaryColSel_missing")).toBeNull();
        } finally {
            resetSummaryFixture();
        }
    });

    it("loadColPrefs rejects non-array JSON values", () => {
        expect.assertions(2);

        resetSummaryFixture();

        try {
            const key = "summaryColSel_object";

            localStorage.setItem(key, JSON.stringify({ speed: true }));

            expect(loadColPrefs(key)).toBeNull();
            expect(localStorage.getItem(key)).toBe('{"speed":true}');
        } finally {
            resetSummaryFixture();
        }
    });

    it("loadColPrefs rejects arrays containing non-string values", () => {
        expect.assertions(2);

        resetSummaryFixture();

        try {
            const key = "summaryColSel_mixed";

            localStorage.setItem(key, JSON.stringify(["speed", 42]));

            expect(loadColPrefs(key)).toBeNull();
            expect(localStorage.getItem(key)).toBe('["speed",42]');
        } finally {
            resetSummaryFixture();
        }
    });

    it("loadColPrefs rejects invalid JSON without deleting the stored value", () => {
        expect.assertions(2);

        resetSummaryFixture();

        try {
            const key = "summaryColSel_invalid_json";

            localStorage.setItem(key, "not-json");

            expect(loadColPrefs(key)).toBeNull();
            expect(localStorage.getItem(key)).toBe("not-json");
        } finally {
            resetSummaryFixture();
        }
    });

    it("loadColPrefs returns null when localStorage.getItem throws after requesting the key", () => {
        expect.assertions(2);

        resetSummaryFixture();

        const key = "summaryColSel_throwing_get";
        const getItemSpy = vi
            .spyOn(localStorage, "getItem")
            .mockImplementation((): string | null => {
                throw new Error("boom");
            });

        try {
            expect(loadColPrefs(key)).toBeNull();
            expect(getItemSpy).toHaveBeenCalledWith(key);
        } finally {
            getItemSpy.mockRestore();
            resetSummaryFixture();
        }
    });

    it("saveColPrefs stores visible columns as JSON", () => {
        expect.assertions(2);

        resetSummaryFixture();

        try {
            const key = "summaryColSel_store";
            const columns = ["Speed", "Distance"];

            saveColPrefs(key, columns);

            expect(localStorage.getItem(key)).toBe(JSON.stringify(columns));
            expect(loadColPrefs(key)).toStrictEqual(columns);
        } finally {
            resetSummaryFixture();
        }
    });

    it("saveColPrefs leaves existing preferences unchanged when localStorage.setItem throws", () => {
        expect.assertions(2);

        resetSummaryFixture();

        const key = "summaryColSel_throwing_set";
        const originalColumns = ["Speed"];
        const replacementColumns = ["Distance"];

        localStorage.setItem(key, JSON.stringify(originalColumns));

        const setItemSpy = vi
            .spyOn(localStorage, "setItem")
            .mockImplementation((): void => {
                throw new Error("nope");
            });

        try {
            saveColPrefs(key, replacementColumns);

            expect(setItemSpy).toHaveBeenCalledExactlyOnceWith(
                key,
                JSON.stringify(replacementColumns)
            );
            expect(loadColPrefs(key)).toStrictEqual(originalColumns);
        } finally {
            setItemSpy.mockRestore();
            resetSummaryFixture();
        }
    });
});
