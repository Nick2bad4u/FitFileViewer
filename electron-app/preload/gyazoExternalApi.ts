type CreateGyazoExternalApiOptions =
    import("./preloadModuleTypes").CreateGyazoExternalApiOptions;
type GyazoExternalPreloadApi =
    import("../shared/preloadApi").ElectronGyazoExternalApi;

export function createGyazoExternalApi({
    channels,
    createSafeEventHandler,
    createSafeInvokeHandler,
}: CreateGyazoExternalApiOptions): GyazoExternalPreloadApi {
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
