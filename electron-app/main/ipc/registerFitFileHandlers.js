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

    // Hard safety guard to prevent renderer-driven memory blowups.
    // Keep aligned with the file read size cap enforced by the main process.
    const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024;

    /**
     * @param {number} byteLength
     */
    const assertWithinFitLimit = (byteLength) => {
        if (!Number.isFinite(byteLength) || byteLength < 0) {
            throw new TypeError("Invalid FIT data: expected a finite byte length");
        }
        if (byteLength > MAX_FIT_FILE_BYTES) {
            throw new Error("File size exceeds 100MB limit");
        }
    };

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
            assertWithinFitLimit(value.byteLength);
            return Buffer.from(value);
        }
        if (value && typeof value === "object" && ArrayBuffer.isView(value) && value.buffer instanceof ArrayBuffer) {
            // @ts-ignore - ArrayBufferView typing
            assertWithinFitLimit(value.byteLength);
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
