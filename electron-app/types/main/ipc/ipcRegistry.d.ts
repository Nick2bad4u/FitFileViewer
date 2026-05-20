export type IpcHandleRegistryEntry = {
    ipcMain: unknown;
    handler: (...args: unknown[]) => unknown;
};
export type IpcListenerRegistryEntry = {
    ipcMain: unknown;
    listener: (...args: unknown[]) => unknown;
};
/**
 * Registers an IPC handler ensuring the previous handler is safely removed
 * first.
 */
export function registerIpcHandle<T extends (...args: unknown[]) => unknown>(
    channel: string,
    handler: T
): void;
/**
 * Registers an IPC event listener, guaranteeing previous listeners are removed
 * to avoid duplicates.
 */
export function registerIpcListener<T extends (...args: unknown[]) => unknown>(
    channel: string,
    listener: T
): void;
/**
 * Clears all cached IPC registrations. Primarily used by tests when they need
 * to reset state between suites.
 */
export function resetIpcRegistries(): void;
