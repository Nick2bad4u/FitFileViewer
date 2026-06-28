type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type ElectronApiDiagnosticsApi =
    import("../shared/preloadApi").ElectronApiDiagnosticsApi;
type ElectronAppInfoApi = import("../shared/preloadApi").ElectronAppInfoApi;
type ElectronClipboardApi = import("../shared/preloadApi").ElectronClipboardApi;
type ElectronDevtoolsMenuApi =
    import("../shared/preloadApi").ElectronDevtoolsMenuApi;
type ElectronDialogApi = import("../shared/preloadApi").ElectronDialogApi;
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

export interface ElectronApiDomains {
    readonly appInfoDomain: ElectronAppInfoApi & ElectronThemeApi;
    readonly clipboardDomain: ElectronClipboardApi;
    readonly developerDomain: ElectronDevtoolsMenuApi;
    readonly diagnosticsDomain: ElectronApiDiagnosticsApi;
    readonly dialogDomain: ElectronDialogApi;
    readonly externalDomain: ElectronGyazoExternalApi &
        ElectronShellExternalApi;
    readonly fileDomain: ElectronFileApi & ElectronFitBrowserApi;
    readonly menuDomain: ElectronMenuEventApi & ElectronPreloadEventApi;
    readonly stateDomain: ElectronMainStateApi;
}

export function composeElectronApiDomains({
    appInfoDomain,
    clipboardDomain,
    developerDomain,
    diagnosticsDomain,
    dialogDomain,
    externalDomain,
    fileDomain,
    menuDomain,
    stateDomain,
}: ElectronApiDomains): ElectronAPI {
    return {
        addRecentFile: fileDomain.addRecentFile,
        checkForUpdates: menuDomain.checkForUpdates,
        decodeFitFile: fileDomain.decodeFitFile,
        getAppVersion: appInfoDomain.getAppVersion,
        getChannelInfo: diagnosticsDomain.getChannelInfo,
        getChromeVersion: appInfoDomain.getChromeVersion,
        getElectronVersion: appInfoDomain.getElectronVersion,
        getErrors: stateDomain.getErrors,
        getFitBrowserFolder: fileDomain.getFitBrowserFolder,
        getLicenseInfo: appInfoDomain.getLicenseInfo,
        getMainState: stateDomain.getMainState,
        getMetrics: stateDomain.getMetrics,
        getNodeVersion: appInfoDomain.getNodeVersion,
        getOperation: stateDomain.getOperation,
        getOperations: stateDomain.getOperations,
        getPlatformInfo: appInfoDomain.getPlatformInfo,
        getTheme: appInfoDomain.getTheme,
        injectMenu: developerDomain.injectMenu,
        installUpdate: menuDomain.installUpdate,
        isFitBrowserEnabled: fileDomain.isFitBrowserEnabled,
        listenToMainState: stateDomain.listenToMainState,
        listFitBrowserFolder: fileDomain.listFitBrowserFolder,
        notifyFitFileLoaded: menuDomain.notifyFitFileLoaded,
        onDecoderOptionsChanged: menuDomain.onDecoderOptionsChanged,
        onExportFile: menuDomain.onExportFile,
        onFitBrowserEnabledChanged: fileDomain.onFitBrowserEnabledChanged,
        onGyazoOAuthCallback: externalDomain.onGyazoOAuthCallback,
        onMenuAbout: menuDomain.onMenuAbout,
        onMenuCheckForUpdates: menuDomain.onMenuCheckForUpdates,
        onMenuExport: menuDomain.onMenuExport,
        onMenuKeyboardShortcuts: menuDomain.onMenuKeyboardShortcuts,
        onMenuOpenFile: menuDomain.onMenuOpenFile,
        onMenuOpenOverlay: menuDomain.onMenuOpenOverlay,
        onMenuPrint: menuDomain.onMenuPrint,
        onMenuRestartUpdate: menuDomain.onMenuRestartUpdate,
        onMenuSaveAs: menuDomain.onMenuSaveAs,
        onOpenAccentColorPicker: menuDomain.onOpenAccentColorPicker,
        onOpenRecentFile: menuDomain.onOpenRecentFile,
        onOpenSummaryColumnSelector: menuDomain.onOpenSummaryColumnSelector,
        onSetFontSize: menuDomain.onSetFontSize,
        onSetHighContrast: menuDomain.onSetHighContrast,
        onSetTheme: menuDomain.onSetTheme,
        onShowNotification: menuDomain.onShowNotification,
        onUnloadFitFile: menuDomain.onUnloadFitFile,
        onUpdateEvent: menuDomain.onUpdateEvent,
        openExternal: externalDomain.openExternal,
        openFile: dialogDomain.openFile,
        openFileDialog: dialogDomain.openFileDialog,
        openFolderDialog: dialogDomain.openFolderDialog,
        openOverlayDialog: dialogDomain.openOverlayDialog,
        parseFitFile: fileDomain.parseFitFile,
        readFile: fileDomain.readFile,
        recentFiles: fileDomain.recentFiles,
        requestExport: menuDomain.requestExport,
        requestSaveAs: menuDomain.requestSaveAs,
        sendThemeChanged: menuDomain.sendThemeChanged,
        setFitBrowserEnabled: fileDomain.setFitBrowserEnabled,
        setFitBrowserFolder: fileDomain.setFitBrowserFolder,
        setFullScreen: menuDomain.setFullScreen,
        setMainState: stateDomain.setMainState,
        startGyazoServer: externalDomain.startGyazoServer,
        stopGyazoServer: externalDomain.stopGyazoServer,
        subscribeToMainState: stateDomain.subscribeToMainState,
        unlistenFromMainState: stateDomain.unlistenFromMainState,
        validateAPI: diagnosticsDomain.validateAPI,
        writeClipboardPngDataUrl: clipboardDomain.writeClipboardPngDataUrl,
        writeClipboardText: clipboardDomain.writeClipboardText,
    };
}
