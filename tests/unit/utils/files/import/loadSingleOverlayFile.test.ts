import { describe, expect, it, vi } from "vitest";

import { loadSingleOverlayFile } from "../../../../../electron-app/utils/files/import/loadSingleOverlayFile.js";
import type { FitDecodeResult } from "../../../../../electron-app/shared/fit.js";

type OverlayTestGlobal = typeof globalThis & {
    electronAPI?: {
        decodeFitFile?: (
            arrayBuffer: ArrayBuffer
        ) => Promise<FitDecodeResult | undefined>;
    };
};

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
): void {
    (globalThis as OverlayTestGlobal).electronAPI = { decodeFitFile };
}

function clearElectronApi(): void {
    delete (globalThis as OverlayTestGlobal).electronAPI;
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
        setDecodeFitFile(decodeFitFile);

        try {
            const result = await loadSingleOverlayFile(
                new File([new Uint8Array([1])], "overlay.txt")
            );

            expect(result).toStrictEqual({
                error: "Only .fit files can be loaded as overlays",
                success: false,
            });
            expect(decodeFitFile).not.toHaveBeenCalled();
        } finally {
            clearElectronApi();
        }
    });

    it("rejects empty files", async () => {
        expect.assertions(1);

        setDecodeFitFile(async () => ({
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        }));

        try {
            const result = await loadSingleOverlayFile(
                makeFitFile(new Uint8Array())
            );

            expect(result).toStrictEqual({
                error: "Selected file appears to be empty",
                success: false,
            });
        } finally {
            clearElectronApi();
        }
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

        clearElectronApi();

        const result = await loadSingleOverlayFile(makeFitFile());

        expect(result).toStrictEqual({
            error: "No file data or decoder not available",
            success: false,
        });
    });

    it("returns parser errors from decoded FIT data", async () => {
        expect.assertions(1);

        setDecodeFitFile(async () => ({
            error: "Parse failed",
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        }));

        try {
            const result = await loadSingleOverlayFile(makeFitFile());

            expect(result).toStrictEqual({
                error: "Parse failed",
                success: false,
            });
        } finally {
            clearElectronApi();
        }
    });

    it("requires at least one record with numeric coordinates", async () => {
        expect.assertions(1);

        setDecodeFitFile(async () => ({
            recordMesgs: [
                { positionLat: "1", positionLong: 2 },
                { positionLat: 1, positionLong: undefined },
            ],
        }));

        try {
            const result = await loadSingleOverlayFile(makeFitFile());

            expect(result).toStrictEqual({
                error: "No valid location data found in file",
                success: false,
            });
        } finally {
            clearElectronApi();
        }
    });

    it("returns decoded FIT data when validation succeeds", async () => {
        expect.assertions(1);

        const decodedData: FitDecodeResult = {
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        };
        setDecodeFitFile(async () => decodedData);

        try {
            const result = await loadSingleOverlayFile(makeFitFile());

            expect(result).toStrictEqual({
                data: decodedData,
                success: true,
            });
        } finally {
            clearElectronApi();
        }
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
            clearElectronApi();
        }
    });
});
