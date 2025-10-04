export function registerInfoHandlers(options: any): void;
export function wireInfoHandlers(options?: {}): void;
/**
 * Registers IPC handlers that expose platform and application metadata.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => any} options.appRef
 * @param {{ readFileSync?: Function }} options.fs
 * @param {{ join: Function }} options.path
 * @param {{ DEFAULT_THEME: string, SETTINGS_CONFIG_NAME: string }} options.CONSTANTS
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 * @param {() => { Conf: new (options: { name: string }) => { get: (key: string, fallback: any) => any } }} [options.loadConf]
 */
export function createInfoHandlers({ appRef, fs, path, CONSTANTS, logWithContext, loadConf }: {
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
    loadConf?: (() => {
        Conf: new (options: {
            name: string;
        }) => {
            get: (key: string, fallback: any) => any;
        };
    }) | undefined;
}): {
    getAppVersion: () => Promise<any>;
    getChromeVersion: () => Promise<string>;
    getElectronVersion: () => Promise<string>;
    getLicenseInfo: () => Promise<any>;
    getNodeVersion: () => Promise<string>;
    getPlatformInfo: () => Promise<{
        arch: NodeJS.Architecture;
        platform: NodeJS.Platform;
    }>;
    'map-tab:get': () => Promise<any>;
    'theme:get': () => Promise<any>;
};
//# sourceMappingURL=registerInfoHandlers.d.ts.map