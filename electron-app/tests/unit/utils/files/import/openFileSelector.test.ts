import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";

// From tests/unit/utils/files/import -> utils/files/import requires going up 5 levels
const SUT_PATH = "../../../../../utils/files/import/openFileSelector.js";
const LOAD_OVERLAY_FILES_PATH = "../../../../../utils/files/import/loadOverlayFiles.js";
const LOADING_OVERLAY_PATH = "../../../../../utils/ui/components/LoadingOverlay.js";
const SHOW_NOTIFICATION_PATH = "../../../../../utils/ui/notifications/showNotification.js";

describe("openFileSelector - behavior", () => {
    let originalCreateElement: typeof document.createElement;

    beforeEach(() => {
        vi.mock("../../../../../utils/files/import/loadOverlayFiles.js", () => ({
            loadOverlayFiles: vi.fn().mockResolvedValue(undefined),
        }));
        vi.mock("../../../../../utils/ui/components/LoadingOverlay.js", () => ({
            LoadingOverlay: {
                show: vi.fn(),
                hide: vi.fn(),
            },
        }));
        vi.mock("../../../../../utils/ui/notifications/showNotification.js", () => ({
            showNotification: vi.fn(),
        }));
    });

    afterEach(() => {
        if (originalCreateElement) document.createElement = originalCreateElement as any;
        delete (globalThis as any).electronAPI;
        vi.restoreAllMocks();
    });

    function makeInputMock(files: File[] | null, throwOnHandler = false) {
        // Use the original createElement to avoid recursive spy calls
        const input = (originalCreateElement as any)("input");

        // Override click to trigger a change event synchronously
        (input as any).click = () => {
            // Re-define files right before dispatch in case JSDOM overrides it when type changes to "file"
            Object.defineProperty(input, "files", {
                get() {
                    return files ? (files as any) : null;
                },
                configurable: true,
            });
            // Also set a stable test-only property the SUT will read as a fallback
            (input as any).__files = files ? (files as any) : null;
            (input as any).selectedFiles = files ? (files as any) : null;
            const evt = new Event("change");
            if (throwOnHandler) {
                // Attach a listener that throws to exercise error path inside setupFileInputHandler
                input.addEventListener(
                    "change",
                    () => {
                        throw new Error("handler failure");
                    },
                    { once: true }
                );
            }
            input.dispatchEvent(evt);
        };
        return input as HTMLInputElement;
    }

    it("dispatches loadOverlayFiles when files selected and cleans up", async () => {
        const mockLoad = vi.fn().mockResolvedValue(undefined);
        (globalThis as any).window = Object.assign((globalThis as any).window || {}, { loadOverlayFiles: mockLoad });

        // Prepare mock input with two files
        const file1 = new File([""], "a.fit");
        const file2 = new File([""], "b.fit");
        originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, "createElement").mockImplementation((tagName: any) => {
            if (String(tagName).toLowerCase() === "input") return makeInputMock([file1, file2]);
            return originalCreateElement(tagName);
        });

    const mod = await import(SUT_PATH);
    await mod.openFileSelector();
        // Allow the async change handler to run
        await new Promise((r) => setTimeout(r, 0));

        expect(mockLoad).toHaveBeenCalledTimes(1);
        expect(mockLoad).toHaveBeenCalledWith([file1, file2]);

        const { LoadingOverlay } = await import(LOADING_OVERLAY_PATH);
        expect(LoadingOverlay.hide).toHaveBeenCalledTimes(1);
    });

    it("does nothing when no files selected but hides overlay", async () => {
        const mockLoad = vi.fn();
        (globalThis as any).window = Object.assign((globalThis as any).window || {}, { loadOverlayFiles: mockLoad });

        originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, "createElement").mockImplementation((tagName: any) => {
            if (String(tagName).toLowerCase() === "input") return makeInputMock([]);
            return originalCreateElement(tagName);
        });

    const mod = await import(SUT_PATH);
    await mod.openFileSelector();
        await new Promise((r) => setTimeout(r, 0));

        expect(mockLoad).not.toHaveBeenCalled();
        const { LoadingOverlay } = await import(LOADING_OVERLAY_PATH);
        expect(LoadingOverlay.hide).toHaveBeenCalledTimes(1);
    });

    it("shows error notification when handler throws and hides overlay", async () => {
        (globalThis as any).window = Object.assign((globalThis as any).window || {}, {
            loadOverlayFiles: vi.fn().mockImplementation(() => {
                throw new Error("boom");
            }),
        });

        const file = new File([""], "x.fit");
        originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, "createElement").mockImplementation((tagName: any) => {
            if (String(tagName).toLowerCase() === "input") return makeInputMock([file], /*throwOnHandler*/ false);
            return originalCreateElement(tagName);
        });

    const mod = await import(SUT_PATH);
    await mod.openFileSelector();
        await new Promise((r) => setTimeout(r, 0));

        const { showNotification } = await import(SHOW_NOTIFICATION_PATH);
        expect(showNotification).toHaveBeenCalled();
        const { LoadingOverlay } = await import(LOADING_OVERLAY_PATH);
        expect(LoadingOverlay.hide).toHaveBeenCalled();
    });

    it("uses native overlay dialog when available", async () => {
        const loaderModule = await import(LOAD_OVERLAY_FILES_PATH);
    const loadOverlayFilesMock = loaderModule.loadOverlayFiles as unknown as Mock;
        loadOverlayFilesMock.mockClear();

        const mockDialog = vi.fn().mockResolvedValue(["C:/rides/alpha.fit", "/tmp/beta.fit"]);
        (globalThis as any).electronAPI = {
            openOverlayDialog: mockDialog,
            readFile: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
        };

        const mod = await import(SUT_PATH);
        await mod.openFileSelector();

        expect(mockDialog).toHaveBeenCalledTimes(1);
        expect(loadOverlayFilesMock).toHaveBeenCalledTimes(1);
        const [facadeFiles] = loadOverlayFilesMock.mock.calls[0];
        expect(Array.isArray(facadeFiles)).toBe(true);
        expect(facadeFiles[0].name).toBe("alpha.fit");
        expect(facadeFiles[1].name).toBe("beta.fit");
    });
});
