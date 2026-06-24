import { describe, expect, it, vi } from "vitest";

import { loadSingleOverlayFile } from "../../../../../electron-app/utils/files/import/loadSingleOverlayFile.js";
import type { LoadSingleOverlayFileRuntimeScope } from "../../../../../electron-app/utils/files/import/loadSingleOverlayFileRuntime.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type FallbackOverlayFitData = {
    recordMesgs?: unknown[];
};

type DecodeFitFile = (
    arrayBuffer: ArrayBuffer
) => Promise<FallbackOverlayFitData>;

type FallbackHarness = {
    decodeFitFile: ReturnType<typeof vi.fn<DecodeFitFile>>;
    electronApiScope: RendererElectronApiScope;
};

function createFallbackHarness(): FallbackHarness {
    const decodeFitFile = vi.fn<DecodeFitFile>(async () => ({
        recordMesgs: [{ positionLat: 1, positionLong: 2 }],
    }));
    return {
        decodeFitFile,
        electronApiScope: {
            getElectronAPI: () => ({ decodeFitFile }),
        },
    };
}

function restoreFallbackHarness(): void {
    vi.restoreAllMocks();
}

function makeFileReaderRuntimeScope(
    FileReaderConstructor: new () => FileReader
): LoadSingleOverlayFileRuntimeScope {
    return {
        getAbortController: () => AbortController,
        getFileReader: () => FileReaderConstructor,
        getResponse: () => undefined,
    };
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

        const harness = createFallbackHarness();

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
        try {
            const result = await loadSingleOverlayFile(
                makeFileWithoutArrayBuffer(),
                {
                    electronApiScope: harness.electronApiScope,
                    runtimeScope: makeFileReaderRuntimeScope(
                        MockFileReader as unknown as new () => FileReader
                    ),
                }
            );

            expect(result).toStrictEqual({
                data: {
                    recordMesgs: [{ positionLat: 1, positionLong: 2 }],
                },
                success: true,
            });
            expect(harness.decodeFitFile).toHaveBeenCalledWith(
                expect.any(ArrayBuffer)
            );
        } finally {
            restoreFallbackHarness();
        }
    });

    it("propagates FileReader error via catch (covers onerror handler)", async () => {
        expect.assertions(2);

        const harness = createFallbackHarness();

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
        try {
            const result = await loadSingleOverlayFile(
                makeFileWithoutArrayBuffer("bad.fit"),
                {
                    electronApiScope: harness.electronApiScope,
                    runtimeScope: makeFileReaderRuntimeScope(
                        MockFileReader as unknown as new () => FileReader
                    ),
                }
            );

            expect(result).toStrictEqual({
                error: "Failed to read file",
                success: false,
            });
            expect(harness.decodeFitFile).toHaveBeenCalledTimes(0);
        } finally {
            restoreFallbackHarness();
        }
    });
});
