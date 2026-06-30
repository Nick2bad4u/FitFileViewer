import { getFitParserModule } from "../runtime/fitParserFacade.js";
import { normalizeFitIpcPayloadToBuffer } from "./fitIpcPayload.js";

type FitParserModule = Pick<
    import("../../shared/fitParser").FitParserModule,
    "decodeFitFile"
>;
type FitFileInvokeChannel = import("../../shared/ipc").FitFileInvokeChannel;
type InvokeRequestArgs<Channel extends FitFileInvokeChannel> =
    import("../../shared/ipc").InvokeRequestArgs<Channel>;
type InvokeResponsePayloadForChannel<Channel extends FitFileInvokeChannel> =
    import("../../shared/ipc").InvokeResponsePayloadForChannel<Channel>;

type FitFileIpcHandler = (
    event: unknown,
    ...args: InvokeRequestArgs<FitFileInvokeChannel>
) => Promise<InvokeResponsePayloadForChannel<FitFileInvokeChannel>>;

type FitFileIpcCallback = (event: unknown, ...args: unknown[]) => unknown;

type RegisterIpcHandle = (
    channel: FitFileInvokeChannel,
    handler: FitFileIpcCallback
) => void;

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

interface RegisterFitFileHandlersOptions {
    ensureFitParserStateIntegration: () => Promise<unknown>;
    fitParserModule?: FitParserModule;
    logWithContext: LogWithContext;
    registerIpcHandle: RegisterIpcHandle;
}

/**
 * Registers IPC handlers for FIT file parsing and decoding operations.
 */
export function registerFitFileHandlers({
    registerIpcHandle,
    ensureFitParserStateIntegration,
    logWithContext,
    fitParserModule,
}: RegisterFitFileHandlersOptions): void {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    const registerFitFileIpcHandle = (
        channel: FitFileInvokeChannel,
        handler: FitFileIpcHandler
    ): void => {
        registerIpcHandle(channel, handler as FitFileIpcCallback);
    };

    const registerHandler = (channel: FitFileInvokeChannel): void => {
        registerFitFileIpcHandle(channel, async (_event, arrayBuffer) => {
            try {
                await ensureFitParserStateIntegration();
                const buffer = normalizeFitIpcPayloadToBuffer(arrayBuffer);
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
