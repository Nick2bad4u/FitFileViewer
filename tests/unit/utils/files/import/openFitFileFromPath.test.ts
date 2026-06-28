import { describe, expect, it, vi } from "vitest";

const renderDecodedFitDataMock = vi.hoisted(() =>
    vi.fn<
        (data: unknown, filePath: string, options?: unknown) => Promise<void>
    >(async () => {})
);
const sendFitFileToAltFitReaderMock = vi.hoisted(() =>
    vi.fn<(arrayBuffer: ArrayBuffer) => void>()
);

vi.mock(
    import("../../../../../electron-app/utils/rendering/core/renderDecodedFitData.js"),
    () => ({ renderDecodedFitData: renderDecodedFitDataMock })
);

vi.mock(
    import("../../../../../electron-app/utils/files/import/sendFitFileToAltFitReader.js"),
    () => ({ sendFitFileToAltFitReader: sendFitFileToAltFitReaderMock })
);

import { openFitFileFromPath } from "../../../../../electron-app/utils/files/import/openFitFileFromPath.js";
import { fitFileStateManager } from "../../../../../electron-app/utils/state/domain/fitFileState.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type ShowNotification = (
    message: string,
    type: string,
    timeout?: number
) => void;

type TestElectronAPI = {
    notifyFitFileLoaded?: (filePath: string) => void;
    parseFitFile?: (arrayBuffer: ArrayBuffer) => Promise<unknown>;
    readFile?: (filePath: string) => Promise<ArrayBuffer>;
};
type LoadingPhase =
    | "error"
    | "idle"
    | "loaded"
    | "parsing"
    | "reading"
    | "rendering"
    | "selecting"
    | "validating";

function cleanupFixture(): void {
    vi.restoreAllMocks();
    renderDecodedFitDataMock.mockReset();
    renderDecodedFitDataMock.mockResolvedValue(undefined);
    sendFitFileToAltFitReaderMock.mockReset();
}

function createElectronApiScope(
    api: TestElectronAPI
): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

describe(openFitFileFromPath, () => {
    it("rejects invalid paths before touching the Electron API", async () => {
        expect.assertions(2);

        cleanupFixture();

        try {
            const showNotification = vi.fn<ShowNotification>();
            const result = await openFitFileFromPath({
                filePath: "   ",
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(showNotification).toHaveBeenCalledExactlyOnceWith(
                "Invalid file path.",
                "error"
            );
        } finally {
            cleanupFixture();
        }
    });

    it("reports when the required Electron file API is unavailable", async () => {
        expect.assertions(2);

        cleanupFixture();

        try {
            const showNotification = vi.fn<ShowNotification>();
            const result = await openFitFileFromPath({
                filePath: "C:\\activities\\ride.fit",
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(showNotification).toHaveBeenCalledWith(
                "Electron file API unavailable.",
                "error"
            );
        } finally {
            cleanupFixture();
        }
    });

    it("reports when scoped Electron file API is primitive", async () => {
        expect.assertions(2);

        cleanupFixture();

        try {
            const showNotification = vi.fn<ShowNotification>();
            const result = await openFitFileFromPath({
                electronApiScope: {
                    getElectronAPI: () => "not an api",
                },
                filePath: "C:\\activities\\ride.fit",
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(showNotification).toHaveBeenCalledWith(
                "Electron file API unavailable.",
                "error"
            );
        } finally {
            cleanupFixture();
        }
    });

    it("reports when scoped Electron file API is array-shaped", async () => {
        expect.assertions(4);

        cleanupFixture();

        try {
            const readFile = vi.fn<(filePath: string) => Promise<ArrayBuffer>>();
            const parseFitFile =
                vi.fn<(arrayBuffer: ArrayBuffer) => Promise<unknown>>();
            const malformedElectronApi = Object.assign([], {
                parseFitFile,
                readFile,
            });
            const showNotification = vi.fn<ShowNotification>();
            const result = await openFitFileFromPath({
                electronApiScope: {
                    getElectronAPI: () => malformedElectronApi,
                },
                filePath: "C:\\activities\\ride.fit",
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(readFile).not.toHaveBeenCalled();
            expect(parseFitFile).not.toHaveBeenCalled();
            expect(showNotification).toHaveBeenCalledWith(
                "Electron file API unavailable.",
                "error"
            );
        } finally {
            cleanupFixture();
        }
    });

    it("reads, parses, renders, forwards, and notifies for a valid FIT file path", async () => {
        expect.assertions(11);

        cleanupFixture();

        try {
            const fitData = { recordMesgs: [{ timestamp: 1 }] };
            const fitBuffer = new Uint8Array([
                14,
                16,
                24,
                32,
            ]).buffer;
            const notifyFitFileLoaded = vi.fn<(filePath: string) => void>();
            const parseFitFile =
                vi.fn<(arrayBuffer: ArrayBuffer) => Promise<unknown>>();
            const readFile =
                vi.fn<(filePath: string) => Promise<ArrayBuffer>>();
            const showNotification = vi.fn<ShowNotification>();
            const startFileLoading = vi.fn<(path: string) => void>();
            const transitionLoadingPhase = vi.fn<
                (
                    phase: LoadingPhase,
                    options?: {
                        filePath?: null | string;
                        progress?: number;
                        source?: string;
                    }
                ) => boolean
            >(() => true);
            const openFileBtn = document.createElement("button");
            const filePath = "C:\\activities\\ride.fit";

            readFile.mockResolvedValue(fitBuffer);
            parseFitFile.mockResolvedValue({ data: fitData });
            const electronApiScope = createElectronApiScope({
                notifyFitFileLoaded,
                parseFitFile,
                readFile,
            });
            vi.spyOn(
                fitFileStateManager,
                "handleFileLoadingError"
            ).mockImplementation(vi.fn<(error: Error) => void>());
            vi.spyOn(
                fitFileStateManager,
                "startFileLoading"
            ).mockImplementation(startFileLoading);
            vi.spyOn(
                fitFileStateManager,
                "transitionLoadingPhase"
            ).mockImplementation(transitionLoadingPhase);

            const result = await openFitFileFromPath({
                electronApiScope,
                filePath,
                openFileBtn,
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: true });
            expect(readFile).toHaveBeenCalledWith(filePath);
            expect(startFileLoading).toHaveBeenCalledWith(filePath);
            expect(transitionLoadingPhase.mock.calls).toEqual([
                [
                    "validating",
                    expect.objectContaining({
                        filePath,
                        progress: 45,
                    }),
                ],
                [
                    "parsing",
                    expect.objectContaining({
                        filePath,
                        progress: 65,
                    }),
                ],
                [
                    "rendering",
                    expect.objectContaining({
                        filePath,
                        progress: 90,
                    }),
                ],
            ]);
            expect(parseFitFile).toHaveBeenCalledWith(fitBuffer);
            expect(renderDecodedFitDataMock).toHaveBeenCalledWith(
                fitData,
                filePath,
                { electronApiScope }
            );
            expect(sendFitFileToAltFitReaderMock).toHaveBeenCalledWith(
                fitBuffer
            );
            expect(notifyFitFileLoaded).toHaveBeenCalledWith(filePath);
            expect(showNotification).toHaveBeenCalledWith(
                "File loaded successfully!",
                "success"
            );
            expect({
                disabled: openFileBtn.hasAttribute("disabled"),
            }).toStrictEqual({ disabled: false });
            expect(readFile).toHaveBeenCalledBefore(parseFitFile);
        } finally {
            cleanupFixture();
        }
    });

    it("reports invalid buffers through notification and file state manager", async () => {
        expect.assertions(7);

        cleanupFixture();

        try {
            const handleFileLoadingError = vi.fn<(error: Error) => void>();
            const parseFitFile =
                vi.fn<(arrayBuffer: ArrayBuffer) => Promise<unknown>>();
            const readFile =
                vi.fn<(filePath: string) => Promise<ArrayBuffer>>();
            const showNotification = vi.fn<ShowNotification>();
            const openFileBtn = document.createElement("button");
            const filePath = "C:\\activities\\empty.fit";

            readFile.mockResolvedValue(new ArrayBuffer(0));
            const electronApiScope = createElectronApiScope({
                parseFitFile,
                readFile,
            });
            vi.spyOn(
                fitFileStateManager,
                "handleFileLoadingError"
            ).mockImplementation(handleFileLoadingError);

            const result = await openFitFileFromPath({
                electronApiScope,
                filePath,
                openFileBtn,
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(readFile).toHaveBeenCalledWith(filePath);
            expect(parseFitFile).not.toHaveBeenCalled();
            expect(renderDecodedFitDataMock).not.toHaveBeenCalled();
            expect(showNotification).toHaveBeenCalledWith(
                "Failed to open file: Selected file appears to be empty",
                "error",
                8000
            );
            expect(handleFileLoadingError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Selected file appears to be empty",
                })
            );
            expect({
                disabled: openFileBtn.hasAttribute("disabled"),
            }).toStrictEqual({ disabled: false });
        } finally {
            cleanupFixture();
        }
    });
});
