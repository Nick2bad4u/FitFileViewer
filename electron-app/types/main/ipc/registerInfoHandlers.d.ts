/**
 * Registers IPC handlers that expose platform and application metadata.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => any} options.appRef
 * @param {{ readFileSync?: Function }} options.fs
 * @param {{ join: Function }} options.path
 * @param {{ DEFAULT_THEME: string, SETTINGS_CONFIG_NAME: string }} options.CONSTANTS
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 */
export function registerInfoHandlers({ registerIpcHandle, appRef, fs, path, CONSTANTS, logWithContext }: {
    registerIpcHandle: (channel: string, handler: Function) => void;
    appRef: () => any;
    fs: {
        readFileSync?: Function;
    };
    path: {
        join: Function;
    };
    CONSTANTS: {
        DEFAULT_THEME: string;
        SETTINGS_CONFIG_NAME: string;
    };
    logWithContext: (level: "error" | "warn" | "info", message: string, context?: Record<string, any>) => void;
}): void;
//# sourceMappingURL=registerInfoHandlers.d.ts.map