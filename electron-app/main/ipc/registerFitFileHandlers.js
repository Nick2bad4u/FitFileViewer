/**
 * Registers IPC handlers for FIT file parsing and decoding operations.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => Promise<void>} options.ensureFitParserStateIntegration
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 * @param {{ decodeFitFile: (buffer: Buffer) => Promise<any> }} [options.fitParserModule] Optional injected FIT parser for testing
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

    /**
     * Normalizes IPC payloads into a Node Buffer.
     *
     * Electron IPC commonly transports ArrayBuffer from the renderer. We defensively
     * validate the input here so a compromised renderer cannot feed unexpected types
     * into the FIT decoder.
     *
     * @param {unknown} value
     * @returns {Buffer}
     */
    const toBuffer = (value) => {
        if (value instanceof ArrayBuffer) {
            return Buffer.from(value);
        }
        if (value && typeof value === "object" && ArrayBuffer.isView(value) && value.buffer instanceof ArrayBuffer) {
            // @ts-ignore - ArrayBufferView typing
            return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
        }
        throw new TypeError("Invalid FIT data: expected ArrayBuffer");
    };

    const registerHandler = (channel) => {
        registerIpcHandle(channel, async (_event, arrayBuffer) => {
            try {
                await ensureFitParserStateIntegration();
                const buffer = toBuffer(arrayBuffer);
                const fitParser = fitParserModule ?? require("../../fitParser");
                return await fitParser.decodeFitFile(buffer);
            } catch (error) {
                logWithContext?.("error", `Error in ${channel}:`, {
                    error: /** @type {Error} */ (error)?.message,
                });
                throw error;
            }
        });
    };

    registerHandler("fit:parse");
    registerHandler("fit:decode");
}

module.exports = { registerFitFileHandlers };
