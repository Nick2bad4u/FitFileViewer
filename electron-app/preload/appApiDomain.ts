{
    type PreloadApiAssemblyContext =
        import("./preloadModuleTypes").PreloadApiAssemblyContext;
    type PreloadAppApiDomain =
        import("./preloadModuleTypes").PreloadAppApiDomain;

    function createPreloadAppApiDomain({
        constants,
        contextBridge,
        createSafeEventHandler,
        createSafeInvokeHandler,
        ipcRenderer,
        modules,
        preloadLog,
        processRef,
        validateOptionalNonEmptyString,
    }: PreloadApiAssemblyContext): PreloadAppApiDomain {
        const {
            createApiDiagnostics,
            createAppInfoApi,
            createClipboardBridge,
            createDevtoolsMenuApi,
            createExternalApi,
            createThemeApi,
            isPreloadDevelopmentMode,
        } = modules;

        return {
            apiDiagnostics: createApiDiagnostics({
                channels: constants.CHANNELS,
                contextBridge,
                events: constants.EVENTS,
                ipcRenderer,
                isDevelopmentMode: () =>
                    isPreloadDevelopmentMode(processRef),
                preloadLog,
            }),
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
            clipboardBridge: createClipboardBridge({
                channels: constants.CHANNELS,
                ipcRenderer,
                preloadLog,
            }),
            devtoolsMenuApi: createDevtoolsMenuApi({
                defaultFitFilePath: constants.DEFAULT_VALUES.FIT_FILE_PATH,
                defaultTheme: constants.DEFAULT_VALUES.THEME,
                devtoolsInjectMenuChannel:
                    constants.CHANNELS.DEVTOOLS_INJECT_MENU,
                ipcRenderer,
                preloadLog,
                validateOptionalNonEmptyString,
            }),
            externalApi: createExternalApi({
                channels: {
                    GYAZO_OAUTH_CALLBACK:
                        constants.EVENTS.GYAZO_OAUTH_CALLBACK,
                    GYAZO_SERVER_START:
                        constants.CHANNELS.GYAZO_SERVER_START,
                    GYAZO_SERVER_STOP: constants.CHANNELS.GYAZO_SERVER_STOP,
                    SHELL_OPEN_EXTERNAL:
                        constants.CHANNELS.SHELL_OPEN_EXTERNAL,
                },
                createSafeEventHandler,
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

    module.exports = {
        createPreloadAppApiDomain,
    };
}
