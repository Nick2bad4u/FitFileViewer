type PreloadApiAssemblyContext =
    import("./preloadModuleTypes").PreloadApiAssemblyContext;
type PreloadIpcEventApiDomain =
    import("./preloadModuleTypes").PreloadIpcEventApiDomain;

export function createPreloadIpcEventApiDomain({
    constants,
    createSafeEventHandler,
    createSafeSendHandler,
    ipcRenderer,
    modules,
    preloadLog,
    removeIpcListener,
    shouldEnforceGenericIpcAllowlist,
    validateCallback,
    validateChannelName,
}: PreloadApiAssemblyContext): PreloadIpcEventApiDomain {
    const { createMenuEventApi, createPreloadEventApi, ipcBridgeCatalog } =
        modules;
    const { isAllowedUpdateEventName } = ipcBridgeCatalog;

    return {
        preloadEventApi: createPreloadEventApi({
            fitFileLoadedChannel: constants.EVENTS.FIT_FILE_LOADED,
            ipcRenderer,
            isAllowedUpdateEventName,
            preloadLog,
            removeIpcListener,
            shouldEnforceGenericIpcAllowlist,
            validateCallback,
            validateChannelName,
        }),
        menuEventApi: createMenuEventApi({
            channels: {
                DECODER_OPTIONS_CHANGED:
                    constants.EVENTS.DECODER_OPTIONS_CHANGED,
                EXPORT_FILE: constants.EVENTS.EXPORT_FILE,
                INSTALL_UPDATE: constants.EVENTS.INSTALL_UPDATE,
                MENU_ABOUT: constants.EVENTS.MENU_ABOUT,
                MENU_CHECK_FOR_UPDATES: constants.EVENTS.MENU_CHECK_FOR_UPDATES,
                MENU_EXPORT: constants.EVENTS.MENU_EXPORT,
                MENU_KEYBOARD_SHORTCUTS:
                    constants.EVENTS.MENU_KEYBOARD_SHORTCUTS,
                MENU_OPEN_FILE: constants.EVENTS.MENU_OPEN_FILE,
                MENU_OPEN_OVERLAY: constants.EVENTS.MENU_OPEN_OVERLAY,
                MENU_PRINT: constants.EVENTS.MENU_PRINT,
                MENU_RESTART_UPDATE: constants.EVENTS.MENU_RESTART_UPDATE,
                MENU_SAVE_AS: constants.EVENTS.MENU_SAVE_AS,
                OPEN_ACCENT_COLOR_PICKER:
                    constants.EVENTS.OPEN_ACCENT_COLOR_PICKER,
                OPEN_RECENT_FILE: constants.EVENTS.OPEN_RECENT_FILE,
                OPEN_SUMMARY_COLUMN_SELECTOR:
                    constants.EVENTS.OPEN_SUMMARY_COLUMN_SELECTOR,
                SET_FONT_SIZE: constants.EVENTS.SET_FONT_SIZE,
                SET_FULLSCREEN: constants.EVENTS.SET_FULLSCREEN,
                SET_HIGH_CONTRAST: constants.EVENTS.SET_HIGH_CONTRAST,
                SET_THEME: constants.EVENTS.SET_THEME,
                SHOW_NOTIFICATION: constants.EVENTS.SHOW_NOTIFICATION,
                THEME_CHANGED: constants.EVENTS.THEME_CHANGED,
                UNLOAD_FIT_FILE: constants.EVENTS.UNLOAD_FIT_FILE,
            },
            createSafeEventHandler,
            createSafeSendHandler,
        }),
    };
}
