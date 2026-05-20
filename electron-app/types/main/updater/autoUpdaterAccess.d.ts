export interface AutoUpdaterLike {
    autoDownload?: boolean;
    checkForUpdatesAndNotify?: () => Promise<unknown> | unknown;
    feedURL?: unknown;
    logger?: unknown;
    on?: (event: string, listener: (...args: unknown[]) => void) => unknown;
}

export function resolveAutoUpdaterAsync(): Promise<AutoUpdaterLike | null>;
/**
 * Resolves electron-updater synchronously supporting both CJS and ESM default
 * exports.
 */
export function resolveAutoUpdaterSync(): AutoUpdaterLike | null;
