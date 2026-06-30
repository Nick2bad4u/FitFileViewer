import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getBrowserCalendarState,
    getBrowserListingState,
    getBrowserRelPath,
    getBrowserScanState,
    getBrowserView,
    setBrowserCalendarState,
    setBrowserListingState,
    setBrowserRelPath,
    setBrowserScanState,
    setBrowserView,
} from "../../../../../electron-app/utils/state/domain/browserState.js";

describe("browserState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes browser view and relative path through typed helpers", () => {
        expect.assertions(4);

        expect(getBrowserRelPath()).toBe("");
        expect(getBrowserView()).toBe("files");

        setBrowserRelPath("2026/june", { source: "test" });
        setBrowserView("calendar", { source: "test" });

        expect(getBrowserRelPath()).toBe("2026/june");
        expect(getBrowserView()).toBe("calendar");
    });

    it("normalizes folder listing updates into the Browser state branch", () => {
        expect.assertions(1);

        setBrowserListingState(
            {
                fileCount: 2,
                folderCount: 1,
                itemCount: 3,
                loadedAt: 123,
                relPath: "2026",
                root: "C:\\rides",
                status: "loaded",
            },
            { source: "test" }
        );

        expect(getBrowserListingState()).toStrictEqual({
            error: null,
            fileCount: 2,
            folderCount: 1,
            itemCount: 3,
            loadedAt: 123,
            relPath: "2026",
            root: "C:\\rides",
            status: "loaded",
        });
    });

    it("normalizes calendar selection updates into the Browser state branch", () => {
        expect.assertions(1);

        setBrowserCalendarState(
            {
                monthKey: "2026-06",
                selectedDayKey: "2026-06-30",
            },
            { source: "test" }
        );

        expect(getBrowserCalendarState()).toStrictEqual({
            monthKey: "2026-06",
            selectedDayKey: "2026-06-30",
        });
    });

    it("normalizes folder scan updates into the Browser state branch", () => {
        expect.assertions(1);

        setBrowserScanState(
            {
                decodedActivityCount: 4,
                fileCount: 5,
                processedFileCount: 5,
                root: "C:\\rides",
                scannedAt: 456,
                status: "completed",
            },
            { source: "test" }
        );

        expect(getBrowserScanState()).toStrictEqual({
            decodedActivityCount: 4,
            error: null,
            fileCount: 5,
            processedFileCount: 5,
            root: "C:\\rides",
            scannedAt: 456,
            status: "completed",
        });
    });

    it("falls back to safe defaults for malformed persisted Browser state", () => {
        expect.assertions(4);

        stateManager.setState(
            "browser.calendar",
            {
                monthKey: "bad",
                selectedDayKey: "bad",
            },
            { source: "test" }
        );
        stateManager.setState("browser.view", "bad", { source: "test" });
        stateManager.setState("browser.listing", "bad", { source: "test" });
        stateManager.setState(
            "browser.scan",
            {
                decodedActivityCount: -1,
                error: 123,
                fileCount: Number.NaN,
                processedFileCount: -5,
                root: 42,
                scannedAt: Number.POSITIVE_INFINITY,
                status: "bad",
            },
            { source: "test" }
        );

        expect(getBrowserView()).toBe("files");
        expect(getBrowserCalendarState()).toStrictEqual({
            monthKey: "",
            selectedDayKey: "",
        });
        expect(getBrowserListingState()).toStrictEqual({
            error: null,
            fileCount: 0,
            folderCount: 0,
            itemCount: 0,
            loadedAt: null,
            relPath: "",
            root: null,
            status: "idle",
        });
        expect(getBrowserScanState()).toStrictEqual({
            decodedActivityCount: 0,
            error: null,
            fileCount: 0,
            processedFileCount: 0,
            root: null,
            scannedAt: null,
            status: "idle",
        });
    });

    it("falls back to safe defaults for array-shaped persisted Browser state", () => {
        expect.assertions(3);

        stateManager.setState("browser.calendar", [], { source: "test" });
        stateManager.setState("browser.listing", [], { source: "test" });
        stateManager.setState("browser.scan", [], { source: "test" });

        expect(getBrowserCalendarState()).toStrictEqual({
            monthKey: "",
            selectedDayKey: "",
        });
        expect(getBrowserListingState()).toStrictEqual({
            error: null,
            fileCount: 0,
            folderCount: 0,
            itemCount: 0,
            loadedAt: null,
            relPath: "",
            root: null,
            status: "idle",
        });
        expect(getBrowserScanState()).toStrictEqual({
            decodedActivityCount: 0,
            error: null,
            fileCount: 0,
            processedFileCount: 0,
            root: null,
            scannedAt: null,
            status: "idle",
        });
    });
});
