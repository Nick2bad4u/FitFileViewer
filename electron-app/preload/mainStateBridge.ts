{
    type MainStateCallback = (change: MainStateChange) => void;

    interface IpcRendererLike {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        on: (
            channel: string,
            listener: (event: object, change: MainStateChange) => void
        ) => void;
    }

    interface MainStateBridge {
        listenToMainState: (
            path: string,
            callback: MainStateCallback
        ) => Promise<boolean>;
        unlistenFromMainState: (
            path: string,
            callback: MainStateCallback
        ) => Promise<boolean>;
    }

    interface MainStateBridgeOptions {
        ipcRenderer: IpcRendererLike;
        preloadLog: PreloadLog;
        removeIpcListener: (
            channel: string,
            handler: (event: object, change: MainStateChange) => void
        ) => void;
    }

    interface MainStateChange {
        path?: unknown;
        [key: string]: unknown;
    }

    type PreloadLog = (
        level: "error" | "info" | "warn",
        message: string,
        ...details: unknown[]
    ) => void;

    function createMainStateBridge({
        ipcRenderer,
        preloadLog,
        removeIpcListener,
    }: MainStateBridgeOptions): MainStateBridge {
        const callbacksByPath = new Map<string, Set<MainStateCallback>>();
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

        async function listenToMainState(
            path: string,
            callback: MainStateCallback
        ): Promise<boolean> {
            ensureDispatcher();

            const existing = callbacksByPath.get(path);
            const callbacks = existing ?? new Set<MainStateCallback>();
            callbacks.add(callback);
            if (!existing) {
                callbacksByPath.set(path, callbacks);
                await ipcRenderer.invoke("main-state:listen", path);
            }

            return true;
        }

        async function unlistenFromMainState(
            path: string,
            callback: MainStateCallback
        ): Promise<boolean> {
            const callbacks = callbacksByPath.get(path);
            if (!callbacks) {
                return false;
            }

            callbacks.delete(callback);
            if (callbacks.size === 0) {
                callbacksByPath.delete(path);
                await ipcRenderer.invoke("main-state:unlisten", path);
            }

            if (callbacksByPath.size === 0 && dispatcher) {
                removeIpcListener("main-state-change", dispatcher);
                dispatcher = undefined;
            }

            return true;
        }

        return {
            listenToMainState,
            unlistenFromMainState,
        };
    }

    module.exports = {
        createMainStateBridge,
    };
}
