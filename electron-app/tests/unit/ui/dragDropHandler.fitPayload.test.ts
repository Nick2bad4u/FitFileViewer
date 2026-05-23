import { describe, expect, it, vi } from "vitest";

import { DragDropHandler } from "../../../utils/ui/dragDropHandler.js";
import type { FitDecodeResult } from "../../../shared/fit";

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
    showFitData: vi.fn<(data: unknown, filePath: string) => void>(),
    showNotification:
        vi.fn<(message: string, type?: string) => Promise<void> | void>(),
    startFileLoading: vi.fn<(filePath: string) => void>(),
    startTimer: vi.fn<(operationId: string) => void>(),
    validateElectronAPI: vi.fn<() => boolean>(),
    validateElement: vi.fn<(elementId: string) => HTMLElement | null>(),
}));

vi.mock(import("../../../utils/app/lifecycle/appActions.js"), () => ({
    AppActions: {
        setFileOpening: mocks.setFileOpening,
    },
}));

vi.mock(import("../../../utils/debug/stateDevTools.js"), () => ({
    performanceMonitor: {
        endTimer: mocks.endTimer,
        isEnabled: mocks.isEnabled,
        startTimer: mocks.startTimer,
    },
}));

vi.mock(import("../../../utils/rendering/core/showFitData.js"), () => ({
    showFitData: mocks.showFitData,
}));

vi.mock(import("../../../utils/state/core/stateManager.js"), () => ({
    getState: mocks.getState,
    setState: mocks.setState,
}));

vi.mock(import("../../../utils/state/domain/fitFileState.js"), () => ({
    fitFileStateManager: {
        handleFileLoadingError: mocks.handleFileLoadingError,
        startFileLoading: mocks.startFileLoading,
    },
}));

vi.mock(import("../../../utils/ui/mainUiDomUtils.js"), () => ({
    addEventListenerWithCleanup: mocks.addEventListenerWithCleanup,
    validateElectronAPI: mocks.validateElectronAPI,
    validateElement: mocks.validateElement,
}));

vi.mock(import("../../../utils/ui/notifications/showNotification.js"), () => ({
    showNotification: mocks.showNotification,
}));

type DecodeFitFile = (buffer: ArrayBuffer) => Promise<FitDecodeResult>;

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
    mocks.validateElectronAPI.mockReturnValue(true);
    mocks.validateElement.mockReturnValue(null);
}

describe(DragDropHandler, () => {
    it("reports detailed decoder payload errors without displaying FIT data", async () => {
        expect.assertions(6);

        resetHarnessMocks();

        const decodeFitFile = vi.fn<DecodeFitFile>().mockResolvedValue({
            details: "invalid CRC",
            error: "FIT decode failed",
        });
        const originalElectronAPI = globalThis.electronAPI;
        globalThis.electronAPI = {
            decodeFitFile,
        } as typeof globalThis.electronAPI;

        try {
            const handler = new DragDropHandler();
            vi.spyOn(handler, "readFileAsArrayBuffer").mockResolvedValue(
                new ArrayBuffer(16)
            );

            const outcome =
                await handler.processDroppedFile(createDroppedFile());

            expect({ outcome }).toStrictEqual({ outcome: undefined });
            expect(mocks.showFitData).not.toHaveBeenCalled();
            expect(mocks.showNotification).toHaveBeenCalledWith(
                "Failed to load FIT file",
                "error"
            );
            expect(mocks.handleFileLoadingError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "FIT decode failed\ninvalid CRC",
                })
            );
            expect(mocks.setFileOpening).toHaveBeenCalledWith(true);
            expect(mocks.setFileOpening).toHaveBeenLastCalledWith(false);
        } finally {
            globalThis.electronAPI = originalElectronAPI;
        }
    });
});
