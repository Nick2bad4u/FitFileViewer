/**
 * Registers IPC handlers for FIT file parsing and decoding operations.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => Promise<void>} options.ensureFitParserStateIntegration
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 * @param {() => { decodeFitFile: (buffer: Buffer) => Promise<any> }} [options.loadFitParser]
 */
function registerFitFileHandlers(options) {
    wireFitFileHandlers(options ?? {});
}

function wireFitFileHandlers(options = {}) {
    const {
        registerIpcHandle,
        ensureFitParserStateIntegration,
        logWithContext,
        loadFitParser,
    } = options;
    if (typeof registerIpcHandle !== 'function') {
        return;
    }

    const resolveFitParser = loadFitParser ?? (() => require('../../fitParser'));

    const registerHandler = (channel) => {
        registerIpcHandle(channel, async (_event, arrayBuffer) => {
            try {
                await ensureFitParserStateIntegration();
                const buffer = Buffer.from(arrayBuffer);
                const fitParser = resolveFitParser();
                return await fitParser.decodeFitFile(buffer);
            } catch (error) {
                logWithContext?.('error', `Error in ${channel}:`, {
                    error: /** @type {Error} */ (error)?.message,
                });
                throw error;
            }
        });
    };

    registerHandler('fit:parse');
    registerHandler('fit:decode');
}

module.exports = { registerFitFileHandlers, wireFitFileHandlers };
