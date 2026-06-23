import type {
    MainStateChange,
    MainStateListenRequest,
    MainStateListenResponse,
    MainStateListener,
    MainStateUnlistenRequest,
    MainStateUnlistenResponse,
} from "../shared/ipc.js";

interface IpcRendererLike {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    on: (
        channel: string,
        listener: (event: object, change: MainStateChange) => void
    ) => void;
}

interface MainStateBridge {
    listenToMainState: (
        path: MainStateListenRequest,
        callback: MainStateListener
    ) => Promise<MainStateListenResponse>;
    unlistenFromMainState: (
        path: MainStateUnlistenRequest,
        callback: MainStateListener
    ) => Promise<MainStateUnlistenResponse>;
}

interface MainStateBridgeOptions {
    ipcRenderer: IpcRendererLike;
    preloadLog: PreloadLog;
    removeIpcListener: (
        channel: string,
        handler: (event: object, change: MainStateChange) => void
    ) => void;
}

type PreloadLog = (
    level: "error" | "info" | "warn",
    message: string,
    ...details: unknown[]
) => void;

export function createMainStateBridge({
    ipcRenderer,
    preloadLog,
    removeIpcListener,
}: MainStateBridgeOptions): MainStateBridge {
    const callbacksByPath = new Map<string, Set<MainStateListener>>();
    let dispatcher:
        | ((event: object, change: MainStateChange) => void)
        | undefined;

    function ensureDispatcher(): void {
        if (dispatcher) {
            return;
        }

        dispatcher = (_event, change) => {
            const path =
                typeof change.path === "string" && change.path.length > 0
                    ? change.path
                    : undefined;
            if (path === undefined) {
                return;
            }

            const callbacks = callbacksByPath.get(path);
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
        ipcRenderer.on("main-state-change", dispatcher);
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

        const accepted = await ipcRenderer.invoke("main-state:listen", path);
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

        const accepted = await ipcRenderer.invoke("main-state:unlisten", path);
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
