export type IpcHandleRegistryEntry = {
    ipcMain: unknown;
    handler: (...args: any[]) => any;
};
export type IpcListenerRegistryEntry = {
    ipcMain: unknown;
    listener: (...args: any[]) => any;
};
/**
 * Registers an IPC handler ensuring any previous handler is safely removed first.
 *
 * @template {(...args: any[]) => any} T
 * @param {string} channel - IPC channel name.
 * @param {T} handler - Handler to register.
 */
export function registerIpcHandle<T extends (...args: any[]) => any>(channel: string, handler: T): void;
/**
 * Registers an IPC event listener, guaranteeing previous listeners are removed to avoid duplicates.
 *
 * @template {(...args: any[]) => any} T
 * @param {string} channel - IPC channel to listen on.
 * @param {T} listener - Listener to register.
 */
export function registerIpcListener<T extends (...args: any[]) => any>(channel: string, listener: T): void;
/**
 * Clears all cached IPC registrations. Primarily used by tests when they need to reset state between
 * suites.
 */
export function resetIpcRegistries(): void;
//# sourceMappingURL=ipcRegistry.d.ts.map
