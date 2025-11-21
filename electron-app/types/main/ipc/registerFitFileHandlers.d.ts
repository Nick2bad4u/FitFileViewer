/**
 * Registers IPC handlers for FIT file parsing and decoding operations.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => Promise<void>} options.ensureFitParserStateIntegration
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 */
export function registerFitFileHandlers({
    registerIpcHandle,
    ensureFitParserStateIntegration,
    logWithContext,
}: {
    registerIpcHandle: (channel: string, handler: Function) => void;
    ensureFitParserStateIntegration: () => Promise<void>;
    logWithContext: (level: "error" | "warn" | "info", message: string, context?: Record<string, any>) => void;
}): void;
//# sourceMappingURL=registerFitFileHandlers.d.ts.map
