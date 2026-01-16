const { ipcMainRef } = require("../runtime/electronAccess");

/**
 * @typedef {{ ipcMain: unknown, handler: (...args: any[]) => any }} IpcHandleRegistryEntry
 */

/**
 * @typedef {{ ipcMain: unknown, listener: (...args: any[]) => any }} IpcListenerRegistryEntry
 */

/** @type {Map<string, IpcHandleRegistryEntry>} */
const IPC_HANDLE_REGISTRY = new Map();
/** @type {Map<string, IpcListenerRegistryEntry>} */
const IPC_EVENT_LISTENER_REGISTRY = new Map();

/**
 * Registers an IPC handler ensuring any previous handler is safely removed first.
 *
 * @template {(...args: any[]) => any} T
 * @param {string} channel - IPC channel name.
 * @param {T} handler - Handler to register.
 */
function registerIpcHandle(channel, handler) {
    const ipcMain = ipcMainRef();
    if (!ipcMain || typeof ipcMain.handle !== "function") {
        return;
    }

    const existing = IPC_HANDLE_REGISTRY.get(channel);
    const hasExistingForSameIpcMain = Boolean(existing && existing.ipcMain === ipcMain);

    if (hasExistingForSameIpcMain && existing.handler === handler) {
        return;
    }

    const canRemove = typeof ipcMain.removeHandler === "function";

    // In real Electron, removeHandler exists and we can safely replace handlers.
    // In many tests, ipcMain is a lightweight mock (often an EventEmitter) without removeHandler.
    // In that scenario, attempting to register a new handler for the same channel repeatedly
    // will leak listeners and can trigger MaxListenersExceededWarning.
    // If we're dealing with the *same* ipcMain instance and cannot remove handlers,
    // re-registering would leak/listen multiple times. If ipcMain has changed
    // (common in tests), we should allow registration.
    if (hasExistingForSameIpcMain && !canRemove) {
        return;
    }

    if (canRemove) {
        try {
            ipcMain.removeHandler(channel);
        } catch {
            /* Ignore handler removal errors */
        }
    }

    try {
        ipcMain.handle(channel, handler);
        IPC_HANDLE_REGISTRY.set(channel, { handler, ipcMain });
    } catch (error) {
        // If a strict ipcMain mock throws on duplicates, keep the previously registered handler.
        if (!hasExistingForSameIpcMain) {
            throw error;
        }
    }
}

/**
 * Registers an IPC event listener, guaranteeing previous listeners are removed to avoid duplicates.
 *
 * @template {(...args: any[]) => any} T
 * @param {string} channel - IPC channel to listen on.
 * @param {T} listener - Listener to register.
 */
function registerIpcListener(channel, listener) {
    const ipcMain = ipcMainRef();
    if (!ipcMain || typeof ipcMain.on !== "function") {
        return;
    }

    const existing = IPC_EVENT_LISTENER_REGISTRY.get(channel);
    const hasExistingForSameIpcMain = Boolean(existing && existing.ipcMain === ipcMain);

    if (hasExistingForSameIpcMain && existing.listener === listener) {
        return;
    }

    const canRemove = typeof ipcMain.removeListener === "function";

    // Similar to registerIpcHandle: if we cannot remove old listeners, be idempotent.
    if (hasExistingForSameIpcMain && !canRemove) {
        return;
    }

    if (hasExistingForSameIpcMain && canRemove) {
        try {
            ipcMain.removeListener(channel, existing.listener);
        } catch {
            /* Ignore listener removal errors */
        }
    }

    try {
        ipcMain.on(channel, listener);
        IPC_EVENT_LISTENER_REGISTRY.set(channel, { listener, ipcMain });
    } catch (error) {
        if (!hasExistingForSameIpcMain) {
            throw error;
        }
    }
}

/**
 * Clears all cached IPC registrations. Primarily used by tests when they need to reset state between
 * suites.
 */
function resetIpcRegistries() {
    const ipcMain = ipcMainRef();

    // Best-effort cleanup of actual ipcMain registrations.
    // This is primarily used by tests to avoid cross-suite pollution.
    if (ipcMain) {
        if (typeof ipcMain.removeHandler === "function") {
            for (const channel of IPC_HANDLE_REGISTRY.keys()) {
                try {
                    ipcMain.removeHandler(channel);
                } catch {
                    /* ignore */
                }
            }
        }

        if (typeof ipcMain.removeListener === "function") {
            for (const [channel, entry] of IPC_EVENT_LISTENER_REGISTRY.entries()) {
                try {
                    ipcMain.removeListener(channel, entry.listener);
                } catch {
                    /* ignore */
                }
            }
        }
    }

    IPC_HANDLE_REGISTRY.clear();
    IPC_EVENT_LISTENER_REGISTRY.clear();
}

module.exports = {
    registerIpcHandle,
    registerIpcListener,
    resetIpcRegistries,
};
