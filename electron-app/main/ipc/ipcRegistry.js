const { ipcMainRef } = require("../runtime/electronAccess");

/** @type {Map<string, (...args: any[]) => any>} */
const IPC_HANDLE_REGISTRY = new Map();
/** @type {Map<string, (...args: any[]) => any>} */
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
    if (existing === handler) {
        return;
    }

    if (typeof ipcMain.removeHandler === "function") {
        try {
            ipcMain.removeHandler(channel);
        } catch {
            /* Ignore handler removal errors */
        }
    }

    ipcMain.handle(channel, handler);
    IPC_HANDLE_REGISTRY.set(channel, handler);
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
    if (existing && typeof ipcMain.removeListener === "function") {
        try {
            ipcMain.removeListener(channel, existing);
        } catch {
            /* Ignore listener removal errors */
        }
    }

    ipcMain.on(channel, listener);
    IPC_EVENT_LISTENER_REGISTRY.set(channel, listener);
}

/**
 * Clears all cached IPC registrations. Primarily used by tests when they need to reset state between
 * suites.
 */
function resetIpcRegistries() {
    IPC_HANDLE_REGISTRY.clear();
    IPC_EVENT_LISTENER_REGISTRY.clear();
}

module.exports = {
    registerIpcHandle,
    registerIpcListener,
    resetIpcRegistries,
};
