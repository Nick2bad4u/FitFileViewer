type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;
type CreateMenuEventApiOptions =
    import("./preloadModuleTypes").CreateMenuEventApiOptions;
type MenuEventPreloadApi = import("../shared/preloadApi").ElectronMenuEventApi;

export function createMenuEventApi({
    channels,
    createSafeEventHandler,
    createSafeSendHandler,
}: CreateMenuEventApiOptions): MenuEventPreloadApi {
    return {
        checkForUpdates: createSafeSendHandler(
            channels.MENU_CHECK_FOR_UPDATES,
            "checkForUpdates"
        ),
        installUpdate: createSafeSendHandler(
            channels.INSTALL_UPDATE,
            "installUpdate"
        ),
        onDecoderOptionsChanged: createSafeEventHandler(
            channels.DECODER_OPTIONS_CHANGED,
            "onDecoderOptionsChanged"
        ),
        onExportFile: createSafeEventHandler(
            channels.EXPORT_FILE,
            "onExportFile"
        ),
        onMenuAbout: createSafeEventHandler(channels.MENU_ABOUT, "onMenuAbout"),
        onMenuCheckForUpdates: createSafeEventHandler(
            channels.MENU_CHECK_FOR_UPDATES,
            "onMenuCheckForUpdates"
        ),
        onMenuExport: createSafeEventHandler(
            channels.MENU_EXPORT,
            "onMenuExport"
        ),
        onMenuKeyboardShortcuts: createSafeEventHandler(
            channels.MENU_KEYBOARD_SHORTCUTS,
            "onMenuKeyboardShortcuts"
        ),
        onMenuOpenFile: createSafeEventHandler(
            channels.MENU_OPEN_FILE,
            "onMenuOpenFile"
        ),
        onMenuOpenOverlay: createSafeEventHandler(
            channels.MENU_OPEN_OVERLAY,
            "onMenuOpenOverlay"
        ),
        onMenuPrint: createSafeEventHandler(channels.MENU_PRINT, "onMenuPrint"),
        onMenuRestartUpdate: createSafeEventHandler(
            channels.MENU_RESTART_UPDATE,
            "onMenuRestartUpdate"
        ),
        onMenuSaveAs: createSafeEventHandler(
            channels.MENU_SAVE_AS,
            "onMenuSaveAs"
        ),
        onOpenAccentColorPicker: createSafeEventHandler(
            channels.OPEN_ACCENT_COLOR_PICKER,
            "onOpenAccentColorPicker"
        ),
        onOpenRecentFile: createSafeEventHandler(
            channels.OPEN_RECENT_FILE,
            "onOpenRecentFile",
            (filePath: IpcResponsePayload) => filePath
        ),
        onOpenSummaryColumnSelector: createSafeEventHandler(
            channels.OPEN_SUMMARY_COLUMN_SELECTOR,
            "onOpenSummaryColumnSelector"
        ),
        onSetFontSize: createSafeEventHandler(
            channels.SET_FONT_SIZE,
            "onSetFontSize"
        ),
        onSetHighContrast: createSafeEventHandler(
            channels.SET_HIGH_CONTRAST,
            "onSetHighContrast"
        ),
        onSetTheme: createSafeEventHandler(
            channels.SET_THEME,
            "onSetTheme",
            (theme: IpcResponsePayload) => theme
        ),
        onShowNotification: createSafeEventHandler(
            channels.SHOW_NOTIFICATION,
            "onShowNotification"
        ),
        onUnloadFitFile: createSafeEventHandler(
            channels.UNLOAD_FIT_FILE,
            "onUnloadFitFile"
        ),
        requestExport: createSafeSendHandler(
            channels.MENU_EXPORT,
            "requestExport"
        ),
        requestSaveAs: createSafeSendHandler(
            channels.MENU_SAVE_AS,
            "requestSaveAs"
        ),
        sendThemeChanged: createSafeSendHandler(
            channels.THEME_CHANGED,
            "sendThemeChanged"
        ),
        setFullScreen: createSafeSendHandler(
            channels.SET_FULLSCREEN,
            "setFullScreen"
        ),
    };
}
