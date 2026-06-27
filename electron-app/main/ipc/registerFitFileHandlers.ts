import { getFitParserModule } from "../runtime/fitParserFacade.js";
import { normalizeFitIpcPayloadToBuffer } from "./fitIpcPayload.js";

type FitParserModule = Pick<
    import("../../shared/fitParser").FitParserModule,
    "decodeFitFile"
>;
type FitFileInvokeChannel = import("../../shared/ipc").FitFileInvokeChannel;
type FitFileResponsePayload = import("../../shared/ipc").FitFileResponsePayload;
type FitFileIpcHandler = (
    event: unknown,
    arrayBuffer: unknown
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

    const registerHandler = (channel: FitFileInvokeChannel): void => {
        registerIpcHandle(channel, async (_event, arrayBuffer) => {
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
