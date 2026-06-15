type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type ExternalInvokeChannel = import("../shared/ipc").ExternalInvokeChannel;
type InvokeRequestArgs<Channel extends ExternalInvokeChannel> =
    import("../shared/ipc").InvokeRequestArgs<Channel>;
type InvokeResponsePayloadForChannel<Channel extends ExternalInvokeChannel> =
    import("../shared/ipc").InvokeResponsePayloadForChannel<Channel>;

interface ShellExternalApiChannels {
    SHELL_OPEN_EXTERNAL: Extract<ExternalInvokeChannel, "shell:openExternal">;
}

interface ShellExternalApiOptions {
    channels: ShellExternalApiChannels;
    createSafeInvokeHandler: <Channel extends ExternalInvokeChannel>(
        channel: Channel,
        methodName: string
    ) => (
        ...args: InvokeRequestArgs<Channel>
    ) => Promise<InvokeResponsePayloadForChannel<Channel>>;
}

type ShellExternalPreloadApi = Pick<ElectronAPI, "openExternal">;

export function createShellExternalApi({
    channels,
    createSafeInvokeHandler,
}: ShellExternalApiOptions): ShellExternalPreloadApi {
    return {
        openExternal: createSafeInvokeHandler(
            channels.SHELL_OPEN_EXTERNAL,
            "openExternal"
        ),
    };
}
