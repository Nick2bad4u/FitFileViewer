import { describe, expect, it, vi } from "vitest";

import { loadSingleOverlayFile } from "../../../../../utils/files/import/loadSingleOverlayFile.js";

type OverlayFitData = {
    error?: string;
    recordMesgs?: unknown[];
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
