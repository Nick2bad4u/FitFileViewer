import { describe, expect, it, vi } from "vitest";

import { loadSingleOverlayFile } from "../../../../../electron-app/utils/files/import/loadSingleOverlayFile.js";
import type { FitDecodeResult } from "../../../../../electron-app/shared/fit.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

function makeFitFile(
    bytes = new Uint8Array([
        1,
        2,
        3,
    ])
): File {
    return new File([bytes], "overlay.fit", {
        type: "application/octet-stream",
    });
}

function setDecodeFitFile(
    decodeFitFile: (
        arrayBuffer: ArrayBuffer
    ) => Promise<FitDecodeResult | undefined>
): RendererElectronApiScope {
    return {
        getElectronAPI: () => ({ decodeFitFile }),
    };
}

describe(loadSingleOverlayFile, () => {
    it("rejects non-FIT file names before reading or decoding", async () => {
        expect.assertions(2);

        const decodeFitFile =
            vi.fn<
                (
                    arrayBuffer: ArrayBuffer
                ) => Promise<FitDecodeResult | undefined>
            >();
        const electronApiScope = setDecodeFitFile(decodeFitFile);
        const result = await loadSingleOverlayFile(
            new File([new Uint8Array([1])], "overlay.txt"),
            { electronApiScope }
        );

        expect(result).toStrictEqual({
            error: "Only .fit files can be loaded as overlays",
            success: false,
        });
        expect(decodeFitFile).not.toHaveBeenCalled();
    });

    it("rejects empty files", async () => {
        expect.assertions(1);

        const electronApiScope = setDecodeFitFile(async () => ({
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        }));

        const result = await loadSingleOverlayFile(
            makeFitFile(new Uint8Array()),
            { electronApiScope }
        );

        expect(result).toStrictEqual({
            error: "Selected file appears to be empty",
            success: false,
        });
    });

    it("rejects oversized declared files before reading", async () => {
        expect.assertions(1);

        const file = {
            arrayBuffer: async () => new ArrayBuffer(1),
            name: "large.fit",
            size: 100 * 1024 * 1024 + 1,
        };

        const result = await loadSingleOverlayFile(file);

        expect(result).toStrictEqual({
            error: "File size exceeds 100MB limit",
            success: false,
        });
    });

    it("reports a missing decoder bridge", async () => {
        expect.assertions(1);

        const result = await loadSingleOverlayFile(makeFitFile());

        expect(result).toStrictEqual({
            error: "No file data or decoder not available",
            success: false,
        });
    });

    it("rejects array-shaped decoder bridges", async () => {
        expect.assertions(2);

        const decodeFitFile =
            vi.fn<
                (
                    arrayBuffer: ArrayBuffer
                ) => Promise<FitDecodeResult | undefined>
            >();
        const malformedElectronApi = Object.assign([], { decodeFitFile });
        const result = await loadSingleOverlayFile(makeFitFile(), {
            electronApiScope: {
                getElectronAPI: () => malformedElectronApi,
            },
        });

        expect(result).toStrictEqual({
            error: "No file data or decoder not available",
            success: false,
        });
        expect(decodeFitFile).not.toHaveBeenCalled();
    });

    it("reports a missing decoder when bridge methods cannot be inspected", async () => {
        expect.assertions(2);

        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        try {
            const result = await loadSingleOverlayFile(makeFitFile(), {
                electronApiScope: {
                    getElectronAPI: () =>
                        new Proxy(
                            {},
                            {
                                get(_target, propertyKey) {
                                    if (propertyKey === "decodeFitFile") {
                                        throw new Error("decoder unavailable");
                                    }

                                    return undefined;
                                },
                            }
                        ),
                },
            });

            expect(result).toStrictEqual({
                error: "No file data or decoder not available",
                success: false,
            });
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    it("returns parser errors from decoded FIT data", async () => {
        expect.assertions(1);

        const electronApiScope = setDecodeFitFile(async () => ({
            error: "Parse failed",
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        }));

        const result = await loadSingleOverlayFile(makeFitFile(), {
            electronApiScope,
        });

        expect(result).toStrictEqual({
            error: "Parse failed",
            success: false,
        });
    });

    it("requires at least one record with numeric coordinates", async () => {
        expect.assertions(1);

        const electronApiScope = setDecodeFitFile(async () => ({
            recordMesgs: [
                { positionLat: "1", positionLong: 2 },
                { positionLat: 1, positionLong: undefined },
            ],
        }));

        const result = await loadSingleOverlayFile(makeFitFile(), {
            electronApiScope,
        });

        expect(result).toStrictEqual({
            error: "No valid location data found in file",
            success: false,
        });
    });

    it("returns decoded FIT data when validation succeeds", async () => {
        expect.assertions(1);

        const decodedData: FitDecodeResult = {
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        };
        const electronApiScope = setDecodeFitFile(async () => decodedData);

        const result = await loadSingleOverlayFile(makeFitFile(), {
            electronApiScope,
        });

        expect(result).toStrictEqual({
            data: decodedData,
            success: true,
        });
    });

    it("reports thrown read errors without leaking unhandled exceptions", async () => {
        expect.assertions(2);

        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const file = {
            arrayBuffer: async () => {
                throw new Error("read failed");
            },
            name: "broken.fit",
        };

        try {
            const result = await loadSingleOverlayFile(file);

            expect(result).toStrictEqual({
                error: "read failed",
                success: false,
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[loadSingleOverlayFile] Error processing file:",
                "broken.fit",
                expect.any(Error)
            );
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });
});
