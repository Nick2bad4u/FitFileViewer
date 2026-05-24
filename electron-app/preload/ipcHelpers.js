"use strict";
{
    function createPreloadIpcHelpers({
        ipcRenderer,
        preloadLog,
        validateCallback,
    }) {
        function createNoopUnsubscribe() {
            return noopUnsubscribe;
        }
        function createSafeEventHandler(channel, methodName, transform) {
            return (callback) => {
                if (!validateCallback(callback, methodName)) {
                    return createNoopUnsubscribe();
                }
                try {
                    const handler = (_event, ...args) => {
                        try {
                            if (transform) {
                                callback(transform(...args));
                                return;
                            }
                            callback(...args);
                        } catch (error) {
                            preloadLog(
                                "error",
                                `[preload.js] Error in ${methodName} callback:`,
                                error
                            );
                        }
                    };
                    ipcRenderer.on(channel, handler);
                    return () => {
                        try {
                            removeIpcListener(channel, handler);
                        } catch {
                            /* Ignore listener cleanup failures. */
                        }
                    };
                } catch (error) {
                    preloadLog(
                        "error",
                        `[preload.js] Error setting up ${methodName} event handler:`,
                        error
                    );
                    return createNoopUnsubscribe();
                }
            };
        }
        function createSafeInvokeHandler(channel, methodName) {
            return async (...args) => {
                try {
                    return await ipcRenderer.invoke(channel, ...args);
                } catch (error) {
                    preloadLog(
                        "error",
                        `[preload.js] Error in ${methodName}:`,
                        error
                    );
                    throw error;
                }
            };
        }
        function createSafeSendHandler(channel, methodName) {
            return (...args) => {
                try {
                    ipcRenderer.send(channel, ...args);
                } catch (error) {
                    preloadLog(
                        "error",
                        `[preload.js] Error in ${methodName}:`,
                        error
                    );
                }
            };
        }
        function noopUnsubscribe() {
            return undefined;
        }
        function removeIpcListener(channel, handler) {
            if (typeof ipcRenderer.removeListener === "function") {
                ipcRenderer.removeListener(channel, handler);
                return;
            }
            if (typeof ipcRenderer.off === "function") {
                ipcRenderer.off(channel, handler);
                return;
            }
            if (typeof ipcRenderer.removeAllListeners === "function") {
                ipcRenderer.removeAllListeners(channel);
            }
        }
        return {
            createNoopUnsubscribe,
            createSafeEventHandler,
            createSafeInvokeHandler,
            createSafeSendHandler,
            removeIpcListener,
        };
    }
    module.exports = {
        createPreloadIpcHelpers,
    };
}
