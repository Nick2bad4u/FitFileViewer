import { describe, expect, it, vi } from "vitest";

import { DragDropHandler } from "../../../electron-app/utils/ui/dragDropHandler.js";
import type { FitDecodeResult } from "../../../electron-app/shared/fit";

const mocks = vi.hoisted(() => ({
    addEventListenerWithCleanup:
        vi.fn<
            (
                target: EventTarget,
                type: string,
                listener: EventListenerOrEventListenerObject
            ) => void
        >(),
    endTimer: vi.fn<(operationId: string) => void>(),
    getState: vi.fn<(key: string) => unknown>(),
    handleFileLoadingError: vi.fn<(error: Error) => void>(),
    isEnabled: vi.fn<() => boolean>(),
    setFileOpening: vi.fn<(isOpening: boolean) => void>(),
    setState: vi.fn<(key: string, value: unknown, options?: unknown) => void>(),
    renderDecodedFitData:
        vi.fn<(data: unknown, filePath: string) => Promise<void>>(),
    showNotification:
        vi.fn<(message: string, type?: string) => Promise<void> | void>(),
    startFileLoading: vi.fn<(filePath: string) => void>(),
    startTimer: vi.fn<(operationId: string) => void>(),
    validateElectronAPI: vi.fn<() => boolean>(),
    validateElement: vi.fn<(elementId: string) => HTMLElement | null>(),
}));

vi.mock(
    import("../../../electron-app/utils/app/lifecycle/appActions.js"),
    () => ({
        AppActions: {
            setFileOpening: mocks.setFileOpening,
        },
    })
);

vi.mock(import("../../../electron-app/utils/debug/stateDevTools.js"), () => ({
    performanceMonitor: {
        endTimer: mocks.endTimer,
        isEnabled: mocks.isEnabled,
        startTimer: mocks.startTimer,
    },
}));

vi.mock(
    import("../../../electron-app/utils/rendering/core/renderDecodedFitData.js"),
    () => ({
        renderDecodedFitData: mocks.renderDecodedFitData,
    })
);

vi.mock(
    import("../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: mocks.getState,
        setState: mocks.setState,
    })
);

vi.mock(
    import("../../../electron-app/utils/state/domain/fitFileState.js"),
    () => ({
        fitFileStateManager: {
            handleFileLoadingError: mocks.handleFileLoadingError,
            startFileLoading: mocks.startFileLoading,
        },
    })
);

vi.mock(import("../../../electron-app/utils/ui/mainUiDomUtils.js"), () => ({
    addEventListenerWithCleanup: mocks.addEventListenerWithCleanup,
    validateElectronAPI: mocks.validateElectronAPI,
    validateElement: mocks.validateElement,
}));

vi.mock(
    import("../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mocks.showNotification,
    })
);

type DecodeFitFile = (buffer: ArrayBuffer) => Promise<FitDecodeResult>;
type MockFileReaderConstructor = new () => FileReader;

function createDroppedFile(name = "bad.fit"): File & { path: string } {
    return {
        name,
        path: `C:/rides/${name}`,
    } as File & { path: string };
}

function resetHarnessMocks(): void {
    vi.clearAllMocks();
    mocks.getState.mockReturnValue(undefined);
    mocks.isEnabled.mockReturnValue(false);
    mocks.renderDecodedFitData.mockResolvedValue(undefined);
    mocks.validateElectronAPI.mockReturnValue(true);
    mocks.validateElement.mockReturnValue(null);
}

function createRuntimeScope(
    FileReaderConstructor: MockFileReaderConstructor
): ConstructorParameters<typeof DragDropHandler>[0]["runtimeScope"] {
    return {
        getAbortController: () => AbortController,
        getDateNow: () => () => 123_456,
        getDocument: () => document,
        getEventTarget: () => new EventTarget(),
        getFileReader: () => FileReaderConstructor,
    };
}

describe(DragDropHandler, () => {
    it("reads dropped files through the injected FileReader runtime", async () => {
        expect.assertions(2);

        resetHarnessMocks();

        const arrayBuffer = new ArrayBuffer(16);
        const readAsArrayBuffer = vi.fn();

        class MockFileReader {
            public result: ArrayBuffer | null = null;
            private loadCallback: (() => void) | undefined;

            addEventListener(type: string, callback: () => void): void {
                if (type === "load") {
                    this.loadCallback = callback;
                }
            }

            readAsArrayBuffer(file: File): void {
                readAsArrayBuffer(file);
                queueMicrotask(() => {
                    this.result = arrayBuffer;
                    this.loadCallback?.();
                });
            }
        }

        const handler = new DragDropHandler({
            runtimeScope: createRuntimeScope(
                MockFileReader as unknown as MockFileReaderConstructor
            ),
        });
        const file = createDroppedFile("reader.fit");

        await expect(handler.readFileAsArrayBuffer(file)).resolves.toBe(
            arrayBuffer
        );
        expect(readAsArrayBuffer).toHaveBeenCalledWith(file);
    });

    it("reports detailed decoder payload errors without displaying FIT data", async () => {
        expect.assertions(6);

        resetHarnessMocks();

        const decodeFitFile = vi.fn<DecodeFitFile>().mockResolvedValue({
            details: "invalid CRC",
            error: "FIT decode failed",
        });
        const handler = new DragDropHandler({
            electronApiScope: {
                getElectronAPI: () => ({
                    decodeFitFile,
                }),
            },
        });
        vi.spyOn(handler, "readFileAsArrayBuffer").mockResolvedValue(
            new ArrayBuffer(16)
        );

        const outcome = await handler.processDroppedFile(createDroppedFile());

        expect({ outcome }).toStrictEqual({ outcome: undefined });
        expect(mocks.renderDecodedFitData).not.toHaveBeenCalled();
        expect(mocks.showNotification).toHaveBeenCalledWith(
            "Failed to load FIT file",
            "error"
        );
        const [loadingError] = mocks.handleFileLoadingError.mock.calls[0] ?? [
            undefined,
        ];
        expect({
            errorMessage: loadingError?.message,
            errorName: loadingError?.name,
        }).toStrictEqual({
            errorMessage: "FIT decode failed\ninvalid CRC",
            errorName: "Error",
        });
        expect(mocks.setFileOpening).toHaveBeenCalledWith(true);
        expect(mocks.setFileOpening).toHaveBeenLastCalledWith(false);
    });

    it("rejects malformed scoped Electron APIs without decoding dropped files", async () => {
        expect.assertions(7);

        resetHarnessMocks();

        const handler = new DragDropHandler({
            electronApiScope: {
                getElectronAPI: () => ({
                    decodeFitFile: "not callable",
                }),
            },
        });
        vi.spyOn(handler, "readFileAsArrayBuffer").mockResolvedValue(
            new ArrayBuffer(16)
        );

        const outcome = await handler.processDroppedFile(
            createDroppedFile("malformed.fit")
        );

        expect({ outcome }).toStrictEqual({ outcome: undefined });
        expect(mocks.renderDecodedFitData).not.toHaveBeenCalled();
        expect(mocks.handleFileLoadingError).not.toHaveBeenCalled();
        expect(mocks.showNotification).toHaveBeenCalledWith(
            "FIT file decoding is not supported in this environment.",
            "error"
        );
        expect(mocks.startFileLoading).toHaveBeenCalledWith(
            "C:/rides/malformed.fit"
        );
        expect(mocks.setFileOpening).toHaveBeenCalledWith(true);
        expect(mocks.setFileOpening).toHaveBeenLastCalledWith(false);
    });
});
