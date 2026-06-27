import { describe, expect, it, vi } from "vitest";

const renderDecodedFitDataMock = vi.hoisted(() =>
    vi.fn<(data: unknown, filePath: string) => Promise<void>>(async () => {})
);

vi.mock(
    "../../../../electron-app/utils/rendering/core/renderDecodedFitData.js",
    () => ({ renderDecodedFitData: renderDecodedFitDataMock })
);

import { handleOpenFile } from "../../../../electron-app/utils/files/import/handleOpenFile.js";
import { fitFileStateManager } from "../../../../electron-app/utils/state/domain/fitFileState.js";
import type { RendererElectronApiScope } from "../../../../electron-app/utils/runtime/electronApiRuntime.js";

type HandleFileLoadingError = (error: Error) => void;
type LoadingPhase =
    | "error"
    | "idle"
    | "loaded"
    | "parsing"
    | "reading"
    | "rendering"
    | "selecting"
    | "validating";
type OpenFile = () => Promise<string>;
type ParseFitFile = (arrayBuffer: ArrayBuffer) => Promise<unknown>;
type ReadFile = (filePath: string) => Promise<ArrayBuffer>;
type SetLoading = (isLoading: boolean) => void;
type ShowNotification = Parameters<
    typeof handleOpenFile
>[0]["showNotification"];

type Harness = {
    electronApiScope: RendererElectronApiScope;
    handleFileLoadingError: ReturnType<typeof vi.fn<HandleFileLoadingError>>;
    openFile: ReturnType<typeof vi.fn<OpenFile>>;
    parseFitFile: ReturnType<typeof vi.fn<ParseFitFile>>;
    readFile: ReturnType<typeof vi.fn<ReadFile>>;
    setLoading: ReturnType<typeof vi.fn<SetLoading>>;
    showNotification: ReturnType<typeof vi.fn<ShowNotification>>;
    startFileLoading: ReturnType<typeof vi.fn<(filePath: string) => void>>;
    transitionLoadingPhase: ReturnType<
        typeof vi.fn<
            (
                phase: LoadingPhase,
                options?: {
                    error?: null | string;
                    filePath?: null | string;
                    progress?: number;
                    source?: string;
                }
            ) => boolean
        >
    >;
};

function createHarness(): Harness {
    const openFile = vi.fn<OpenFile>();
    const parseFitFile = vi.fn<ParseFitFile>();
    const readFile = vi.fn<ReadFile>();

    return {
        electronApiScope: {
            getElectronAPI: () => ({
                openFile,
                parseFitFile,
                readFile,
            }),
        },
        handleFileLoadingError: vi.fn<HandleFileLoadingError>(),
        openFile,
        parseFitFile,
        readFile,
        setLoading: vi.fn<SetLoading>(),
        showNotification: vi.fn<ShowNotification>(),
        startFileLoading: vi.fn<(filePath: string) => void>(),
        transitionLoadingPhase: vi.fn<
            (
                phase: LoadingPhase,
                options?: {
                    error?: null | string;
                    filePath?: null | string;
                    progress?: number;
                    source?: string;
                }
            ) => boolean
        >(() => true),
    };
}

function getRequiredLoadingError(harness: Harness): Error {
    const loadingError = harness.handleFileLoadingError.mock.calls.at(0)?.[0];

    if (!loadingError) {
        throw new TypeError("Expected file loading error");
    }

    return loadingError;
}

async function withHandleOpenFileHarness(
    runTest: (harness: Harness) => Promise<void>
): Promise<void> {
    const harness = createHarness();

    renderDecodedFitDataMock.mockReset();
    renderDecodedFitDataMock.mockResolvedValue(undefined);
    vi.spyOn(fitFileStateManager, "handleFileLoadingError").mockImplementation(
        harness.handleFileLoadingError
    );
    vi.spyOn(fitFileStateManager, "startFileLoading").mockImplementation(
        harness.startFileLoading
    );
    vi.spyOn(fitFileStateManager, "transitionLoadingPhase").mockImplementation(
        harness.transitionLoadingPhase
    );

    try {
        await runTest(harness);
    } finally {
        vi.restoreAllMocks();
    }
}

describe(handleOpenFile, () => {
    it("reports wrapped FIT decode error payloads without displaying them", async () => {
        expect.assertions(7);

        await withHandleOpenFileHarness(async (harness) => {
            harness.openFile.mockResolvedValue("C:\\activities\\bad.fit");
            harness.readFile.mockResolvedValue(new ArrayBuffer(16));
            harness.parseFitFile.mockResolvedValue({
                data: {
                    details: "invalid CRC",
                    error: "FIT decode failed",
                },
            });

            const result = await handleOpenFile(
                {
                    isOpeningFileRef: { value: false },
                    openFileBtn: { disabled: false },
                    setLoading: harness.setLoading,
                    showNotification: (...args) => {
                        harness.showNotification(...args);
                    },
                },
                { electronApiScope: harness.electronApiScope }
            );

            expect({ result }).toStrictEqual({ result: false });
            expect(renderDecodedFitDataMock).not.toHaveBeenCalled();
            expect(harness.startFileLoading).toHaveBeenCalledWith(
                "C:\\activities\\bad.fit"
            );
            expect(harness.transitionLoadingPhase.mock.calls).toEqual([
                [
                    "selecting",
                    expect.objectContaining({
                        progress: 5,
                    }),
                ],
                [
                    "validating",
                    expect.objectContaining({
                        filePath: "C:\\activities\\bad.fit",
                        progress: 45,
                    }),
                ],
                [
                    "parsing",
                    expect.objectContaining({
                        filePath: "C:\\activities\\bad.fit",
                        progress: 65,
                    }),
                ],
            ]);
            expect(harness.showNotification).toHaveBeenCalledWith(
                "Error: FIT decode failed\ninvalid CRC",
                "error"
            );
            const loadingError = getRequiredLoadingError(harness);
            expect(loadingError).toBeInstanceOf(Error);
            expect(loadingError.message).toBe("FIT decode failed");
        });
    });
});
