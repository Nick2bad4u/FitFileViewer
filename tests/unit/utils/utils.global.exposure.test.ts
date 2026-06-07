import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const EXPECTED_AVAILABLE_UTILS = [
    "copyTableAsCSV",
    "patchSummaryFields",
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

const EXPECTED_FIT_FILE_VIEWER_UTIL_KEYS = [
    "cleanup",
    "getAvailableUtils",
    "getUtil",
    "isUtilAvailable",
    "namespace",
    "safeExecute",
    "utils",
    "validateAllUtils",
    "version",
] as const;

const EXPECTED_COLLISION_ATTACHMENT_RESULTS = EXPECTED_AVAILABLE_UTILS.map(
    (utilityName) =>
        utilityName === "setTabButtonsEnabled"
            ? `${utilityName} (already attached)`
            : utilityName
);

// Helper to import fresh module instance each time
async function importFresh() {
    // Reset module cache to ensure fresh evaluation (module has top-level side-effects)
    vi.resetModules();
    return import("../../../electron-app/utils.js");
}

// Small helper to wait for next macrotask so setTimeout(..., 0) fires
function nextTick(): Promise<void> {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            clearTimeout(timeout);
            resolve();
        }, 0);
    });
}

// Ensure clean window between tests
afterEach(() => {
    // Attempt to run provided cleanup if available to remove globals we attached
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w: any = window as any;
        if (
            w.FitFileViewerUtils &&
            typeof w.FitFileViewerUtils.cleanup === "function"
        ) {
            w.FitFileViewerUtils.cleanup();
        }
    } catch {
        // ignore
    }

    // Remove testing electronAPI stub if present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).electronAPI = undefined;
});

describe("utils.js – global exposure and helpers", () => {
    beforeEach(() => {
        // Ensure process.env changes don't leak across tests
        vi.unstubAllGlobals();
    });

    it("exposes FitFileViewerUtils and attaches utilities to window", async () => {
        expect.assertions(17);

        const mod = await importFresh();
        // Wait for attachUtilitiesToWindow (setTimeout(..., 0))
        await nextTick();

        // Basic named exports should exist
        expect(Object.keys(mod).sort()).toStrictEqual(
            [
                "FitFileViewerUtils",
                "UTILS_CONSTANTS",
                "default",
            ].sort()
        );

        // The global namespace should be attached synchronously
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w: any = window as any;
        expect(Object.keys(w.FitFileViewerUtils).sort()).toStrictEqual(
            [...EXPECTED_FIT_FILE_VIEWER_UTIL_KEYS].sort()
        );
        expect(w.FitFileViewerUtils.cleanup).toBeTypeOf("function");
        expect(w.FitFileViewerUtils.getAvailableUtils).toBeTypeOf("function");
        expect(w.FitFileViewerUtils.getUtil).toBeTypeOf("function");
        expect(w.FitFileViewerUtils.isUtilAvailable).toBeTypeOf("function");
        expect(w.FitFileViewerUtils.namespace).toBe("FitFileViewer");
        expect(w.FitFileViewerUtils.safeExecute).toBeTypeOf("function");
        expect(Object.keys(w.FitFileViewerUtils.utils)).toStrictEqual(
            EXPECTED_AVAILABLE_UTILS
        );
        expect(w.FitFileViewerUtils.validateAllUtils).toBeTypeOf("function");
        expect(w.FitFileViewerUtils.version).toBe("unknown");

        // setTimeout callback should have attached the individual utilities on window
        const available = w.FitFileViewerUtils.getAvailableUtils();
        expect(available).toStrictEqual(EXPECTED_AVAILABLE_UTILS);

        // And they should be functions on window
        for (const key of [
            "patchSummaryFields",
            "renderMap",
            "renderSummary",
            "updateActiveTab",
            "updateTabVisibility",
        ]) {
            expect({
                available: w.FitFileViewerUtils.isUtilAvailable(key),
                type: typeof w[key],
            }).toEqual({
                available: true,
                type: "function",
            });
        }
    });

    it("loads version from electron API when available", async () => {
        expect.assertions(4);

        // Provide an electronAPI before importing module so init path picks it up immediately
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).electronAPI = {
            getAppVersion: vi
                .fn<() => Promise<string>>()
                .mockResolvedValue("9.9.9"),
        };

        const mod = await importFresh();
        // Give the async version loader a moment to resolve
        await nextTick();

        // UTILS_CONSTANTS.VERSION and FitFileViewerUtils.version should reflect the mocked version
        expect(mod.UTILS_CONSTANTS).toStrictEqual({
            ERRORS: {
                FUNCTION_NOT_AVAILABLE: "Function is not available",
                INVALID_FUNCTION: "Invalid function provided",
                NAMESPACE_COLLISION: "Namespace collision detected",
            },
            LOG_PREFIX: "[utils.js]",
            NAMESPACE: "FitFileViewer",
            VERSION: "9.9.9",
        });
        expect(mod.UTILS_CONSTANTS.VERSION).toBe("9.9.9");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w: any = window as any;
        expect(w.FitFileViewerUtils.version).toBe("9.9.9");
        // Ensure electronAPI was queried
        expect(
            (window as any).electronAPI.getAppVersion
        ).toHaveBeenCalledOnce();
    });

    it("safeExecute throws for unknown utility and succeeds for known one", async () => {
        expect.assertions(2);

        const mod = await importFresh();
        await nextTick();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w: any = window as any;

        // Unknown util should throw
        expect(() =>
            w.FitFileViewerUtils.safeExecute("__does_not_exist__")
        ).toThrow("Function is not available: __does_not_exist__");

        expect(
            w.FitFileViewerUtils.safeExecute("patchSummaryFields", {
                total_distance: 1000,
            })
        ).toEqual(
            expect.objectContaining({
                total_distance: "1.00 km / 0.62 mi",
            })
        );
    });

    it("exposes dev helpers in development and records collisions", async () => {
        expect.assertions(10);

        // Force development mode so dev helpers are exposed (evaluated at module init)
        vi.stubEnv("NODE_ENV", "development");

        // Pre-populate a conflicting function on window before import to trigger collision handling
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).patchSummaryFields = function legacyImpl() {
            /* legacy */
        };

        await importFresh();
        await nextTick();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w: any = window as any;
        expect(Object.keys(w.devUtilsHelpers).sort()).toStrictEqual(
            [
                "cleanup",
                "getAttachmentResults",
                "logLevel",
                "reattachUtils",
                "validateUtils",
            ].sort()
        );
        expect(w.devUtilsHelpers.cleanup).toBeTypeOf("function");
        expect(w.devUtilsHelpers.getAttachmentResults).toBeTypeOf("function");
        expect(w.devUtilsHelpers.logLevel).toBe("debug");
        expect(w.devUtilsHelpers.reattachUtils).toBeTypeOf("function");
        expect(w.devUtilsHelpers.validateUtils).toBeTypeOf("function");

        const results = w.devUtilsHelpers.getAttachmentResults();
        expect(results.collisions).toStrictEqual([
            {
                name: "patchSummaryFields",
                newType: "function",
                previousType: "function",
                resolved: true,
                serious: false,
            },
        ]);
        expect(results.failed).toStrictEqual([]);
        expect(results.successful).toStrictEqual(
            EXPECTED_COLLISION_ATTACHMENT_RESULTS
        );
        expect(results.total).toBe(EXPECTED_AVAILABLE_UTILS.length);
    });

    it("cleanup removes attached global utilities", async () => {
        expect.assertions(3);

        await importFresh();
        await nextTick();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w: any = window as any;
        expect(w.patchSummaryFields).toBeTypeOf("function");

        // Remove everything
        w.FitFileViewerUtils.cleanup();

        expect(w).not.toHaveProperty("patchSummaryFields");
        expect(w).not.toHaveProperty("renderSummary");
    });
});
