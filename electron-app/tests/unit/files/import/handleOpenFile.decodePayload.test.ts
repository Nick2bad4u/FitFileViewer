import { describe, expect, it, vi } from "vitest";

import { handleOpenFile } from "../../../../utils/files/import/handleOpenFile.js";

type HandleFileLoadingError = (error: Error) => void;
type OpenFile = () => Promise<string>;
type ParseFitFile = (arrayBuffer: ArrayBuffer) => Promise<unknown>;
type ReadFile = (filePath: string) => Promise<ArrayBuffer>;
type SetLoading = (isLoading: boolean) => void;
type ShowFitData = (data: unknown, filePath?: string) => void;
type ShowNotification = Parameters<
    typeof handleOpenFile
>[0]["showNotification"];

type Harness = {
    handleFileLoadingError: ReturnType<typeof vi.fn<HandleFileLoadingError>>;
    openFile: ReturnType<typeof vi.fn<OpenFile>>;
    parseFitFile: ReturnType<typeof vi.fn<ParseFitFile>>;
    readFile: ReturnType<typeof vi.fn<ReadFile>>;
    setLoading: ReturnType<typeof vi.fn<SetLoading>>;
    showFitData: ReturnType<typeof vi.fn<ShowFitData>>;
    showNotification: ReturnType<typeof vi.fn<ShowNotification>>;
};

function createHarness(): Harness {
    return {
        handleFileLoadingError: vi.fn<HandleFileLoadingError>(),
        openFile: vi.fn<OpenFile>(),
        parseFitFile: vi.fn<ParseFitFile>(),
        readFile: vi.fn<ReadFile>(),
        setLoading: vi.fn<SetLoading>(),
        showFitData: vi.fn<ShowFitData>(),
        showNotification: vi.fn<ShowNotification>(),
    };
}

async function withHandleOpenFileHarness(
    runTest: (harness: Harness) => Promise<void>
): Promise<void> {
    const originalElectronAPI = globalThis.electronAPI;
    const originalFitFileStateManager = globalThis.__FFV_fitFileStateManager;
    const originalShowFitData = globalThis.showFitData;
    const harness = createHarness();

    globalThis.electronAPI = {
        openFile: harness.openFile,
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

describe(handleOpenFile, () => {
    it("reports wrapped FIT decode error payloads without displaying them", async () => {
        expect.assertions(4);

        await withHandleOpenFileHarness(async (harness) => {
            harness.openFile.mockResolvedValue("C:\\activities\\bad.fit");
            harness.readFile.mockResolvedValue(new ArrayBuffer(16));
            harness.parseFitFile.mockResolvedValue({
                data: {
                    details: "invalid CRC",
                    error: "FIT decode failed",
                },
            });

            const result = await handleOpenFile({
                isOpeningFileRef: { value: false },
                openFileBtn: { disabled: false },
                setLoading: harness.setLoading,
                showNotification: (...args) => {
                    harness.showNotification(...args);
                },
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(harness.showFitData).not.toHaveBeenCalled();
            expect(harness.showNotification).toHaveBeenCalledWith(
                "Error: FIT decode failed\ninvalid CRC",
                "error"
            );
            expect(harness.handleFileLoadingError).toHaveBeenCalledWith(
                expect.objectContaining({ message: "FIT decode failed" })
            );
        });
    });
});
