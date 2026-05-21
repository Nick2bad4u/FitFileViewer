import { describe, expect, it, vi } from "vitest";
import { openFitFileFromPath } from "../../../../../utils/files/import/openFitFileFromPath.js";

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

type OpenFitFileFromPathTestGlobal = typeof globalThis & {
    __FFV_fitFileStateManager?: unknown;
    electronAPI?: TestElectronAPI;
    showFitData?: (data: unknown, filePath: string) => void;
};

function cleanupFixture(): void {
    const appGlobal = globalThis as OpenFitFileFromPathTestGlobal;
    delete appGlobal.__FFV_fitFileStateManager;
    delete appGlobal.electronAPI;
    delete appGlobal.showFitData;
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

    it("reads, parses, renders, and notifies for a valid FIT file path", async () => {
        expect.assertions(8);

        cleanupFixture();

        try {
            const appGlobal = globalThis as OpenFitFileFromPathTestGlobal;
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
            const showFitData =
                vi.fn<(data: unknown, filePath: string) => void>();
            const showNotification = vi.fn<ShowNotification>();
            const openFileBtn = document.createElement("button");
            const filePath = "C:\\activities\\ride.fit";

            readFile.mockResolvedValue(fitBuffer);
            parseFitFile.mockResolvedValue({ data: fitData });
            appGlobal.electronAPI = {
                notifyFitFileLoaded,
                parseFitFile,
                readFile,
            };
            appGlobal.showFitData = showFitData;

            const result = await openFitFileFromPath({
                filePath,
                openFileBtn,
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: true });
            expect(readFile).toHaveBeenCalledWith(filePath);
            expect(parseFitFile).toHaveBeenCalledWith(fitBuffer);
            expect(showFitData).toHaveBeenCalledWith(fitData, filePath);
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
        expect.assertions(6);

        cleanupFixture();

        try {
            const appGlobal = globalThis as OpenFitFileFromPathTestGlobal;
            const handleFileLoadingError = vi.fn<(error: Error) => void>();
            const parseFitFile =
                vi.fn<(arrayBuffer: ArrayBuffer) => Promise<unknown>>();
            const readFile =
                vi.fn<(filePath: string) => Promise<ArrayBuffer>>();
            const showNotification = vi.fn<ShowNotification>();
            const showFitData =
                vi.fn<(data: unknown, filePath: string) => void>();
            const openFileBtn = document.createElement("button");
            const filePath = "C:\\activities\\empty.fit";

            readFile.mockResolvedValue(new ArrayBuffer(0));
            appGlobal.__FFV_fitFileStateManager = { handleFileLoadingError };
            appGlobal.electronAPI = { parseFitFile, readFile };
            appGlobal.showFitData = showFitData;

            const result = await openFitFileFromPath({
                filePath,
                openFileBtn,
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(readFile).toHaveBeenCalledWith(filePath);
            expect(parseFitFile).not.toHaveBeenCalled();
            expect(showNotification).toHaveBeenCalledWith(
                "Failed to open file: Invalid or unsupported file buffer",
                "error",
                8000
            );
            expect(handleFileLoadingError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Invalid or unsupported file buffer",
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
