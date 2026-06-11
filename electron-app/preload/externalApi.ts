{
    type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
    type ExternalInvokeChannel = import("../shared/ipc").ExternalInvokeChannel;
    type InvokeRequestArgs<Channel extends ExternalInvokeChannel> =
        import("../shared/ipc").InvokeRequestArgs<Channel>;
    type InvokeResponsePayloadForChannel<
        Channel extends ExternalInvokeChannel,
    > = import("../shared/ipc").InvokeResponsePayloadForChannel<Channel>;

    type CreateGyazoExternalApi = (options: {
        channels: Pick<
            ExternalApiChannels,
            "GYAZO_OAUTH_CALLBACK" | "GYAZO_SERVER_START" | "GYAZO_SERVER_STOP"
        >;
        createSafeEventHandler: ExternalApiOptions["createSafeEventHandler"];
        createSafeInvokeHandler: ExternalApiOptions["createSafeInvokeHandler"];
    }) => Pick<
        ElectronAPI,
        "onGyazoOAuthCallback" | "startGyazoServer" | "stopGyazoServer"
    >;
    type CreateShellExternalApi = (options: {
        channels: Pick<ExternalApiChannels, "SHELL_OPEN_EXTERNAL">;
        createSafeInvokeHandler: ExternalApiOptions["createSafeInvokeHandler"];
    }) => Pick<ElectronAPI, "openExternal">;

    const { createGyazoExternalApi } = require("./gyazoExternalApi.js") as {
        createGyazoExternalApi: CreateGyazoExternalApi;
    };
    const { createShellExternalApi } = require("./shellExternalApi.js") as {
        createShellExternalApi: CreateShellExternalApi;
    };

    interface ExternalApiChannels {
        GYAZO_OAUTH_CALLBACK: string;
        GYAZO_SERVER_START: Extract<
            ExternalInvokeChannel,
            "gyazo:server:start"
        >;
        GYAZO_SERVER_STOP: Extract<ExternalInvokeChannel, "gyazo:server:stop">;
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
            ...createGyazoExternalApi({
                channels: {
                    GYAZO_OAUTH_CALLBACK: channels.GYAZO_OAUTH_CALLBACK,
                    GYAZO_SERVER_START: channels.GYAZO_SERVER_START,
                    GYAZO_SERVER_STOP: channels.GYAZO_SERVER_STOP,
                },
                createSafeEventHandler,
                createSafeInvokeHandler,
            }),
            ...createShellExternalApi({
                channels: {
                    SHELL_OPEN_EXTERNAL: channels.SHELL_OPEN_EXTERNAL,
                },
                createSafeInvokeHandler,
            }),
        };
    }

    module.exports = {
        createExternalApi,
    };
}
