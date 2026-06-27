import { describe, expect, it, vi } from "vitest";

const renderDecodedFitDataMock = vi.hoisted(() =>
    vi.fn<(data: unknown, filePath: string) => Promise<void>>(async () => {})
);

vi.mock(
    "../../../../electron-app/utils/rendering/core/renderDecodedFitData.js",
    () => ({ renderDecodedFitData: renderDecodedFitDataMock })
);

import { openFitFileFromPath } from "../../../../electron-app/utils/files/import/openFitFileFromPath.js";
import { fitFileStateManager } from "../../../../electron-app/utils/state/domain/fitFileState.js";
import type { RendererElectronApiScope } from "../../../../electron-app/utils/runtime/electronApiRuntime.js";

type HandleFileLoadingError = (error: Error) => void;
type NotifyFitFileLoaded = (filePath: string) => void;
type ParseFitFile = (arrayBuffer: ArrayBuffer) => Promise<unknown>;
type ReadFile = (filePath: string) => Promise<ArrayBuffer>;
type ShowNotification = Parameters<
    typeof openFitFileFromPath
>[0]["showNotification"];

type Harness = {
    electronApiScope: RendererElectronApiScope;
    handleFileLoadingError: ReturnType<typeof vi.fn<HandleFileLoadingError>>;
    notifyFitFileLoaded: ReturnType<typeof vi.fn<NotifyFitFileLoaded>>;
    parseFitFile: ReturnType<typeof vi.fn<ParseFitFile>>;
    readFile: ReturnType<typeof vi.fn<ReadFile>>;
    showNotification: ReturnType<typeof vi.fn<ShowNotification>>;
};

function createHarness(): Harness {
    const notifyFitFileLoaded = vi.fn<NotifyFitFileLoaded>();
    const parseFitFile = vi.fn<ParseFitFile>();
    const readFile = vi.fn<ReadFile>();

    return {
        electronApiScope: {
            getElectronAPI: () => ({
                notifyFitFileLoaded,
                parseFitFile,
                readFile,
            }),
        },
        handleFileLoadingError: vi.fn<HandleFileLoadingError>(),
        notifyFitFileLoaded,
        parseFitFile,
        readFile,
        showNotification: vi.fn<ShowNotification>(),
    };
}

function getRequiredLoadingError(harness: Harness): Error {
    const loadingError = harness.handleFileLoadingError.mock.calls.at(0)?.[0];

    if (!loadingError) {
        throw new TypeError("Expected file loading error");
    }

    return loadingError;
}

async function withOpenFitFileHarness(
    runTest: (harness: Harness) => Promise<void>
): Promise<void> {
    const harness = createHarness();

    renderDecodedFitDataMock.mockReset();
    renderDecodedFitDataMock.mockResolvedValue(undefined);
    vi.spyOn(fitFileStateManager, "handleFileLoadingError").mockImplementation(
        harness.handleFileLoadingError
    );

    try {
        await runTest(harness);
    } finally {
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
                electronApiScope: harness.electronApiScope,
                filePath: "C:\\activities\\ride.fit",
                openFileBtn,
                showNotification: harness.showNotification,
            });

            expect({ result }).toStrictEqual({ result: true });
            expect(renderDecodedFitDataMock).toHaveBeenCalledWith(
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
                electronApiScope: harness.electronApiScope,
                filePath: "C:\\activities\\broken.fit",
                showNotification: harness.showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(renderDecodedFitDataMock).not.toHaveBeenCalled();
            expect(harness.showNotification).toHaveBeenCalledWith(
                "Failed to open file: FIT decode failed\nbad header",
                "error",
                8000
            );
            const loadingError = getRequiredLoadingError(harness);
            expect(loadingError).toBeInstanceOf(Error);
            expect(loadingError.message).toBe("FIT decode failed\nbad header");
        });
    });

    it("reports empty file buffers before parsing", async () => {
        expect.assertions(4);

        await withOpenFitFileHarness(async (harness) => {
            harness.readFile.mockResolvedValue(new ArrayBuffer(0));

            const result = await openFitFileFromPath({
                electronApiScope: harness.electronApiScope,
                filePath: "C:\\activities\\empty.fit",
                showNotification: harness.showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(harness.parseFitFile).not.toHaveBeenCalled();
            expect(renderDecodedFitDataMock).not.toHaveBeenCalled();
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
                electronApiScope: harness.electronApiScope,
                filePath: "C:\\activities\\wrapped-error.fit",
                showNotification: harness.showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(renderDecodedFitDataMock).not.toHaveBeenCalled();
            expect(harness.showNotification).toHaveBeenCalledWith(
                "Failed to open file: FIT decode failed\ninvalid CRC",
                "error",
                8000
            );
        });
    });
});
