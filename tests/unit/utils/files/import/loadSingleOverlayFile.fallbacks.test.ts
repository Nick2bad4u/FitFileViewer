import { describe, expect, it, vi } from "vitest";

import { loadSingleOverlayFile } from "../../../../../electron-app/utils/files/import/loadSingleOverlayFile.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type FallbackOverlayFitData = {
    recordMesgs?: unknown[];
};

type DecodeFitFile = (
    arrayBuffer: ArrayBuffer
) => Promise<FallbackOverlayFitData>;

type FallbackGlobalSnapshot = {
    decodeFitFile: ReturnType<typeof vi.fn<DecodeFitFile>>;
    electronApiScope: RendererElectronApiScope;
    originalFileReader: typeof globalThis.FileReader;
    originalResponse: typeof globalThis.Response;
};

function installFallbackGlobals(): FallbackGlobalSnapshot {
    const decodeFitFile = vi.fn<DecodeFitFile>(async () => ({
        recordMesgs: [{ positionLat: 1, positionLong: 2 }],
    }));
    const snapshot = {
        decodeFitFile,
        electronApiScope: {
            getElectronAPI: () => ({ decodeFitFile }),
        },
        originalFileReader: globalThis.FileReader,
        originalResponse: globalThis.Response,
    };

    // Force Response to be undefined so the code goes to FileReader.
    Object.defineProperty(globalThis, "Response", {
        configurable: true,
        value: undefined,
    });

    return snapshot;
}

function restoreFallbackGlobals(snapshot: FallbackGlobalSnapshot): void {
    Object.defineProperty(globalThis, "FileReader", {
        configurable: true,
        value: snapshot.originalFileReader,
    });
    Object.defineProperty(globalThis, "Response", {
        configurable: true,
        value: snapshot.originalResponse,
    });
    vi.restoreAllMocks();
}

function makeFileWithoutArrayBuffer(name = "fallback.fit"): File {
    const file = new File([new Uint8Array([1])], name);
    Object.defineProperty(file, "arrayBuffer", {
        configurable: true,
        value: undefined,
    });

    return file;
}

describe("loadSingleOverlayFile - FileReader fallbacks", () => {
    it("uses FileReader fallback and resolves successfully (covers load handler)", async () => {
        expect.assertions(2);

        const snapshot = installFallbackGlobals();

        class MockFileReader {
            public result: ArrayBuffer | null = null;
            private loadCallback: (() => void) | undefined;

            addEventListener(type: string, callback: () => void): void {
                if (type === "load") {
                    this.loadCallback = callback;
                }
            }

            readAsArrayBuffer(_file: File): void {
                queueMicrotask(() => {
                    this.result = new ArrayBuffer(8);
                    this.loadCallback?.();
                });
            }
        }
        Object.defineProperty(globalThis, "FileReader", {
            configurable: true,
            value: MockFileReader,
        });

        try {
            const result = await loadSingleOverlayFile(
                makeFileWithoutArrayBuffer(),
                { electronApiScope: snapshot.electronApiScope }
            );

            expect(result).toStrictEqual({
                data: {
                    recordMesgs: [{ positionLat: 1, positionLong: 2 }],
                },
                success: true,
            });
            expect(snapshot.decodeFitFile).toHaveBeenCalledWith(
                expect.any(ArrayBuffer)
            );
        } finally {
            restoreFallbackGlobals(snapshot);
        }
    });

    it("propagates FileReader error via catch (covers onerror handler)", async () => {
        expect.assertions(2);

        const snapshot = installFallbackGlobals();

        class MockFileReader {
            private errorCallback: (() => void) | undefined;

            addEventListener(type: string, callback: () => void): void {
                if (type === "error") {
                    this.errorCallback = callback;
                }
            }

            readAsArrayBuffer(_file: File): void {
                queueMicrotask(() => {
                    this.errorCallback?.();
                });
            }
        }
        Object.defineProperty(globalThis, "FileReader", {
            configurable: true,
            value: MockFileReader,
        });

        try {
            const result = await loadSingleOverlayFile(
                makeFileWithoutArrayBuffer("bad.fit"),
                { electronApiScope: snapshot.electronApiScope }
            );

            expect(result).toStrictEqual({
                error: "Failed to read file",
                success: false,
            });
            expect(snapshot.decodeFitFile).toHaveBeenCalledTimes(0);
        } finally {
            restoreFallbackGlobals(snapshot);
        }
    });
});
