type CreateShellExternalApiOptions =
    import("./preloadModuleTypes").CreateShellExternalApiOptions;
type ShellExternalPreloadApi =
    import("../shared/preloadApi").ElectronShellExternalApi;

export function createShellExternalApi({
    channels,
    createSafeInvokeHandler,
}: CreateShellExternalApiOptions): ShellExternalPreloadApi {
    return {
        openExternal: createSafeInvokeHandler(
            channels.SHELL_OPEN_EXTERNAL,
            "openExternal"
        ),
    };
}
