import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const EXPECTED_AVAILABLE_UTILS = [
    "setLoading",
    "copyTableAsCSV",
    "patchSummaryFields",
    "formatArray",
    "formatDistance",
    "formatDuration",
    "createTables",
    "renderMap",
    "renderSummary",
    "renderTable",
    "showFitData",
    "applyTheme",
    "listenForThemeChange",
    "loadTheme",
    "updateMapTheme",
    "setTabButtonsEnabled",
    "showNotification",
    "updateActiveTab",
    "updateTabVisibility",
] as const;

async function importUtilsModule() {
    return import("../../../electron-app/utils.js");
}

describe("utils global attachment and API", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.resetModules();
        // Ensure dev helpers are exposed
        (process as any).env = Object.assign({}, process.env, {
            NODE_ENV: "development",
        });
        // Provide minimal window shape
        (globalThis as any).window = Object.assign(globalThis.window || {}, {
            location: { protocol: "file:" },
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("attaches utilities to window and exposes helpers", async () => {
        expect.hasAssertions();

        // Simulate version available before import
        (globalThis as any).window.electronAPI = {
            getAppVersion: vi.fn<() => Promise<string>>(async () => "9.9.9"),
        };

        const mod = await importUtilsModule();

        // Run the setTimeout(0) global attachment and version promise.
        await vi.runOnlyPendingTimersAsync();

        // Check a few utilities are attached on window
        expect((globalThis as any).window.formatDistance).toBeTypeOf(
            "function"
        );
        expect((globalThis as any).window.renderSummary).toBeTypeOf("function");

        // Dev helpers exposed
        const helpers = (globalThis as any).window.devUtilsHelpers;
        expect(Object.keys(helpers).sort()).toStrictEqual(
            [
                "cleanup",
                "getAttachmentResults",
                "logLevel",
                "reattachUtils",
                "validateUtils",
            ].sort()
        );
        expect(helpers.cleanup).toBeTypeOf("function");
        expect(helpers.getAttachmentResults).toBeTypeOf("function");
        expect(helpers.logLevel).toBe("debug");
        expect(helpers.reattachUtils).toBeTypeOf("function");
        expect(helpers.validateUtils).toBeTypeOf("function");

        // Version propagated
        const { UTILS_CONSTANTS, FitFileViewerUtils } = mod as any;
        expect(FitFileViewerUtils.version).toBe("9.9.9");
        expect(UTILS_CONSTANTS.VERSION).toBe("9.9.9");

        // FitFileViewerUtils core API
        const available = FitFileViewerUtils.getAvailableUtils();
        expect(available).toStrictEqual(EXPECTED_AVAILABLE_UTILS);
        const fn = FitFileViewerUtils.getUtil("formatDistance");
        expect({
            formatDistanceAvailable:
                FitFileViewerUtils.isUtilAvailable("formatDistance"),
            formatDistanceType: typeof fn,
        }).toEqual({
            formatDistanceAvailable: true,
            formatDistanceType: "function",
        });
        expect(fn).toBeTypeOf("function");

        // safeExecute should call the function; pick a function with simple behavior
        const result = FitFileViewerUtils.safeExecute(
            "formatArray",
            [
                1,
                2,
                3,
            ]
        );
        expect(result).toBe("1, 2, 3");

        // validate utilities
        const validation = FitFileViewerUtils.validateAllUtils();
        expect(validation).toStrictEqual({
            invalid: [],
            valid: EXPECTED_AVAILABLE_UTILS,
        });

        // safeExecute should throw on unknown util
        expect(() =>
            FitFileViewerUtils.safeExecute("__missing__" as any)
        ).toThrow("Function is not available: __missing__");
    });

    it("records collisions and cleanup removes globals", async () => {
        expect.hasAssertions();

        // Place an existing conflicting function before import
        (globalThis as any).window.formatDistance = () => "old";

        await importUtilsModule();
        await vi.runOnlyPendingTimersAsync();

        const helpers = (globalThis as any).window.devUtilsHelpers;
        const results = helpers.getAttachmentResults();
        expect(results.collisions).toEqual([
            {
                name: "formatDistance",
                newType: "function",
                previousType: "function",
                resolved: true,
                serious: false,
            },
        ]);

        // cleanup removes globals
        helpers.cleanup();
        expect((globalThis as any).window.formatDistance).toBeUndefined();
    });

    it("loads version via deferred electronAPI after import", async () => {
        expect.hasAssertions();

        // Ensure no API at import time
        delete (globalThis as any).window.electronAPI;
        const mod = await importUtilsModule();
        // Now provide API which polling should pick up
        (globalThis as any).window.electronAPI = {
            getAppVersion: vi.fn<() => Promise<string>>(async () => "7.7.7"),
        };
        // Advance the polling interval in utils.js.
        await vi.advanceTimersByTimeAsync(100);
        const { FitFileViewerUtils } = mod as any;
        expect(FitFileViewerUtils.version).toBe("7.7.7");
    });
});
