import type { OpenDialogOptions, OpenDialogReturnValue } from "electron";

export interface DialogApi {
    showOpenDialog: (
        options: OpenDialogOptions
    ) => Promise<OpenDialogReturnValue>;
}

export interface StatLike {
    isDirectory: () => boolean;
}

export interface DirentLike {
    name?: unknown;
    isDirectory?: () => boolean;
    isFile?: () => boolean;
}

export interface FsApi {
    promises?: {
        readdir?: (
            folder: string,
            options: { withFileTypes: true }
        ) => Promise<DirentLike[]>;
        stat?: (path: string) => Promise<StatLike>;
    };
}

export interface PathApi {
    isAbsolute: (path: string) => boolean;
    resolve: (...paths: string[]) => string;
    sep: string;
}

export interface BrowserConstants {
    SETTINGS_CONFIG_NAME: string;
}

export type BrowserConfValue = boolean | string | null;

export interface BrowserConfStore {
    get: (key: string, fallback?: BrowserConfValue) => BrowserConfValue;
    set: (key: string, value: boolean | string) => void;
}

export interface BrowserConfModule {
    Conf: new (options: { name: string }) => BrowserConfStore;
}

export type RegisterBrowserIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => unknown;

export type RegisterBrowserIpcHandle = (
    channel: string,
    handler: RegisterBrowserIpcHandler
) => void;

export type LogWithContext = (
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>
) => void;

export interface RegisterBrowserHandlersOptions {
    registerIpcHandle: RegisterBrowserIpcHandle;
    dialogRef: () => DialogApi | null | undefined;
    path: PathApi;
    fs: FsApi;
    CONSTANTS: BrowserConstants;
    logWithContext?: LogWithContext;
    confModule?: BrowserConfModule;
}

export function registerBrowserHandlers(
    options: RegisterBrowserHandlersOptions
): void;
