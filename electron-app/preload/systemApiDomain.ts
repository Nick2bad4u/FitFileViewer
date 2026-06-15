type PreloadApiAssemblyContext =
    import("./preloadModuleTypes").PreloadApiAssemblyContext;
type PreloadSystemApiDomain =
    import("./preloadModuleTypes").PreloadSystemApiDomain;

export function createPreloadSystemApiDomain({
    constants,
    createSafeInvokeHandler,
    modules,
}: PreloadApiAssemblyContext): PreloadSystemApiDomain {
    const { createAppInfoApi, createThemeApi } = modules;

    return {
        appInfoApi: createAppInfoApi({
            channels: {
                APP_VERSION: constants.CHANNELS.APP_VERSION,
                CHROME_VERSION: constants.CHANNELS.CHROME_VERSION,
                ELECTRON_VERSION: constants.CHANNELS.ELECTRON_VERSION,
                LICENSE_INFO: constants.CHANNELS.LICENSE_INFO,
                NODE_VERSION: constants.CHANNELS.NODE_VERSION,
                PLATFORM_INFO: constants.CHANNELS.PLATFORM_INFO,
            },
            createSafeInvokeHandler,
        }),
        themeApi: createThemeApi({
            channels: {
                THEME_GET: constants.CHANNELS.THEME_GET,
            },
            createSafeInvokeHandler,
        }),
    };
}
