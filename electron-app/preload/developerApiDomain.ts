{
    type PreloadApiAssemblyContext =
        import("./preloadModuleTypes").PreloadApiAssemblyContext;
    type PreloadDeveloperApiDomain =
        import("./preloadModuleTypes").PreloadDeveloperApiDomain;

    function createPreloadDeveloperApiDomain({
        constants,
        ipcRenderer,
        modules,
        preloadLog,
        validateOptionalNonEmptyString,
    }: PreloadApiAssemblyContext): PreloadDeveloperApiDomain {
        const { createDevtoolsMenuApi } = modules;

        return {
            devtoolsMenuApi: createDevtoolsMenuApi({
                defaultFitFilePath: constants.DEFAULT_VALUES.FIT_FILE_PATH,
                defaultTheme: constants.DEFAULT_VALUES.THEME,
                devtoolsInjectMenuChannel:
                    constants.CHANNELS.DEVTOOLS_INJECT_MENU,
                ipcRenderer,
                preloadLog,
                validateOptionalNonEmptyString,
            }),
        };
    }

    module.exports = {
        createPreloadDeveloperApiDomain,
    };
}
