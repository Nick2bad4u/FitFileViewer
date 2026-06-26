type ElectronMenuEventApi = import("../shared/preloadApi").ElectronMenuEventApi;
type ElectronPreloadEventApi =
    import("../shared/preloadApi").ElectronPreloadEventApi;

export interface ElectronApiMenuDomainOptions {
    menuEventApi: ElectronMenuEventApi;
    preloadEventApi: ElectronPreloadEventApi;
}

export function createElectronApiMenuDomain({
    menuEventApi,
    preloadEventApi,
}: ElectronApiMenuDomainOptions): ElectronMenuEventApi &
    ElectronPreloadEventApi {
    return {
        checkForUpdates: menuEventApi.checkForUpdates,
        installUpdate: menuEventApi.installUpdate,
        notifyFitFileLoaded: preloadEventApi.notifyFitFileLoaded,
        onDecoderOptionsChanged: menuEventApi.onDecoderOptionsChanged,
        onExportFile: menuEventApi.onExportFile,
        onMenuAbout: menuEventApi.onMenuAbout,
        onMenuCheckForUpdates: menuEventApi.onMenuCheckForUpdates,
        onMenuExport: menuEventApi.onMenuExport,
        onMenuKeyboardShortcuts: menuEventApi.onMenuKeyboardShortcuts,
        onMenuOpenFile: menuEventApi.onMenuOpenFile,
        onMenuOpenOverlay: menuEventApi.onMenuOpenOverlay,
        onMenuPrint: menuEventApi.onMenuPrint,
        onMenuRestartUpdate: menuEventApi.onMenuRestartUpdate,
        onMenuSaveAs: menuEventApi.onMenuSaveAs,
        onOpenAccentColorPicker: menuEventApi.onOpenAccentColorPicker,
        onOpenRecentFile: menuEventApi.onOpenRecentFile,
        onOpenSummaryColumnSelector: menuEventApi.onOpenSummaryColumnSelector,
        onSetFontSize: menuEventApi.onSetFontSize,
        onSetHighContrast: menuEventApi.onSetHighContrast,
        onSetTheme: menuEventApi.onSetTheme,
        onShowNotification: menuEventApi.onShowNotification,
        onUnloadFitFile: menuEventApi.onUnloadFitFile,
        onUpdateEvent: preloadEventApi.onUpdateEvent,
        requestExport: menuEventApi.requestExport,
        requestSaveAs: menuEventApi.requestSaveAs,
        sendThemeChanged: menuEventApi.sendThemeChanged,
        setFullScreen: menuEventApi.setFullScreen,
    };
}
