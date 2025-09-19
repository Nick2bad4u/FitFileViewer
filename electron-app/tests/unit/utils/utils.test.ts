import { describe, it, expect, vi, beforeEach } from "vitest";

const SUT = "../../../utils.js";

describe("utils global attachment and API", () => {
    beforeEach(() => {
        vi.resetModules();
        // Ensure dev helpers are exposed
        (process as any).env = Object.assign({}, process.env, { NODE_ENV: "development" });
        // Provide minimal window shape
        (globalThis as any).window = Object.assign(globalThis.window || {}, {
            location: { protocol: "file:" },
        });
    });

    it("attaches utilities to window and exposes helpers", async () => {
        // Simulate version available before import
        (globalThis as any).window.electronAPI = {
            getAppVersion: vi.fn(async () => "9.9.9"),
        };

        const mod = await import(SUT);

        // Wait a tick for setTimeout(0) attachment and version promise
        await new Promise((r) => setTimeout(r, 5));

        // Check a few utilities are attached on window
        expect(typeof (globalThis as any).window.formatDistance).toBe("function");
        expect(typeof (globalThis as any).window.renderSummary).toBe("function");

        // Dev helpers exposed
        const helpers = (globalThis as any).window.devUtilsHelpers;
        expect(helpers).toBeTruthy();
        expect(typeof helpers.getAttachmentResults).toBe("function");

        // Version propagated
        const { UTILS_CONSTANTS, FitFileViewerUtils } = mod as any;
        expect(FitFileViewerUtils.version === "9.9.9" || UTILS_CONSTANTS.VERSION === "9.9.9").toBe(true);

        // FitFileViewerUtils core API
        const available = FitFileViewerUtils.getAvailableUtils();
        expect(Array.isArray(available)).toBe(true);
        expect(available.length).toBeGreaterThan(5);
        expect(FitFileViewerUtils.isUtilAvailable("formatDistance")).toBe(true);
        const fn = FitFileViewerUtils.getUtil("formatDistance");
        expect(typeof fn).toBe("function");

        // safeExecute should call the function; pick a function with simple behavior
        const result = FitFileViewerUtils.safeExecute("formatArray", [1, 2, 3]);
        expect(result).toBeDefined();

        // validate utilities
        const validation = FitFileViewerUtils.validateAllUtils();
        expect(Array.isArray(validation.valid)).toBe(true);

        // safeExecute should throw on unknown util
        expect(() => FitFileViewerUtils.safeExecute("__missing__" as any)).toThrow();
    });

    it("records collisions and cleanup removes globals", async () => {
        // Place an existing conflicting function before import
        (globalThis as any).window.formatDistance = () => "old";

        await import(SUT);
        await new Promise((r) => setTimeout(r, 5));

        const helpers = (globalThis as any).window.devUtilsHelpers;
        const results = helpers.getAttachmentResults();
        // There should be at least one collision recorded
        expect(results.collisions.length).toBeGreaterThan(0);

        // cleanup removes globals
        helpers.cleanup();
        expect((globalThis as any).window.formatDistance).toBeUndefined();
    });

    it("loads version via deferred electronAPI after import", async () => {
        // Ensure no API at import time
        delete (globalThis as any).window.electronAPI;
        const mod = await import(SUT);
        // Now provide API which polling should pick up
        (globalThis as any).window.electronAPI = {
            getAppVersion: vi.fn(async () => "7.7.7"),
        };
        // Wait enough for polling interval in utils.js (100ms)
        await new Promise((r) => setTimeout(r, 150));
        const { FitFileViewerUtils } = mod as any;
        expect(FitFileViewerUtils.version === "7.7.7").toBe(true);
    });
});
