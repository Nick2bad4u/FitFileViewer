"use strict";
{
    function createGenericIpcApi({
        fitFileLoadedChannel,
        ipcRenderer,
        isAllowedGenericInvokeChannel,
        isAllowedGenericSendChannel,
        isAllowedRendererIpcEventChannel,
        isAllowedUpdateEventName,
        preloadLog,
        removeIpcListener,
        shouldEnforceGenericIpcAllowlist,
        validateCallback,
        validateChannelName,
    }) {
        async function invoke(channel, ...args) {
            if (!validateChannelName(channel, "channel", "invoke")) {
                throw new Error("Invalid channel for invoke");
            }
            if (
                shouldEnforceGenericIpcAllowlist &&
                !isAllowedGenericInvokeChannel(channel)
            ) {
                throw new Error("Channel not allowed for invoke");
            }
            return await invokeChannel(channel, args);
        }
        function notifyFitFileLoaded(filePath) {
            if (filePath !== null && typeof filePath !== "string") {
                preloadLog(
                    "error",
                    "[preload.js] notifyFitFileLoaded: filePath must be a string or null"
                );
                return;
            }
            const normalizedPath =
                typeof filePath === "string" && filePath.trim().length > 0
                    ? filePath
                    : null;
            try {
                ipcRenderer.send(fitFileLoadedChannel, normalizedPath);
            } catch (error) {
                preloadLog(
                    "error",
                    "[preload.js] Error in notifyFitFileLoaded:",
                    error
                );
            }
        }
        function onIpc(channel, callback) {
            if (!validateChannelName(channel, "channel", "onIpc")) {
                return undefined;
            }
            if (!validateCallback(callback, "onIpc")) {
                return undefined;
            }
            if (
                shouldEnforceGenericIpcAllowlist &&
                !isAllowedRendererIpcEventChannel(channel)
            ) {
                preloadLog(
                    "warn",
                    `[preload.js] Blocked onIpc() subscription to non-allowlisted channel: ${channel}`
                );
                return undefined;
            }
            try {
                const wrapped = (event, ...args) => {
                    try {
                        callback(event, ...args);
                    } catch (error) {
                        preloadLog(
                            "error",
                            `[preload.js] Error in onIpc(${channel}) callback:`,
                            error
                        );
                    }
                };
                ipcRenderer.on(channel, wrapped);
                return () => {
                    try {
                        removeIpcListener(channel, wrapped);
                    } catch (error) {
                        preloadLog(
                            "error",
                            `[preload.js] Error removing onIpc(${channel}) listener:`,
                            error
                        );
                    }
                };
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error setting up onIpc(${channel}):`,
                    error
                );
                return undefined;
            }
        }
        function onUpdateEvent(eventName, callback) {
            if (!validateCallback(callback, "onUpdateEvent")) {
                return undefined;
            }
            if (!validateChannelName(eventName, "eventName", "onUpdateEvent")) {
                return undefined;
            }
            if (
                shouldEnforceGenericIpcAllowlist &&
                !isAllowedUpdateEventName(eventName)
            ) {
                preloadLog(
                    "warn",
                    `[preload.js] Blocked onUpdateEvent() subscription to non-allowlisted event: ${eventName}`
                );
                return undefined;
            }
            try {
                const handler = (_event, ...args) => {
                    try {
                        callback(...args);
                    } catch (error) {
                        preloadLog(
                            "error",
                            `[preload.js] Error in onUpdateEvent(${eventName}) callback:`,
                            error
                        );
                    }
                };
                ipcRenderer.on(eventName, handler);
                return () => {
                    try {
                        removeIpcListener(eventName, handler);
                    } catch {
                        /* Ignore listener cleanup failures. */
                    }
                };
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error setting up onUpdateEvent(${eventName}):`,
                    error
                );
                return undefined;
            }
        }
        function send(channel, ...args) {
            if (!validateChannelName(channel, "channel", "send")) {
                return;
            }
            if (
                shouldEnforceGenericIpcAllowlist &&
                !isAllowedGenericSendChannel(channel)
            ) {
                preloadLog(
                    "warn",
                    `[preload.js] Blocked send() to non-allowlisted channel: ${String(channel)}`
                );
                return;
            }
            try {
                ipcRenderer.send(channel, ...args);
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error in send(${channel}):`,
                    error
                );
            }
        }
        async function invokeChannel(channel, args) {
            try {
                return await ipcRenderer.invoke(channel, ...args);
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error in invoke(${channel}):`,
                    error
                );
                throw error;
            }
        }
        return {
            invoke,
            notifyFitFileLoaded,
            onIpc,
            onUpdateEvent,
            send,
        };
    }
    module.exports = {
        createGenericIpcApi,
    };
}
