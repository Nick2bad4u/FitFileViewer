{
    type GenericInvokeChannel = import("../shared/ipc").GenericInvokeChannel;
    type GenericSendChannel = import("../shared/ipc").GenericSendChannel;
    type IpcEventCallback = import("../shared/ipc").IpcEventCallback;
    type IpcRequestPayload = import("../shared/ipc").IpcRequestPayload;
    type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;
    type RendererIpcEventChannel =
        import("../shared/ipc").RendererIpcEventChannel;
    type UpdateEventName = import("../shared/ipc").UpdateEventName;
    type InvokeRequestArgs<Channel extends GenericInvokeChannel> =
        import("../shared/ipc").InvokeRequestArgs<Channel>;
    type InvokeResponsePayloadForChannel<
        Channel extends GenericInvokeChannel,
    > = import("../shared/ipc").InvokeResponsePayloadForChannel<Channel>;

    type IpcListener = (event: object, ...args: IpcResponsePayload[]) => void;
    type PreloadLog = (
        level: "error" | "info" | "warn",
        message: string,
        ...details: unknown[]
    ) => void;
    type UnknownCallback = (...args: unknown[]) => unknown;

    interface IpcRendererLike {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        on: (channel: string, listener: IpcListener) => void;
        send: (channel: string, ...args: IpcRequestPayload[]) => void;
    }

    interface GenericIpcApi {
        invoke: <Channel extends GenericInvokeChannel>(
            channel: Channel,
            ...args: InvokeRequestArgs<Channel>
        ) => Promise<InvokeResponsePayloadForChannel<Channel>>;
        notifyFitFileLoaded: (filePath: null | string) => void;
        onIpc: (
            channel: RendererIpcEventChannel,
            callback: IpcEventCallback
        ) => (() => void) | undefined;
        onUpdateEvent: (
            eventName: UpdateEventName,
            callback: (...args: IpcResponsePayload[]) => unknown
        ) => (() => void) | undefined;
        send: (channel: GenericSendChannel, ...args: IpcRequestPayload[]) => void;
    }

    interface GenericIpcApiOptions {
        fitFileLoadedChannel: GenericSendChannel;
        ipcRenderer: IpcRendererLike;
        isAllowedGenericInvokeChannel: (
            channel: unknown
        ) => channel is GenericInvokeChannel;
        isAllowedGenericSendChannel: (
            channel: unknown
        ) => channel is GenericSendChannel;
        isAllowedRendererIpcEventChannel: (
            channel: unknown
        ) => channel is RendererIpcEventChannel;
        isAllowedUpdateEventName: (
            eventName: unknown
        ) => eventName is UpdateEventName;
        preloadLog: PreloadLog;
        removeIpcListener: (channel: string, handler: IpcListener) => void;
        shouldEnforceGenericIpcAllowlist: boolean;
        validateCallback: (
            callback: unknown,
            methodName: string
        ) => callback is UnknownCallback;
        validateChannelName: (
            value: unknown,
            paramName: string,
            methodName: string
        ) => value is string;
    }

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
    }: GenericIpcApiOptions): GenericIpcApi {
        async function invoke<Channel extends GenericInvokeChannel>(
            channel: Channel,
            ...args: InvokeRequestArgs<Channel>
        ): Promise<InvokeResponsePayloadForChannel<Channel>> {
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

        function notifyFitFileLoaded(filePath: null | string): void {
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

        function onIpc(
            channel: RendererIpcEventChannel,
            callback: IpcEventCallback
        ): (() => void) | undefined {
            const channelName = String(channel);
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
                    `[preload.js] Blocked onIpc() subscription to non-allowlisted channel: ${channelName}`
                );
                return undefined;
            }

            try {
                const wrapped: IpcListener = (_event, ...args) => {
                    try {
                        return callback(...args);
                    } catch (error) {
                        preloadLog(
                            "error",
                            `[preload.js] Error in onIpc(${channelName}) callback:`,
                            error
                        );
                        return undefined;
                    }
                };

                ipcRenderer.on(channel, wrapped);

                return () => {
                    try {
                        removeIpcListener(channel, wrapped);
                        return undefined;
                    } catch (error) {
                        preloadLog(
                            "error",
                            `[preload.js] Error removing onIpc(${channelName}) listener:`,
                            error
                        );
                        return undefined;
                    }
                };
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error setting up onIpc(${channelName}):`,
                    error
                );
                return undefined;
            }
        }

        function onUpdateEvent(
            eventName: UpdateEventName,
            callback: (...args: IpcResponsePayload[]) => unknown
        ): (() => void) | undefined {
            const eventLabel = String(eventName);
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
                    `[preload.js] Blocked onUpdateEvent() subscription to non-allowlisted event: ${eventLabel}`
                );
                return undefined;
            }

            try {
                const handler: IpcListener = (_event, ...args) => {
                    try {
                        return callback(...args);
                    } catch (error) {
                        preloadLog(
                            "error",
                            `[preload.js] Error in onUpdateEvent(${eventLabel}) callback:`,
                            error
                        );
                        return undefined;
                    }
                };

                ipcRenderer.on(eventName, handler);

                return () => {
                    try {
                        removeIpcListener(eventName, handler);
                        return undefined;
                    } catch {
                        /* Ignore listener cleanup failures. */
                        return undefined;
                    }
                };
            } catch (error) {
                preloadLog(
                    "error",
                    `[preload.js] Error setting up onUpdateEvent(${eventLabel}):`,
                    error
                );
                return undefined;
            }
        }

        function send(
            channel: GenericSendChannel,
            ...args: IpcRequestPayload[]
        ): void {
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

        async function invokeChannel<Channel extends GenericInvokeChannel>(
            channel: Channel,
            args: InvokeRequestArgs<Channel>
        ): Promise<InvokeResponsePayloadForChannel<Channel>> {
            try {
                return (await ipcRenderer.invoke(
                    channel,
                    ...args
                )) as InvokeResponsePayloadForChannel<Channel>;
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
