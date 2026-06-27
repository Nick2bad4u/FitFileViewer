type PreloadApiAssemblyContext =
    import("./preloadAssemblyTypes").PreloadApiAssemblyContext;
type PreloadExternalApiDomain =
    import("./preloadAssemblyTypes").PreloadExternalApiDomain;

export function createPreloadExternalApiDomain({
    constants,
    createSafeEventHandler,
    createSafeInvokeHandler,
    modules,
}: PreloadApiAssemblyContext): PreloadExternalApiDomain {
    const { createGyazoExternalApi, createShellExternalApi } = modules;

    return {
        gyazoExternalApi: createGyazoExternalApi({
            channels: {
                GYAZO_OAUTH_CALLBACK: constants.EVENTS.GYAZO_OAUTH_CALLBACK,
                GYAZO_SERVER_START: constants.CHANNELS.GYAZO_SERVER_START,
                GYAZO_SERVER_STOP: constants.CHANNELS.GYAZO_SERVER_STOP,
            },
            createSafeEventHandler,
            createSafeInvokeHandler,
        }),
        shellExternalApi: createShellExternalApi({
            channels: {
                SHELL_OPEN_EXTERNAL: constants.CHANNELS.SHELL_OPEN_EXTERNAL,
            },
            createSafeInvokeHandler,
        }),
    };
}
