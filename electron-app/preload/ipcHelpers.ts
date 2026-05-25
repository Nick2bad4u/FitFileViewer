{
    type GenericInvokeChannel = import("../shared/ipc").GenericInvokeChannel;
    type GenericSendChannel = import("../shared/ipc").GenericSendChannel;
    type IpcRequestPayload = import("../shared/ipc").IpcRequestPayload;
    type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;
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
        off?: (channel: string, listener: IpcListener) => void;
        on: (channel: string, listener: IpcListener) => void;
        removeAllListeners?: (channel: string) => void;
        removeListener?: (channel: string, listener: IpcListener) => void;
        send: (channel: string, ...args: unknown[]) => void;
    }

    interface PreloadIpcHelpers {
        createNoopUnsubscribe: () => () => void;
        createSafeEventHandler: (
            channel: string,
            methodName: string,
            transform?: (...args: IpcResponsePayload[]) => IpcResponsePayload | null
        ) => (callback: UnknownCallback) => () => void;
        createSafeInvokeHandler: <Channel extends GenericInvokeChannel>(
            channel: Channel,
            methodName: string
        ) => (
            ...args: InvokeRequestArgs<Channel>
        ) => Promise<InvokeResponsePayloadForChannel<Channel>>;
        createSafeSendHandler: <Channel extends GenericSendChannel>(
            channel: Channel,
            methodName: string
        ) => (...args: IpcRequestPayload[]) => void;
        removeIpcListener: (channel: string, handler: IpcListener) => void;
    }

    interface PreloadIpcHelpersOptions {
        ipcRenderer: IpcRendererLike;
        preloadLog: PreloadLog;
        validateCallback: (
            callback: unknown,
            methodName: string
        ) => callback is UnknownCallback;
    }

    function createPreloadIpcHelpers({
        ipcRenderer,
        preloadLog,
        validateCallback,
    }: PreloadIpcHelpersOptions): PreloadIpcHelpers {
        function isMissingFileError(error: unknown): boolean {
            const message = error instanceof Error ? error.message : String(error);
            return /\bENOENT\b/u.test(message);
        }

        function shouldSuppressInvokeErrorLog(
            methodName: string,
            error: unknown
        ): boolean {
            return methodName === "readFile" && isMissingFileError(error);
        }

        function createNoopUnsubscribe(): () => void {
            return noopUnsubscribe;
        }

        function createSafeEventHandler(
            channel: string,
            methodName: string,
            transform?: (...args: IpcResponsePayload[]) => IpcResponsePayload | null
        ): (callback: UnknownCallback) => () => void {
            return (callback) => {
                if (!validateCallback(callback, methodName)) {
                    return createNoopUnsubscribe();
                }

                try {
                    const handler: IpcListener = (_event, ...args) => {
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

        function createSafeInvokeHandler<Channel extends GenericInvokeChannel>(
            channel: Channel,
            methodName: string
        ): (
            ...args: InvokeRequestArgs<Channel>
        ) => Promise<InvokeResponsePayloadForChannel<Channel>> {
            return async (...args) => {
                try {
                    return (await ipcRenderer.invoke(
                        channel,
                        ...args
                    )) as InvokeResponsePayloadForChannel<Channel>;
                } catch (error) {
                    if (!shouldSuppressInvokeErrorLog(methodName, error)) {
                        preloadLog(
                            "error",
                            `[preload.js] Error in ${methodName}:`,
                            error
                        );
                    }
                    throw error;
                }
            };
        }

        function createSafeSendHandler<Channel extends GenericSendChannel>(
            channel: Channel,
            methodName: string
        ): (...args: IpcRequestPayload[]) => void {
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

        function noopUnsubscribe(): void {
            return undefined;
        }

        function removeIpcListener(channel: string, handler: IpcListener): void {
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
