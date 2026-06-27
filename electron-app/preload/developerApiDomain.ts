type PreloadApiAssemblyContext =
    import("./preloadAssemblyTypes").PreloadApiAssemblyContext;
type PreloadDeveloperApiDomain =
    import("./preloadAssemblyTypes").PreloadDeveloperApiDomain;

export function createPreloadDeveloperApiDomain({
    constants,
    ipcRenderer,
    modules,
    preloadLog,
    validateOptionalNonEmptyString,
}: PreloadApiAssemblyContext): PreloadDeveloperApiDomain {
    const { createDevtoolsMenuApi, validateDevtoolsInjectMenuPayload } =
        modules;

    return {
        devtoolsMenuApi: createDevtoolsMenuApi({
            defaultFitFilePath: constants.DEFAULT_VALUES.FIT_FILE_PATH,
            defaultTheme: constants.DEFAULT_VALUES.THEME,
            devtoolsInjectMenuChannel: constants.CHANNELS.DEVTOOLS_INJECT_MENU,
            ipcRenderer,
            preloadLog,
            validateDevtoolsInjectMenuPayload,
            validateOptionalNonEmptyString,
        }),
    };
}
