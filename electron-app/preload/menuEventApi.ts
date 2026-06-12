type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type GenericSendChannel = import("../shared/ipc").GenericSendChannel;
type IpcRequestPayload = import("../shared/ipc").IpcRequestPayload;
type IpcResponsePayload = import("../shared/ipc").IpcResponsePayload;

interface MenuEventApiChannels {
    DECODER_OPTIONS_CHANGED: string;
    EXPORT_FILE: string;
    INSTALL_UPDATE: Extract<GenericSendChannel, "install-update">;
    MENU_ABOUT: string;
    MENU_CHECK_FOR_UPDATES: Extract<
        GenericSendChannel,
        "menu-check-for-updates"
    >;
    MENU_EXPORT: Extract<GenericSendChannel, "menu-export">;
    MENU_KEYBOARD_SHORTCUTS: string;
    MENU_OPEN_FILE: string;
    MENU_OPEN_OVERLAY: string;
    MENU_PRINT: string;
    MENU_RESTART_UPDATE: string;
    MENU_SAVE_AS: Extract<GenericSendChannel, "menu-save-as">;
    OPEN_ACCENT_COLOR_PICKER: string;
    OPEN_RECENT_FILE: string;
    OPEN_SUMMARY_COLUMN_SELECTOR: string;
    SET_FONT_SIZE: string;
    SET_FULLSCREEN: Extract<GenericSendChannel, "set-fullscreen">;
    SET_HIGH_CONTRAST: string;
    SET_THEME: string;
    SHOW_NOTIFICATION: string;
    THEME_CHANGED: Extract<GenericSendChannel, "theme-changed">;
    UNLOAD_FIT_FILE: string;
}

interface MenuEventApiOptions {
    channels: MenuEventApiChannels;
    createSafeEventHandler: <Callback>(
        channel: string,
        methodName: string,
        transform?: (...args: IpcResponsePayload[]) => IpcResponsePayload | null
    ) => (callback: Callback) => () => void;
    createSafeSendHandler: (
        channel: GenericSendChannel,
        methodName: string
    ) => (...args: IpcRequestPayload[]) => void;
}

type MenuEventPreloadApi = Pick<
    ElectronAPI,
    | "checkForUpdates"
    | "installUpdate"
    | "onDecoderOptionsChanged"
    | "onExportFile"
    | "onMenuAbout"
    | "onMenuCheckForUpdates"
    | "onMenuExport"
    | "onMenuKeyboardShortcuts"
    | "onMenuOpenFile"
    | "onMenuOpenOverlay"
    | "onMenuPrint"
    | "onMenuRestartUpdate"
    | "onMenuSaveAs"
    | "onOpenAccentColorPicker"
    | "onOpenRecentFile"
    | "onOpenSummaryColumnSelector"
    | "onSetFontSize"
    | "onSetHighContrast"
    | "onSetTheme"
    | "onShowNotification"
    | "onUnloadFitFile"
    | "requestExport"
    | "requestSaveAs"
    | "sendThemeChanged"
    | "setFullScreen"
>;

export function createMenuEventApi({
    channels,
    createSafeEventHandler,
    createSafeSendHandler,
}: MenuEventApiOptions): MenuEventPreloadApi {
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
