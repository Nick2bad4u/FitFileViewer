import { describe, expect, it, vi } from "vitest";

import { openFitFileFromPath } from "../../../../../utils/files/import/openFitFileFromPath.js";

type TestElectronAPI = {
    notifyFitFileLoaded?: (filePath: string) => void;
    parseFitFile?: (arrayBuffer: ArrayBuffer) => Promise<unknown>;
    readFile?: (filePath: string) => Promise<ArrayBuffer>;
};

type OpenFitFileTestGlobal = typeof globalThis & {
    __FFV_fitFileStateManager?: {
        handleFileLoadingError: (error: Error) => void;
    };
    electronAPI?: TestElectronAPI;
    showFitData?: (data: unknown, filePath: string) => void;
};

const appGlobal = globalThis as OpenFitFileTestGlobal;

function cleanupGlobals() {
    delete appGlobal.__FFV_fitFileStateManager;
    delete appGlobal.electronAPI;
    delete appGlobal.showFitData;
    vi.restoreAllMocks();
}

describe(openFitFileFromPath, () => {
    it("reads, parses, displays, and notifies for a valid FIT path", async () => {
        expect.assertions(6);

        const filePath = "C:\\activities\\ride.fit";
        const buffer = new ArrayBuffer(8);
        const parsedData = { sessionMesgs: [{ sport: "cycling" }] };
        const notifyFitFileLoaded = vi.fn<(filePath: string) => void>();
        const showFitData =
            vi.fn<(data: unknown, filePath: string) => void>();
        const showNotification =
            vi.fn<(message: string, type: string, timeout?: number) => void>();
        const parseFitFile = vi.fn<() => Promise<unknown>>(async () => ({
            data: parsedData,
        }));
        const readFile = vi.fn<() => Promise<ArrayBuffer>>(async () => buffer);

        try {
            appGlobal.electronAPI = {
                notifyFitFileLoaded,
                parseFitFile,
                readFile,
            };
            appGlobal.showFitData = showFitData;

            const result = await openFitFileFromPath({
                filePath,
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: true });
            expect(readFile).toHaveBeenCalledWith(filePath);
            expect(parseFitFile).toHaveBeenCalledWith(buffer);
            expect(showFitData).toHaveBeenCalledWith(parsedData, filePath);
            expect(notifyFitFileLoaded).toHaveBeenCalledWith(filePath);
            expect(showNotification).toHaveBeenCalledWith(
                "File loaded successfully!",
                "success"
            );
        } finally {
            cleanupGlobals();
        }
    });

    it("rejects missing Electron file APIs without touching showFitData", async () => {
        expect.assertions(3);

        const showFitData =
            vi.fn<(data: unknown, filePath: string) => void>();
        const showNotification =
            vi.fn<(message: string, type: string, timeout?: number) => void>();
        const readFile = vi.fn<() => Promise<ArrayBuffer>>();

        try {
            appGlobal.electronAPI = { readFile };
            appGlobal.showFitData = showFitData;

            const result = await openFitFileFromPath({
                filePath: "C:\\activities\\ride.fit",
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(showFitData).not.toHaveBeenCalled();
            expect(showNotification).toHaveBeenCalledWith(
                "Electron file API unavailable.",
                "error"
            );
        } finally {
            cleanupGlobals();
        }
    });

    it("reports parse failures to notifications and file state manager", async () => {
        expect.assertions(3);

        const showNotification =
            vi.fn<(message: string, type: string, timeout?: number) => void>();
        const handleFileLoadingError = vi.fn<(error: Error) => void>();
        const parseFitFile = vi.fn<() => Promise<unknown>>(async () => {
            throw new Error("decode failed");
        });
        const readFile = vi.fn<() => Promise<ArrayBuffer>>(
            async () => new ArrayBuffer(8)
        );

        try {
            appGlobal.electronAPI = {
                parseFitFile,
                readFile,
            };
            appGlobal.showFitData = () => undefined;
            appGlobal.__FFV_fitFileStateManager = { handleFileLoadingError };

            const result = await openFitFileFromPath({
                filePath: "C:\\activities\\bad.fit",
                showNotification,
            });

            expect({ result }).toStrictEqual({ result: false });
            expect(showNotification).toHaveBeenCalledWith(
                "Failed to open file: decode failed",
                "error",
                8000
            );
            expect(handleFileLoadingError).toHaveBeenCalledWith(
                expect.objectContaining({ message: "decode failed" })
            );
        } finally {
            cleanupGlobals();
        }
    });
});
