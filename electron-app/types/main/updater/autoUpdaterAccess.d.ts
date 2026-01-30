export function resolveAutoUpdaterAsync(): Promise<any>;
/**
 * Resolves electron-updater synchronously supporting both CJS and ESM default
 * exports.
 *
 * @returns {any} AutoUpdater instance or null when unavailable.
 */
export function resolveAutoUpdaterSync(): any;
