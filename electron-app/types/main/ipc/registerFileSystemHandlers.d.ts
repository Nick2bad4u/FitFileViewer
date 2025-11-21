/**
 * Registers IPC handlers for filesystem operations.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {{ readFile?: Function }} options.fs
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 */
export function registerFileSystemHandlers({
    registerIpcHandle,
    fs,
    logWithContext,
}: {
    registerIpcHandle: (channel: string, handler: Function) => void;
    fs: {
        readFile?: Function;
    };
    logWithContext: (level: "error" | "warn" | "info", message: string, context?: Record<string, any>) => void;
}): void;
//# sourceMappingURL=registerFileSystemHandlers.d.ts.map
