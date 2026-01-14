/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("registerFitFileHandlers", () => {
    let registerFitFileHandlers;
    let registerIpcHandle;
    let ensureFitParserStateIntegration;
    let logWithContext;
    let decodeFitFileMock;

    beforeEach(async () => {
        vi.resetModules();
        decodeFitFileMock = vi.fn().mockResolvedValue({ parsed: true });

        ({ registerFitFileHandlers } = await import("../../../../main/ipc/registerFitFileHandlers.js"));
        registerIpcHandle = vi.fn();
        ensureFitParserStateIntegration = vi.fn().mockResolvedValue(undefined);
        logWithContext = vi.fn();
    });

    it("no-ops when registerIpcHandle is invalid", () => {
        registerFitFileHandlers({ registerIpcHandle: undefined, ensureFitParserStateIntegration, logWithContext });
        expect(registerIpcHandle).not.toHaveBeenCalled();
    });

    it("registers both fit handlers and decodes buffer", async () => {
        registerFitFileHandlers({
            registerIpcHandle,
            ensureFitParserStateIntegration,
            logWithContext,
            fitParserModule: { decodeFitFile: decodeFitFileMock },
        });

        expect(registerIpcHandle).toHaveBeenCalledTimes(2);
        const channels = registerIpcHandle.mock.calls.map((c) => c[0]);
        expect(channels).toEqual(["fit:parse", "fit:decode"]);

        const handler = registerIpcHandle.mock.calls[0][1];
        const arrayBuffer = Uint8Array.from([1, 2, 3]).buffer;

        const result = await handler({}, arrayBuffer);

        expect(ensureFitParserStateIntegration).toHaveBeenCalled();
        expect(decodeFitFileMock).toHaveBeenCalledWith(Buffer.from(arrayBuffer));
        expect(result).toEqual({ parsed: true });
        expect(logWithContext).not.toHaveBeenCalled();
    });

    it("logs and rethrows on decode failure", async () => {
        decodeFitFileMock.mockRejectedValueOnce(new Error("decode failed"));

        registerFitFileHandlers({
            registerIpcHandle,
            ensureFitParserStateIntegration,
            logWithContext,
            fitParserModule: { decodeFitFile: decodeFitFileMock },
        });
        const handler = registerIpcHandle.mock.calls[0][1];

        await expect(handler({}, new ArrayBuffer(0))).rejects.toThrow("decode failed");

        expect(logWithContext).toHaveBeenCalledWith("error", "Error in fit:parse:", {
            error: "decode failed",
        });
    });
});
