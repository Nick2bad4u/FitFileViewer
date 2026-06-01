import { describe, expect, it, vi } from "vitest";

import { openFitFileFromPath } from "../../../../electron-app/utils/files/import/openFitFileFromPath.js";

type HandleFileLoadingError = (error: Error) => void;
type NotifyFitFileLoaded = (filePath: string) => void;
type ParseFitFile = (arrayBuffer: ArrayBuffer) => Promise<unknown>;
type ReadFile = (filePath: string) => Promise<ArrayBuffer>;
type ShowFitData = (data: unknown, filePath: string) => void;
type ShowNotification = Parameters<
    typeof openFitFileFromPath
>[0]["showNotification"];

type Harness = {
    handleFileLoadingError: ReturnType<typeof vi.fn<HandleFileLoadingError>>;
    notifyFitFileLoaded: ReturnType<typeof vi.fn<NotifyFitFileLoaded>>;
    parseFitFile: ReturnType<typeof vi.fn<ParseFitFile>>;
    readFile: ReturnType<typeof vi.fn<ReadFile>>;
    showFitData: ReturnType<typeof vi.fn<ShowFitData>>;
    showNotification: ReturnType<typeof vi.fn<ShowNotification>>;
};

function createHarness(): Harness {
    return {
        handleFileLoadingError: vi.fn<HandleFileLoadingError>(),
        notifyFitFileLoaded: vi.fn<NotifyFitFileLoaded>(),
        parseFitFile: vi.fn<ParseFitFile>(),
        readFile: vi.fn<ReadFile>(),
        showFitData: vi.fn<ShowFitData>(),
        showNotification: vi.fn<ShowNotification>(),
    };
}

async function withOpenFitFileHarness(
    runTest: (harness: Harness) => Promise<void>
): Promise<void> {
    const originalElectronAPI = globalThis.electronAPI;
    const originalFitFileStateManager = globalThis.__FFV_fitFileStateManager;
    const originalShowFitData = globalThis.showFitData;
    const harness = createHarness();

    globalThis.electronAPI = {
        notifyFitFileLoaded: harness.notifyFitFileLoaded,
        parseFitFile: harness.parseFitFile,
        readFile: harness.readFile,
    } as typeof globalThis.electronAPI;
    globalThis.showFitData = harness.showFitData;
    globalThis.__FFV_fitFileStateManager = {
        handleFileLoadingError: harness.handleFileLoadingError,
    };

    try {
        await runTest(harness);
    } finally {
        globalThis.electronAPI = originalElectronAPI;
        globalThis.showFitData = originalShowFitData;
        globalThis.__FFV_fitFileStateManager = originalFitFileStateManager;
        vi.restoreAllMocks();
    }
}

describe(openFitFileFromPath, () => {
    it("displays decoded FIT messages from an absolute path", async () => {
        expect.assertions(5);

        await withOpenFitFileHarness(async (harness) => {
            const decodedMessages = { recordMesgs: [{ distance: 1000 }] };
            const openFileBtn = document.createElement("button");

            harness.readFile.mockResolvedValue(new ArrayBuffer(16));
            harness.parseFitFile.mockResolvedValue(decodedMessages);

            const result = await openFitFileFromPath({
                filePath: "C:\\activities\\ride.fit",
                openFileBtn,
                showNotification: harness.showNotification,
            });

            expect({ result }).toStrictEqual({ result: true });
            expect(harness.showFitData).toHaveBeenCalledWith(
                decodedMessages,
                "C:\\activities\\ride.fit"
            );
            expect(harness.notifyFitFileLoaded).toHaveBeenCalledWith(
                "C:\\activities\\ride.fit"
            );
            expect(harness.showNotification).toHaveBeenCalledWith(
                "File loaded successfully!",
                "success"
            );
            expect({
                disabled: openFileBtn.hasAttribute("disabled"),
            }).toStrictEqual({ disabled: false });
        });
    });

    it("reports direct parser error payloads without displaying them", async () => {
        expect.assertions(5);

        await withOpenFitFileHarness(async (harness) => {
            harness.readFile.mockResolvedValue(new ArrayBuffer(16));
            harness.parseFitFile.mockResolvedValue({
                details: "bad header",
                error: "FIT decode failed",
            });

            const result = await openFitFileFromPath({
                filePath: "C:\\activities\\broken.fit",
                showNotification: harness.showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(harness.showFitData).not.toHaveBeenCalled();
            expect(harness.showNotification).toHaveBeenCalledWith(
                "Failed to open file: FIT decode failed\nbad header",
                "error",
                8000
            );
            const loadingError =
                harness.handleFileLoadingError.mock.calls[0]?.[0];
            expect(loadingError).toBeInstanceOf(Error);
            expect(loadingError?.message).toBe("FIT decode failed\nbad header");
        });
    });

    it("reports empty file buffers before parsing", async () => {
        expect.assertions(4);

        await withOpenFitFileHarness(async (harness) => {
            harness.readFile.mockResolvedValue(new ArrayBuffer(0));

            const result = await openFitFileFromPath({
                filePath: "C:\\activities\\empty.fit",
                showNotification: harness.showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(harness.parseFitFile).not.toHaveBeenCalled();
            expect(harness.showFitData).not.toHaveBeenCalled();
            expect(harness.showNotification).toHaveBeenCalledWith(
                "Failed to open file: Selected file appears to be empty",
                "error",
                8000
            );
        });
    });

    it("reports wrapped parser error payloads without displaying them", async () => {
        expect.assertions(3);

        await withOpenFitFileHarness(async (harness) => {
            harness.readFile.mockResolvedValue(new ArrayBuffer(16));
            harness.parseFitFile.mockResolvedValue({
                data: {
                    details: "invalid CRC",
                    error: "FIT decode failed",
                },
            });

            const result = await openFitFileFromPath({
                filePath: "C:\\activities\\wrapped-error.fit",
                showNotification: harness.showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(harness.showFitData).not.toHaveBeenCalled();
            expect(harness.showNotification).toHaveBeenCalledWith(
                "Failed to open file: FIT decode failed\ninvalid CRC",
                "error",
                8000
            );
        });
    });
});
