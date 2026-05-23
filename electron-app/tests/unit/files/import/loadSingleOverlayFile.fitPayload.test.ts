import { describe, expect, it, vi } from "vitest";

import { loadSingleOverlayFile } from "../../../../utils/files/import/loadSingleOverlayFile.js";
import type { FitDecodeResult } from "../../../../shared/fit";

type DecodeFitFile = (
    arrayBuffer: ArrayBuffer
) => Promise<FitDecodeResult | undefined>;

type Harness = {
    decodeFitFile: ReturnType<typeof vi.fn<DecodeFitFile>>;
};

function createOverlayFile(name = "overlay.fit"): {
    arrayBuffer: () => Promise<ArrayBuffer>;
    name: string;
    size: number;
} {
    return {
        arrayBuffer: vi
            .fn<() => Promise<ArrayBuffer>>()
            .mockResolvedValue(new ArrayBuffer(16)),
        name,
        size: 16,
    };
}

async function withOverlayHarness(
    runTest: (harness: Harness) => Promise<void>
): Promise<void> {
    const originalElectronAPI = globalThis.electronAPI;
    const harness: Harness = {
        decodeFitFile: vi.fn<DecodeFitFile>(),
    };

    globalThis.electronAPI = {
        decodeFitFile: harness.decodeFitFile,
    } as typeof globalThis.electronAPI;

    try {
        await runTest(harness);
    } finally {
        globalThis.electronAPI = originalElectronAPI;
        vi.restoreAllMocks();
    }
}

describe(loadSingleOverlayFile, () => {
    it("loads decoded FIT messages with valid location records", async () => {
        expect.assertions(2);

        await withOverlayHarness(async (harness) => {
            const decodedMessages = {
                recordMesgs: [{ positionLat: 123, positionLong: 456 }],
            };
            harness.decodeFitFile.mockResolvedValue(decodedMessages);

            const result = await loadSingleOverlayFile(createOverlayFile());

            expect(result).toStrictEqual({
                data: decodedMessages,
                success: true,
            });
            expect(harness.decodeFitFile).toHaveBeenCalledWith(
                expect.any(ArrayBuffer)
            );
        });
    });

    it("returns detailed decoder errors without treating them as overlay data", async () => {
        expect.assertions(1);

        await withOverlayHarness(async (harness) => {
            harness.decodeFitFile.mockResolvedValue({
                details: "invalid CRC",
                error: "FIT decode failed",
            });

            const result = await loadSingleOverlayFile(createOverlayFile());

            expect(result).toStrictEqual({
                error: "FIT decode failed\ninvalid CRC",
                success: false,
            });
        });
    });

    it("rejects malformed success payloads before map overlay validation", async () => {
        expect.assertions(1);

        await withOverlayHarness(async (harness) => {
            harness.decodeFitFile.mockResolvedValue({
                success: true,
                type: "not-fit-data",
            } as unknown as FitDecodeResult);

            const result = await loadSingleOverlayFile(createOverlayFile());

            expect(result).toStrictEqual({
                error: "Invalid FIT parse result",
                success: false,
            });
        });
    });
});
