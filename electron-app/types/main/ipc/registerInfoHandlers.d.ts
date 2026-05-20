export interface AppInfoProvider {
    getVersion?: () => string;
    getAppPath?: () => string;
}

export interface FileReader {
    readFileSync?: (path: string) => Buffer | string;
}

export interface PathJoiner {
    join: (...paths: string[]) => string;
}

export interface InfoConstants {
    DEFAULT_THEME: string;
    SETTINGS_CONFIG_NAME: string;
}

export interface ConfStore {
    get: (key: string, fallback: unknown) => unknown;
}

export type ConfConstructor = new (options: { name: string }) => ConfStore;

export interface ElectronConfModule {
    Conf: ConfConstructor;
}

export type InfoIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => Promise<unknown>;

export type RegisterInfoIpcHandle = (
    channel: string,
    handler: InfoIpcHandler
) => void;

export type LogWithContext = (
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>
) => void;

export interface RegisterInfoHandlersOptions {
    registerIpcHandle: RegisterInfoIpcHandle;
    appRef: () => AppInfoProvider | null | undefined;
    fs: FileReader;
    path: PathJoiner;
    CONSTANTS: InfoConstants;
    logWithContext?: LogWithContext;
    confModule?: ElectronConfModule;
}

/**
 * Registers IPC handlers that expose platform and application metadata.
 */
export function registerInfoHandlers(options: RegisterInfoHandlersOptions): void;
