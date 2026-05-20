import { describe, expect, it, vi } from "vitest";

import { loadSingleOverlayFile } from "../../../../../utils/files/import/loadSingleOverlayFile.js";

type OverlayFitData = {
    error?: string;
    recordMesgs?: unknown[];
};

type FileLike = File & {
    arrayBuffer: () => Promise<ArrayBuffer>;
    name: string;
    size: number;
};

type TestElectronAPI = {
    decodeFitFile?: (arrayBuffer: ArrayBuffer) => Promise<OverlayFitData>;
};

type OverlayFileTestGlobal = typeof globalThis & {
    electronAPI?: TestElectronAPI;
};

const appGlobal = globalThis as OverlayFileTestGlobal;

function cleanupGlobals() {
    delete appGlobal.electronAPI;
    vi.restoreAllMocks();
}

describe(loadSingleOverlayFile, () => {
    it("loads a valid FIT overlay with coordinate records", async () => {
        expect.assertions(3);

        const fitData = {
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        };
        const decodeFitFile = vi.fn<
            (arrayBuffer: ArrayBuffer) => Promise<OverlayFitData>
        >(async () => fitData);
        const file = new File([new Uint8Array([1, 2, 3])], "overlay.fit");

        try {
            appGlobal.electronAPI = { decodeFitFile };

            const result = await loadSingleOverlayFile(file);

            expect(result).toStrictEqual({ data: fitData, success: true });
            expect(decodeFitFile).toHaveBeenCalledOnce();
            expect(decodeFitFile.mock.calls[0]?.[0]).toBeInstanceOf(
                ArrayBuffer
            );
        } finally {
            cleanupGlobals();
        }
    });

    it("rejects non-FIT overlay names before decoding", async () => {
        expect.assertions(2);

        const decodeFitFile = vi.fn<
            (arrayBuffer: ArrayBuffer) => Promise<OverlayFitData>
        >();
        const file = new File([new Uint8Array([1])], "overlay.txt");

        try {
            appGlobal.electronAPI = { decodeFitFile };

            const result = await loadSingleOverlayFile(file);

            expect(result).toStrictEqual({
                error: "Only .fit files can be loaded as overlays",
                success: false,
            });
            expect(decodeFitFile).not.toHaveBeenCalled();
        } finally {
            cleanupGlobals();
        }
    });

    it("rejects missing decoder bridge after reading file data", async () => {
        expect.assertions(1);

        const file = new File([new Uint8Array([1])], "overlay.fit");

        try {
            const result = await loadSingleOverlayFile(file);

            expect(result).toStrictEqual({
                error: "No file data or decoder not available",
                success: false,
            });
        } finally {
            cleanupGlobals();
        }
    });

    it("rejects oversized overlay files before decoding", async () => {
        expect.assertions(2);

        const decodeFitFile = vi.fn<
            (arrayBuffer: ArrayBuffer) => Promise<OverlayFitData>
        >();
        const file = {
            arrayBuffer: async () => new ArrayBuffer(8),
            name: "big.fit",
            size: 101 * 1024 * 1024,
        } as FileLike;

        try {
            appGlobal.electronAPI = { decodeFitFile };

            const result = await loadSingleOverlayFile(file);

            expect(result).toStrictEqual({
                error: "File size exceeds 100MB limit",
                success: false,
            });
            expect(decodeFitFile).not.toHaveBeenCalled();
        } finally {
            cleanupGlobals();
        }
    });

    it("rejects empty overlay buffers before decoding", async () => {
        expect.assertions(2);

        const decodeFitFile = vi.fn<
            (arrayBuffer: ArrayBuffer) => Promise<OverlayFitData>
        >();
        const file = {
            arrayBuffer: async () => new ArrayBuffer(0),
            name: "empty.fit",
            size: 1,
        } as FileLike;

        try {
            appGlobal.electronAPI = { decodeFitFile };

            const result = await loadSingleOverlayFile(file);

            expect(result).toStrictEqual({
                error: "Selected file appears to be empty",
                success: false,
            });
            expect(decodeFitFile).not.toHaveBeenCalled();
        } finally {
            cleanupGlobals();
        }
    });

    it("rejects decoded overlays without coordinate records", async () => {
        expect.assertions(1);

        const decodeFitFile = vi.fn<
            (arrayBuffer: ArrayBuffer) => Promise<OverlayFitData>
        >(async () => ({ recordMesgs: [{ heartRate: 150 }] }));
        const file = new File([new Uint8Array([1])], "overlay.fit");

        try {
            appGlobal.electronAPI = { decodeFitFile };

            const result = await loadSingleOverlayFile(file);

            expect(result).toStrictEqual({
                error: "No valid location data found in file",
                success: false,
            });
        } finally {
            cleanupGlobals();
        }
    });
});
