{
    type FitDecodeResult = import("../../shared/fit").FitDecodeResult;
    type FitParserModule = Pick<
        import("../../types/fitParser").FitParserModule,
        "decodeFitFile"
    >;
    type FitParserFacade = {
        getFitParserModule: () => FitParserModule;
    };

    type FitFileIpcHandler = (
        event: unknown,
        arrayBuffer: unknown
    ) => Promise<FitDecodeResult>;

    type RegisterIpcHandle = (
        channel: string,
        handler: FitFileIpcHandler
    ) => void;

    type LogWithContext = (
        level: "error" | "info" | "warn",
        message: string,
        context?: Record<string, unknown>
    ) => void;

    interface RegisterFitFileHandlersOptions {
        ensureFitParserStateIntegration: () => Promise<void>;
        fitParserModule?: FitParserModule;
        logWithContext: LogWithContext;
        registerIpcHandle: RegisterIpcHandle;
    }

    // Hard safety guard to prevent renderer-driven memory blowups.
    // Keep aligned with the file read size cap enforced by the main process.
    const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024;

    const assertWithinFitLimit = (byteLength: number): void => {
        if (!Number.isFinite(byteLength) || byteLength < 0) {
            throw new TypeError(
                "Invalid FIT data: expected a finite byte length"
            );
        }
        if (byteLength > MAX_FIT_FILE_BYTES) {
            throw new Error("File size exceeds 100MB limit");
        }
    };

    /**
     * Normalizes IPC payloads into a Node Buffer.
     *
     * Electron IPC commonly transports ArrayBuffer from the renderer. We
     * defensively validate the input here so a compromised renderer cannot feed
     * unexpected types into the FIT decoder.
     */
    const toBuffer = (value: unknown): Buffer => {
        if (value instanceof ArrayBuffer) {
            assertWithinFitLimit(value.byteLength);
            return Buffer.from(value);
        }

        if (
            value &&
            typeof value === "object" &&
            ArrayBuffer.isView(value) &&
            value.buffer instanceof ArrayBuffer
        ) {
            assertWithinFitLimit(value.byteLength);
            return Buffer.from(
                value.buffer,
                value.byteOffset,
                value.byteLength
            );
        }

        throw new TypeError("Invalid FIT data: expected ArrayBuffer");
    };

    /**
     * Registers IPC handlers for FIT file parsing and decoding operations.
     */
    function registerFitFileHandlers({
        registerIpcHandle,
        ensureFitParserStateIntegration,
        logWithContext,
        fitParserModule,
    }: RegisterFitFileHandlersOptions): void {
        if (typeof registerIpcHandle !== "function") {
            return;
        }

        const registerHandler = (channel: string): void => {
            registerIpcHandle(channel, async (_event, arrayBuffer) => {
                try {
                    await ensureFitParserStateIntegration();
                    const buffer = toBuffer(arrayBuffer);
                    const { getFitParserModule } =
                        require("../runtime/fitParserFacade") as FitParserFacade;
                    const fitParser = fitParserModule ?? getFitParserModule();
                    return await fitParser.decodeFitFile(buffer);
                } catch (error) {
                    logWithContext?.("error", `Error in ${channel}:`, {
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown FIT IPC handler error",
                    });
                    throw error;
                }
            });
        };

        registerHandler("fit:parse");
        registerHandler("fit:decode");
    }

    module.exports = { registerFitFileHandlers };
}
