type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type ElectronApiDiagnosticsApi =
    import("../shared/preloadApi").ElectronApiDiagnosticsApi;
type ElectronAppInfoApi = import("../shared/preloadApi").ElectronAppInfoApi;
type ElectronClipboardApi = import("../shared/preloadApi").ElectronClipboardApi;
type ElectronDevtoolsMenuApi =
    import("../shared/preloadApi").ElectronDevtoolsMenuApi;
type ElectronFileApi = import("../shared/preloadApi").ElectronFileApi;
type ElectronFitBrowserApi =
    import("../shared/preloadApi").ElectronFitBrowserApi;
type ElectronGyazoExternalApi =
    import("../shared/preloadApi").ElectronGyazoExternalApi;
type ElectronMainStateApi = import("../shared/preloadApi").ElectronMainStateApi;
type ElectronMenuEventApi = import("../shared/preloadApi").ElectronMenuEventApi;
type ElectronPreloadEventApi =
    import("../shared/preloadApi").ElectronPreloadEventApi;
type ElectronShellExternalApi =
    import("../shared/preloadApi").ElectronShellExternalApi;
type ElectronThemeApi = import("../shared/preloadApi").ElectronThemeApi;

interface ElectronApiFactoryOptions {
    apiDiagnostics: ElectronApiDiagnosticsApi;
    appInfoApi: ElectronAppInfoApi;
    clipboardBridge: ElectronClipboardApi;
    devtoolsMenuApi: ElectronDevtoolsMenuApi;
    fileApi: ElectronFileApi;
    fitBrowserApi: ElectronFitBrowserApi;
    gyazoExternalApi: ElectronGyazoExternalApi;
    mainStateApi: ElectronMainStateApi;
    menuEventApi: ElectronMenuEventApi;
    openFolderDialog: ElectronAPI["openFolderDialog"];
    preloadEventApi: ElectronPreloadEventApi;
    shellExternalApi: ElectronShellExternalApi;
    themeApi: ElectronThemeApi;
}

export function createElectronApi({
    apiDiagnostics,
    appInfoApi,
    clipboardBridge,
    devtoolsMenuApi,
    fileApi,
    fitBrowserApi,
    gyazoExternalApi,
    mainStateApi,
    menuEventApi,
    openFolderDialog,
    preloadEventApi,
    shellExternalApi,
    themeApi,
}: ElectronApiFactoryOptions): ElectronAPI {
    return {
        addRecentFile: fileApi.addRecentFile,
        approveRecentFile: fileApi.approveRecentFile,
        checkForUpdates: menuEventApi.checkForUpdates,
        decodeFitFile: fileApi.decodeFitFile,
        getAppVersion: appInfoApi.getAppVersion,
        getChannelInfo: apiDiagnostics.getChannelInfo,
        getChromeVersion: appInfoApi.getChromeVersion,
        getElectronVersion: appInfoApi.getElectronVersion,
        getErrors: mainStateApi.getErrors,
        getFitBrowserFolder: fitBrowserApi.getFitBrowserFolder,
        getLicenseInfo: appInfoApi.getLicenseInfo,
        getMainState: mainStateApi.getMainState,
        getMetrics: mainStateApi.getMetrics,
        getNodeVersion: appInfoApi.getNodeVersion,
        getOperation: mainStateApi.getOperation,
        getOperations: mainStateApi.getOperations,
        getPlatformInfo: appInfoApi.getPlatformInfo,
        getTheme: themeApi.getTheme,
        injectMenu: devtoolsMenuApi.injectMenu,
        installUpdate: menuEventApi.installUpdate,
        onGyazoOAuthCallback: gyazoExternalApi.onGyazoOAuthCallback,
        onDecoderOptionsChanged: menuEventApi.onDecoderOptionsChanged,
        onExportFile: menuEventApi.onExportFile,
        isFitBrowserEnabled: fitBrowserApi.isFitBrowserEnabled,
        onFitBrowserEnabledChanged: fitBrowserApi.onFitBrowserEnabledChanged,
        listenToMainState: mainStateApi.listenToMainState,
        listFitBrowserFolder: fitBrowserApi.listFitBrowserFolder,
        notifyFitFileLoaded: preloadEventApi.notifyFitFileLoaded,
        onMenuOpenFile: menuEventApi.onMenuOpenFile,
        onMenuOpenOverlay: menuEventApi.onMenuOpenOverlay,
        onMenuPrint: menuEventApi.onMenuPrint,
        onOpenRecentFile: menuEventApi.onOpenRecentFile,
        onMenuAbout: menuEventApi.onMenuAbout,
        onMenuExport: menuEventApi.onMenuExport,
        onMenuKeyboardShortcuts: menuEventApi.onMenuKeyboardShortcuts,
        onMenuCheckForUpdates: menuEventApi.onMenuCheckForUpdates,
        onMenuRestartUpdate: menuEventApi.onMenuRestartUpdate,
        onMenuSaveAs: menuEventApi.onMenuSaveAs,
        onOpenAccentColorPicker: menuEventApi.onOpenAccentColorPicker,
        onOpenSummaryColumnSelector: menuEventApi.onOpenSummaryColumnSelector,
        onSetFontSize: menuEventApi.onSetFontSize,
        onSetHighContrast: menuEventApi.onSetHighContrast,
        onUnloadFitFile: menuEventApi.onUnloadFitFile,
        onSetTheme: menuEventApi.onSetTheme,
        onShowNotification: menuEventApi.onShowNotification,
        onUpdateEvent: preloadEventApi.onUpdateEvent,
        requestExport: menuEventApi.requestExport,
        requestSaveAs: menuEventApi.requestSaveAs,
        openExternal: shellExternalApi.openExternal,
        openFile: fileApi.openFile,
        openFileDialog: fileApi.openFileDialog,
        openFolderDialog,
        openOverlayDialog: fileApi.openOverlayDialog,
        parseFitFile: fileApi.parseFitFile,
        readFile: fileApi.readFile,
        recentFiles: fileApi.recentFiles,
        sendThemeChanged: menuEventApi.sendThemeChanged,
        setFitBrowserEnabled: fitBrowserApi.setFitBrowserEnabled,
        setFitBrowserFolder: fitBrowserApi.setFitBrowserFolder,
        setFullScreen: menuEventApi.setFullScreen,
        setMainState: mainStateApi.setMainState,
        startGyazoServer: gyazoExternalApi.startGyazoServer,
        stopGyazoServer: gyazoExternalApi.stopGyazoServer,
        subscribeToMainState: mainStateApi.subscribeToMainState,
        unlistenFromMainState: mainStateApi.unlistenFromMainState,
        validateAPI: apiDiagnostics.validateAPI,
        writeClipboardPngDataUrl: clipboardBridge.writeClipboardPngDataUrl,
        writeClipboardText: clipboardBridge.writeClipboardText,
    };
}
