{
    type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
    type ExternalInvokeChannel = import("../shared/ipc").ExternalInvokeChannel;
    type InvokeRequestArgs<Channel extends ExternalInvokeChannel> =
        import("../shared/ipc").InvokeRequestArgs<Channel>;
    type InvokeResponsePayloadForChannel<
        Channel extends ExternalInvokeChannel,
    > = import("../shared/ipc").InvokeResponsePayloadForChannel<Channel>;
    interface ExternalApiChannels {
        GYAZO_OAUTH_CALLBACK: string;
        GYAZO_SERVER_START: Extract<
            ExternalInvokeChannel,
            "gyazo:server:start"
        >;
        GYAZO_SERVER_STOP: Extract<
            ExternalInvokeChannel,
            "gyazo:server:stop"
        >;
        SHELL_OPEN_EXTERNAL: Extract<
            ExternalInvokeChannel,
            "shell:openExternal"
        >;
    }

    interface ExternalApiOptions {
        channels: ExternalApiChannels;
        createSafeEventHandler: <Callback>(
            channel: string,
            methodName: string
        ) => (callback: Callback) => () => void;
        createSafeInvokeHandler: <Channel extends ExternalInvokeChannel>(
            channel: Channel,
            methodName: string
        ) => (
            ...args: InvokeRequestArgs<Channel>
        ) => Promise<InvokeResponsePayloadForChannel<Channel>>;
    }

    type ExternalPreloadApi = Pick<
        ElectronAPI,
        | "onGyazoOAuthCallback"
        | "openExternal"
        | "startGyazoServer"
        | "stopGyazoServer"
    >;

    function createExternalApi({
        channels,
        createSafeEventHandler,
        createSafeInvokeHandler,
    }: ExternalApiOptions): ExternalPreloadApi {
        return {
            onGyazoOAuthCallback: createSafeEventHandler(
                channels.GYAZO_OAUTH_CALLBACK,
                "onGyazoOAuthCallback"
            ),
            openExternal: createSafeInvokeHandler(
                channels.SHELL_OPEN_EXTERNAL,
                "openExternal"
            ),
            startGyazoServer: createSafeInvokeHandler(
                channels.GYAZO_SERVER_START,
                "startGyazoServer"
            ),
            stopGyazoServer: createSafeInvokeHandler(
                channels.GYAZO_SERVER_STOP,
                "stopGyazoServer"
            ),
        };
    }

    module.exports = {
        createExternalApi,
    };
}
