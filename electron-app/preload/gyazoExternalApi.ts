type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type ExternalInvokeChannel = import("../shared/ipc").ExternalInvokeChannel;
type InvokeRequestArgs<Channel extends ExternalInvokeChannel> =
    import("../shared/ipc").InvokeRequestArgs<Channel>;
type InvokeResponsePayloadForChannel<Channel extends ExternalInvokeChannel> =
    import("../shared/ipc").InvokeResponsePayloadForChannel<Channel>;

interface GyazoExternalApiChannels {
    GYAZO_OAUTH_CALLBACK: string;
    GYAZO_SERVER_START: Extract<ExternalInvokeChannel, "gyazo:server:start">;
    GYAZO_SERVER_STOP: Extract<ExternalInvokeChannel, "gyazo:server:stop">;
}

interface GyazoExternalApiOptions {
    channels: GyazoExternalApiChannels;
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

type GyazoExternalPreloadApi = Pick<
    ElectronAPI,
    "onGyazoOAuthCallback" | "startGyazoServer" | "stopGyazoServer"
>;

export function createGyazoExternalApi({
    channels,
    createSafeEventHandler,
    createSafeInvokeHandler,
}: GyazoExternalApiOptions): GyazoExternalPreloadApi {
    return {
        onGyazoOAuthCallback: createSafeEventHandler(
            channels.GYAZO_OAUTH_CALLBACK,
            "onGyazoOAuthCallback"
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
