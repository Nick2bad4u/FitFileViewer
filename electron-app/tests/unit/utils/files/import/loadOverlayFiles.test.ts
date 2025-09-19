import { describe, it, expect, vi, beforeEach } from "vitest";

// From tests/unit/utils/files/import -> utils/... requires going up 5 levels
const SUT_MULTI = "../../../../../utils/files/import/loadOverlayFiles.js";
const SUT_SINGLE = "../../../../../utils/files/import/loadSingleOverlayFile.js";
const LOADING_OVERLAY_PATH = "../../../../../utils/ui/components/LoadingOverlay.js";
const SHOW_NOTIFICATION_PATH = "../../../../../utils/ui/notifications/showNotification.js";

describe("loadOverlayFiles - multi-file handling", () => {
    beforeEach(() => {
        // minimal window globals
        (globalThis as any).window = Object.assign(globalThis.window || {}, {
            loadedFitFiles: [],
        });

        vi.mock("../../../../../utils/ui/components/LoadingOverlay.js", () => ({
            LoadingOverlay: { show: vi.fn(), hide: vi.fn() },
        }));
        vi.mock("../../../../../utils/ui/notifications/showNotification.js", () => ({
            showNotification: vi.fn(),
        }));
    });

    it("adds non-duplicate successful files and renders map once", async () => {
        // mock single loader: succeed for both
        const successData = { recordMesgs: [{ positionLat: 1, positionLong: 1 }] } as any;
        vi.doMock("../../../../../utils/files/import/loadSingleOverlayFile.js", () => ({
            loadSingleOverlayFile: vi.fn(async (f: File) => ({
                success: true,
                data: { ...successData, cachedFilePath: f.name },
            })),
        }));

        const mapSpy = vi.fn();
        (globalThis as any).window.renderMap = mapSpy;
        const updateShownFilesList = vi.fn();
        (globalThis as any).window.updateShownFilesList = updateShownFilesList;

        const { loadOverlayFiles } = await import(SUT_MULTI);
        const f1 = new File([""], "A.fit");
        const f2 = new File([""], "B.fit");
        await loadOverlayFiles([f1, f2]);

        expect(((globalThis as any).window.loadedFitFiles as any[]).length).toBe(2);
        expect(mapSpy).toHaveBeenCalledTimes(1);
        expect(updateShownFilesList).toHaveBeenCalledTimes(1);
    });

    it("skips duplicates and warns once", async () => {
        const successData = { recordMesgs: [{ positionLat: 1, positionLong: 1 }] } as any;
        vi.doMock("../../../../../utils/files/import/loadSingleOverlayFile.js", () => ({
            loadSingleOverlayFile: vi.fn(async () => ({ success: true, data: successData })),
        }));
        (globalThis as any).window.loadedFitFiles = [{ data: successData, filePath: "dup.fit" }];

        const { loadOverlayFiles } = await import(SUT_MULTI);
        const f1 = new File([""], "dup.fit");
        await loadOverlayFiles([f1]);

        const { showNotification } = await import(SHOW_NOTIFICATION_PATH);
        expect(showNotification).toHaveBeenCalled();
    });

    it("reports failures and still hides overlay", async () => {
        vi.doMock("../../../../../utils/files/import/loadSingleOverlayFile.js", () => ({
            loadSingleOverlayFile: vi.fn(async () => ({ success: false, error: "bad" })),
        }));

        const { loadOverlayFiles } = await import(SUT_MULTI);
        const f1 = new File([""], "bad.fit");
        await loadOverlayFiles([f1]);

        const { showNotification } = await import(SHOW_NOTIFICATION_PATH);
        expect(showNotification).toHaveBeenCalled();
        const { LoadingOverlay } = await import(LOADING_OVERLAY_PATH);
        expect(LoadingOverlay.hide).toHaveBeenCalled();
    });
});

describe("loadSingleOverlayFile - decode and validation", () => {
    beforeEach(() => {
        vi.resetModules();
        // Ensure we use the real implementation in this block
        vi.unmock("../../../../../utils/files/import/loadSingleOverlayFile.js");
    });

    function fileWithData(bytes = "data") {
        return new File([bytes], "file.fit");
    }

    it("resolves error when no decoder available", async () => {
        (globalThis as any).window = Object.assign((globalThis as any).window || {}, { electronAPI: undefined });
        const { loadSingleOverlayFile } =
            await vi.importActual<typeof import("../../../../../utils/files/import/loadSingleOverlayFile.js")>(
                SUT_SINGLE
            );
        const res = await loadSingleOverlayFile(fileWithData());
        expect(res.success).toBe(false);
    });

    it("returns success on valid decode with positions", async () => {
        (globalThis as any).window = Object.assign((globalThis as any).window || {}, {
            electronAPI: {
                decodeFitFile: vi.fn(async () => ({ recordMesgs: [{ positionLat: 1, positionLong: 2 }] })),
            },
        });
        const { loadSingleOverlayFile } =
            await vi.importActual<typeof import("../../../../../utils/files/import/loadSingleOverlayFile.js")>(
                SUT_SINGLE
            );
        const res = await loadSingleOverlayFile(fileWithData());
        expect(res.success).toBe(true);
        expect((res.data as any)?.recordMesgs?.length).toBe(1);
    });

    it("returns error when decode yields no positions", async () => {
        (globalThis as any).window = Object.assign((globalThis as any).window || {}, {
            electronAPI: {
                decodeFitFile: vi.fn(async () => ({ recordMesgs: [{}] })),
            },
        });
        const { loadSingleOverlayFile } =
            await vi.importActual<typeof import("../../../../../utils/files/import/loadSingleOverlayFile.js")>(
                SUT_SINGLE
            );
        const res = await loadSingleOverlayFile(fileWithData());
        expect(res.success).toBe(false);
    });
});
