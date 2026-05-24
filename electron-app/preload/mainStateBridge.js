"use strict";
{
    function createMainStateBridge({
        ipcRenderer,
        preloadLog,
        removeIpcListener,
    }) {
        const callbacksByPath = new Map();
        let dispatcher;
        function ensureDispatcher() {
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
        async function listenToMainState(path, callback) {
            ensureDispatcher();
            const existing = callbacksByPath.get(path);
            const callbacks = existing ?? new Set();
            callbacks.add(callback);
            if (!existing) {
                callbacksByPath.set(path, callbacks);
                await ipcRenderer.invoke("main-state:listen", path);
            }
            return true;
        }
        async function unlistenFromMainState(path, callback) {
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
