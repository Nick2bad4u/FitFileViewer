{
    type FitParserModule = Pick<
        import("../../shared/fitParser").FitParserModule,
        "decodeFitFile"
    >;
    type FitParserFacade = {
        getFitParserModule: () => FitParserModule;
    };
    type FitFileInvokeChannel = import("../../shared/ipc").FitFileInvokeChannel;
    type FitFileRequestPayload =
        import("../../shared/ipc").FitFileRequestPayload;
    type FitFileResponsePayload =
        import("../../shared/ipc").FitFileResponsePayload;
    type NormalizeFitIpcPayloadToBuffer = (
        value: unknown
    ) => import("node:buffer").Buffer;

    const { normalizeFitIpcPayloadToBuffer } = require("./fitIpcPayload") as {
        normalizeFitIpcPayloadToBuffer: NormalizeFitIpcPayloadToBuffer;
    };

    type FitFileIpcHandler = (
        event: unknown,
        arrayBuffer: FitFileRequestPayload
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

    interface RegisterFitFileHandlersOptions {
        ensureFitParserStateIntegration: () => Promise<void>;
        fitParserModule?: FitParserModule;
        logWithContext: LogWithContext;
        registerIpcHandle: RegisterIpcHandle;
    }

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

        const registerHandler = (channel: FitFileInvokeChannel): void => {
            registerIpcHandle(channel, async (_event, arrayBuffer) => {
                try {
                    await ensureFitParserStateIntegration();
                    const buffer = normalizeFitIpcPayloadToBuffer(arrayBuffer);
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
