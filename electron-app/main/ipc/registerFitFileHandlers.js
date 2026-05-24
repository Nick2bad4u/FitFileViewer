"use strict";
{
    const { normalizeFitIpcPayloadToBuffer } = require("./fitIpcPayload");
    /**
     * Registers IPC handlers for FIT file parsing and decoding operations.
     */
    function registerFitFileHandlers({
        registerIpcHandle,
        ensureFitParserStateIntegration,
        logWithContext,
        fitParserModule,
    }) {
        if (typeof registerIpcHandle !== "function") {
            return;
        }
        const registerHandler = (channel) => {
            registerIpcHandle(channel, async (_event, arrayBuffer) => {
                try {
                    await ensureFitParserStateIntegration();
                    const buffer = normalizeFitIpcPayloadToBuffer(arrayBuffer);
                    const {
                        getFitParserModule,
                    } = require("../runtime/fitParserFacade");
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
