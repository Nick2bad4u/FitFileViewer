import type {
    MainStateChange,
    MainStateListenRequest,
    MainStateListenResponse,
    MainStateListener,
    MainStateUnlistenRequest,
    MainStateUnlistenResponse,
} from "../shared/ipc.js";

import type {
    CreateMainStateBridgeOptions,
    IpcEventListener,
    MainStateBridgeIpcRenderer,
    PreloadMainStateBridge,
} from "./preloadModuleTypes.js";

type AvailableMainStateBridgeIpcRenderer = {
    invoke: NonNullable<MainStateBridgeIpcRenderer["invoke"]>;
    on: NonNullable<MainStateBridgeIpcRenderer["on"]>;
};

export function createMainStateBridge({
    ipcRenderer,
    preloadLog,
    removeIpcListener,
}: CreateMainStateBridgeOptions): PreloadMainStateBridge {
    const callbacksByPath = new Map<string, Set<MainStateListener>>();
    let dispatcher: IpcEventListener | undefined;

    function getIpcRenderer(): AvailableMainStateBridgeIpcRenderer | undefined {
        if (
            ipcRenderer &&
            typeof ipcRenderer.invoke === "function" &&
            typeof ipcRenderer.on === "function"
        ) {
            return {
                invoke: ipcRenderer.invoke.bind(ipcRenderer),
                on: ipcRenderer.on.bind(ipcRenderer),
            };
        }

        preloadLog(
            "warn",
            "[preload.js] main-state bridge IPC renderer unavailable"
        );
        return undefined;
    }

    function isMainStateChange(value: unknown): value is MainStateChange {
        return (
            value !== null &&
            typeof value === "object" &&
            "path" in value &&
            typeof value.path === "string" &&
            value.path.length > 0 &&
            "value" in value
        );
    }

    function ensureDispatcher(): void {
        if (dispatcher) {
            return;
        }

        const bridgeIpcRenderer = getIpcRenderer();
        if (!bridgeIpcRenderer) {
            return;
        }

        dispatcher = (_event, change) => {
            if (!isMainStateChange(change)) {
                return;
            }

            const callbacks = callbacksByPath.get(change.path);
            if (callbacks === undefined || callbacks.size === 0) {
                return;
            }

            for (const listener of callbacks) {
                try {
                    listener(change);
                } catch (error) {
                    preloadLog(
                        "error",
                        "[preload.js] Error in main-state callback:",
                        error
                    );
                }
            }
        };
        bridgeIpcRenderer.on("main-state-change", dispatcher);
    }

    function removeDispatcherIfIdle(): void {
        if (callbacksByPath.size === 0 && dispatcher) {
            removeIpcListener("main-state-change", dispatcher);
            dispatcher = undefined;
        }
    }

    async function listenToMainState(
        path: MainStateListenRequest,
        callback: MainStateListener
    ): Promise<MainStateListenResponse> {
        const existing = callbacksByPath.get(path);
        if (existing) {
            existing.add(callback);
            ensureDispatcher();
            return true;
        }

        const bridgeIpcRenderer = getIpcRenderer();
        if (!bridgeIpcRenderer) {
            return false;
        }

        const accepted = await bridgeIpcRenderer.invoke(
            "main-state:listen",
            path
        );
        if (accepted !== true) {
            removeDispatcherIfIdle();
            return false;
        }

        const callbacks = new Set<MainStateListener>([callback]);
        callbacksByPath.set(path, callbacks);
        ensureDispatcher();

        return true;
    }

    async function unlistenFromMainState(
        path: MainStateUnlistenRequest,
        callback: MainStateListener
    ): Promise<MainStateUnlistenResponse> {
        const callbacks = callbacksByPath.get(path);
        if (!callbacks || !callbacks.has(callback)) {
            return false;
        }

        if (callbacks.size > 1) {
            callbacks.delete(callback);
            return true;
        }

        const bridgeIpcRenderer = getIpcRenderer();
        if (!bridgeIpcRenderer) {
            return false;
        }

        const accepted = await bridgeIpcRenderer.invoke(
            "main-state:unlisten",
            path
        );
        if (accepted !== true) {
            return false;
        }

        callbacksByPath.delete(path);
        removeDispatcherIfIdle();

        return true;
    }

    return {
        listenToMainState,
        unlistenFromMainState,
    };
}
