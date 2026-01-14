/**
 * Registers IPC handlers that expose platform and application metadata.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => any} options.appRef
 * @param {{ readFileSync?: Function }} options.fs
 * @param {{ join: Function }} options.path
 * @param {{ DEFAULT_THEME: string, SETTINGS_CONFIG_NAME: string }} options.CONSTANTS
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 * @param {{ Conf: new (...args: any[]) => { get: (key: string, fallback?: any) => any } }} [options.confModule] Optional injected electron-conf module for testing
 */
export function registerInfoHandlers({
    registerIpcHandle,
    appRef,
    fs,
    path,
    CONSTANTS,
    logWithContext,
    confModule,
}: {
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
    confModule?:
        | {
              Conf: new (...args: any[]) => {
                  get: (key: string, fallback?: any) => any;
              };
          }
        | undefined;
}): void;
//# sourceMappingURL=registerInfoHandlers.d.ts.map
