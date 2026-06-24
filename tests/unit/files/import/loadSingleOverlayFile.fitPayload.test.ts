import { describe, expect, it, vi } from "vitest";

import { loadSingleOverlayFile } from "../../../../electron-app/utils/files/import/loadSingleOverlayFile.js";
import type { FitDecodeResult } from "../../../../electron-app/shared/fit";
import type { RendererElectronApiScope } from "../../../../electron-app/utils/runtime/electronApiRuntime.js";

type DecodeFitFile = (
    arrayBuffer: ArrayBuffer
) => Promise<FitDecodeResult | undefined>;

type Harness = {
    decodeFitFile: ReturnType<typeof vi.fn<DecodeFitFile>>;
    electronApiScope: RendererElectronApiScope;
};

function createOverlayFile(name = "overlay.fit"): {
    arrayBuffer: () => Promise<ArrayBuffer>;
    fileData: ArrayBuffer;
    name: string;
    size: number;
} {
    const fileData = new ArrayBuffer(16);

    return {
        arrayBuffer: vi
            .fn<() => Promise<ArrayBuffer>>()
            .mockResolvedValue(fileData),
        fileData,
        name,
        size: 16,
    };
}

async function withOverlayHarness(
    runTest: (harness: Harness) => Promise<void>
): Promise<void> {
    const decodeFitFile = vi.fn<DecodeFitFile>();
    const harness: Harness = {
        decodeFitFile,
        electronApiScope: {
            getElectronAPI: () => ({ decodeFitFile }),
        },
    };

    try {
        await runTest(harness);
    } finally {
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

            const overlayFile = createOverlayFile();
            const result = await loadSingleOverlayFile(overlayFile, {
                electronApiScope: harness.electronApiScope,
            });

            expect(result).toStrictEqual({
                data: decodedMessages,
                success: true,
            });
            expect(harness.decodeFitFile).toHaveBeenCalledWith(
                overlayFile.fileData
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

            const result = await loadSingleOverlayFile(createOverlayFile(), {
                electronApiScope: harness.electronApiScope,
            });

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

            const result = await loadSingleOverlayFile(createOverlayFile(), {
                electronApiScope: harness.electronApiScope,
            });

            expect(result).toStrictEqual({
                error: "Invalid FIT parse result",
                success: false,
            });
        });
    });
});
