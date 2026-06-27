import { assertIpcSenderAllowed } from "../security/ipcSenderPolicy.js";
import { ipcMainRef as electronIpcMainRef } from "../runtime/electronAccess.js";

type GenericInvokeChannel = import("../../shared/ipc").GenericInvokeChannel;
type MainProcessIpcEventChannel =
    import("../../shared/ipc").MainProcessIpcEventChannel;
type IpcCallback = (...args: unknown[]) => unknown;

interface IpcMainLike {
    handle?: (channel: GenericInvokeChannel, handler: IpcCallback) => void;
    on?: (channel: MainProcessIpcEventChannel, listener: IpcCallback) => void;
    removeHandler?: (channel: GenericInvokeChannel) => void;
    removeListener?: (
        channel: MainProcessIpcEventChannel,
        listener: IpcCallback
    ) => void;
}

interface IpcHandleRegistryEntry {
    handler: IpcCallback;
    ipcMain: IpcMainLike;
}

interface IpcListenerRegistryEntry {
    ipcMain: IpcMainLike;
    listener: IpcCallback;
    registeredListener: IpcCallback;
}

const ipcMainRef = electronIpcMainRef as () => IpcMainLike | undefined;

const IPC_HANDLE_REGISTRY = new Map<
    GenericInvokeChannel,
    IpcHandleRegistryEntry
>();
const IPC_EVENT_LISTENER_REGISTRY = new Map<
    MainProcessIpcEventChannel,
    IpcListenerRegistryEntry
>();

/**
 * Registers an IPC handler ensuring the previous handler is safely removed
 * first.
 *
 * @throws Re-throws registration errors for new ipcMain instances.
 */
export function registerIpcHandle(
    channel: GenericInvokeChannel,
    handler: IpcCallback
): void {
    const ipcMain = ipcMainRef();
    if (!ipcMain || typeof ipcMain.handle !== "function") {
        return;
    }

    const existing = IPC_HANDLE_REGISTRY.get(channel);
    const hasExistingForSameIpcMain = Boolean(
        existing && existing.ipcMain === ipcMain
    );

    if (hasExistingForSameIpcMain && existing?.handler === handler) {
        return;
    }

    const canRemove = typeof ipcMain.removeHandler === "function";

    // In real Electron, removeHandler exists and we can safely replace
    // handlers. Some tests use lightweight ipcMain mocks without
    // removeHandler, where duplicate registration would leak listeners.
    if (hasExistingForSameIpcMain && !canRemove) {
        return;
    }

    const removedExistingForSameIpcMain =
        hasExistingForSameIpcMain && canRemove;

    if (canRemove) {
        try {
            ipcMain.removeHandler?.(channel);
        } catch {
            /* Ignore handler removal errors */
        }
    }

    const registeredHandler: IpcCallback = (event, ...args) => {
        assertIpcSenderAllowed(event);
        return handler(event, ...args);
    };

    try {
        ipcMain.handle(channel, registeredHandler);
        IPC_HANDLE_REGISTRY.set(channel, { handler, ipcMain });
    } catch (error) {
        if (removedExistingForSameIpcMain) {
            IPC_HANDLE_REGISTRY.delete(channel);
            throw error;
        }

        // Strict ipcMain mocks can throw on duplicates. Keep the previously
        // registered handler when the same ipcMain already had one.
        if (!hasExistingForSameIpcMain) {
            throw error;
        }
    }
}

/**
 * Registers an IPC event listener, guaranteeing previous listeners are removed
 * to avoid duplicates.
 *
 * @throws Re-throws listener registration errors for new ipcMain instances.
 */
export function registerIpcListener(
    channel: MainProcessIpcEventChannel,
    listener: IpcCallback
): void {
    const ipcMain = ipcMainRef();
    if (!ipcMain || typeof ipcMain.on !== "function") {
        return;
    }

    const existing = IPC_EVENT_LISTENER_REGISTRY.get(channel);
    const hasExistingForSameIpcMain = Boolean(
        existing && existing.ipcMain === ipcMain
    );

    if (hasExistingForSameIpcMain && existing?.listener === listener) {
        return;
    }

    const canRemove = typeof ipcMain.removeListener === "function";

    // Similar to registerIpcHandle: if we cannot remove old listeners, be
    // idempotent.
    if (hasExistingForSameIpcMain && !canRemove) {
        return;
    }

    const removedExistingForSameIpcMain =
        hasExistingForSameIpcMain && canRemove && Boolean(existing);

    if (removedExistingForSameIpcMain && existing) {
        try {
            ipcMain.removeListener?.(channel, existing.registeredListener);
        } catch {
            /* Ignore listener removal errors */
        }
    }

    const registeredListener: IpcCallback = (event, ...args) => {
        assertIpcSenderAllowed(event);
        return listener(event, ...args);
    };

    try {
        ipcMain.on(channel, registeredListener);
        IPC_EVENT_LISTENER_REGISTRY.set(channel, {
            ipcMain,
            listener,
            registeredListener,
        });
    } catch (error) {
        if (removedExistingForSameIpcMain) {
            IPC_EVENT_LISTENER_REGISTRY.delete(channel);
            throw error;
        }

        if (!hasExistingForSameIpcMain) {
            throw error;
        }
    }
}

/**
 * Clears all cached IPC registrations. Primarily used by tests when they need
 * to reset state between suites.
 */
export function resetIpcRegistries(): void {
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
            for (const [
                channel,
                entry,
            ] of IPC_EVENT_LISTENER_REGISTRY.entries()) {
                try {
                    ipcMain.removeListener(channel, entry.registeredListener);
                } catch {
                    /* ignore */
                }
            }
        }
    }

    IPC_HANDLE_REGISTRY.clear();
    IPC_EVENT_LISTENER_REGISTRY.clear();
}
