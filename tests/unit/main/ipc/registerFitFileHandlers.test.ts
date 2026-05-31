// @vitest-environment node
import { Buffer } from "node:buffer";
import type { FitDecodeResult } from "../../../../electron-app/shared/fit";
import type { FitParserModule } from "../../../../electron-app/shared/fitParser";
import type {
    FitFileInvokeChannel,
    FitFileResponsePayload,
} from "../../../../electron-app/shared/ipc";
import type { Mock } from "vitest";
import { describe, expect, it, vi } from "vitest";

type FitFileIpcHandler = (
    event: unknown,
    arrayBuffer: ArrayBuffer
) => Promise<FitFileResponsePayload>;

type RegisterIpcHandle = (
    channel: FitFileInvokeChannel,
    handler: FitFileIpcHandler
) => void;

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

type RegisterFitFileHandlersOptions = {
    ensureFitParserStateIntegration: () => Promise<void>;
    fitParserModule?: Pick<FitParserModule, "decodeFitFile">;
    logWithContext: LogWithContext;
    registerIpcHandle: RegisterIpcHandle | unknown;
};

type RegisterFitFileHandlersModule = {
    registerFitFileHandlers: (options: RegisterFitFileHandlersOptions) => void;
};

type FitFileHandlerTestContext = {
    decodeFitFileMock: Mock<FitParserModule["decodeFitFile"]>;
    decodedResult: FitDecodeResult;
    ensureFitParserStateIntegration: Mock<() => Promise<void>>;
    getFirstRegisteredHandler: () => FitFileIpcHandler;
    logWithContext: Mock<LogWithContext>;
    registerFitFileHandlers: RegisterFitFileHandlersModule["registerFitFileHandlers"];
    registerIpcHandle: Mock<RegisterIpcHandle>;
};

async function createFitFileHandlerTestContext(): Promise<FitFileHandlerTestContext> {
    vi.resetModules();

    const { registerFitFileHandlers } =
        (await import("../../../../electron-app/main/ipc/registerFitFileHandlers.js")) as RegisterFitFileHandlersModule;
    const decodedResult: FitDecodeResult = { record: [] };
    const decodeFitFileMock = vi
        .fn<FitParserModule["decodeFitFile"]>()
        .mockResolvedValue(decodedResult);
    const ensureFitParserStateIntegration = vi
        .fn<() => Promise<void>>()
        .mockResolvedValue(undefined);
    const logWithContext = vi.fn<LogWithContext>();
    const registerIpcHandle = vi.fn<RegisterIpcHandle>();

    const getFirstRegisteredHandler = (): FitFileIpcHandler => {
        const firstCall = registerIpcHandle.mock.calls[0];
        if (!firstCall) {
            throw new Error("Expected a FIT IPC handler to be registered");
        }

        return firstCall[1];
    };

    return {
        decodeFitFileMock,
        decodedResult,
        ensureFitParserStateIntegration,
        getFirstRegisteredHandler,
        logWithContext,
        registerFitFileHandlers,
        registerIpcHandle,
    };
}

describe("registerFitFileHandlers", () => {
    it("no-ops when registerIpcHandle is invalid", async () => {
        expect.assertions(3);

        const {
            ensureFitParserStateIntegration,
            logWithContext,
            registerFitFileHandlers,
            registerIpcHandle,
        } = await createFitFileHandlerTestContext();

        expect(() => {
            registerFitFileHandlers({
                ensureFitParserStateIntegration,
                logWithContext,
                registerIpcHandle: undefined,
            });
        }).not.toThrow();

        expect(registerIpcHandle).not.toHaveBeenCalled();
        expect(ensureFitParserStateIntegration).not.toHaveBeenCalled();
    });

    it("registers both fit handlers and decodes buffer payloads", async () => {
        expect.assertions(5);

        const {
            decodeFitFileMock,
            decodedResult,
            ensureFitParserStateIntegration,
            getFirstRegisteredHandler,
            logWithContext,
            registerFitFileHandlers,
            registerIpcHandle,
        } = await createFitFileHandlerTestContext();
        const arrayBuffer = Uint8Array.from([
            1,
            2,
            3,
        ]).buffer;

        registerFitFileHandlers({
            ensureFitParserStateIntegration,
            fitParserModule: { decodeFitFile: decodeFitFileMock },
            logWithContext,
            registerIpcHandle,
        });

        expect(registerIpcHandle).toHaveBeenCalledTimes(2);
        expect(
            registerIpcHandle.mock.calls.map(([channel]) => channel)
        ).toStrictEqual(["fit:parse", "fit:decode"]);

        const result = await getFirstRegisteredHandler()({}, arrayBuffer);

        expect(ensureFitParserStateIntegration).toHaveBeenCalledOnce();
        expect(decodeFitFileMock).toHaveBeenCalledWith(
            Buffer.from(arrayBuffer)
        );
        expect(result).toStrictEqual(decodedResult);
    });

    it("logs and rethrows on decode failure", async () => {
        expect.assertions(2);

        const {
            decodeFitFileMock,
            ensureFitParserStateIntegration,
            getFirstRegisteredHandler,
            logWithContext,
            registerFitFileHandlers,
            registerIpcHandle,
        } = await createFitFileHandlerTestContext();
        decodeFitFileMock.mockRejectedValueOnce(new Error("decode failed"));

        registerFitFileHandlers({
            ensureFitParserStateIntegration,
            fitParserModule: { decodeFitFile: decodeFitFileMock },
            logWithContext,
            registerIpcHandle,
        });

        await expect(
            getFirstRegisteredHandler()({}, new ArrayBuffer(0))
        ).rejects.toThrow("decode failed");

        expect(logWithContext).toHaveBeenCalledWith(
            "error",
            "Error in fit:parse:",
            {
                error: "decode failed",
            }
        );
    });

    it("rejects non-ArrayBuffer payloads before decoding", async () => {
        expect.assertions(2);

        const {
            decodeFitFileMock,
            ensureFitParserStateIntegration,
            getFirstRegisteredHandler,
            logWithContext,
            registerFitFileHandlers,
            registerIpcHandle,
        } = await createFitFileHandlerTestContext();

        registerFitFileHandlers({
            ensureFitParserStateIntegration,
            fitParserModule: { decodeFitFile: decodeFitFileMock },
            logWithContext,
            registerIpcHandle,
        });

        await expect(
            getFirstRegisteredHandler()(
                {},
                "not-a-buffer" as unknown as ArrayBuffer
            )
        ).rejects.toThrow("Invalid FIT data: expected ArrayBuffer");
        expect(decodeFitFileMock).not.toHaveBeenCalled();
    });
});
