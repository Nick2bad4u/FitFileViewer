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

export interface ElectronApiFactoryOptions {
    apiDiagnostics: ElectronApiDiagnosticsApi;
    appInfoApi: ElectronAppInfoApi;
    clipboardBridge: ElectronClipboardApi;
    devtoolsMenuApi: ElectronDevtoolsMenuApi;
    fileApi: ElectronFileApi;
    fitBrowserApi: ElectronFitBrowserApi;
    gyazoExternalApi: ElectronGyazoExternalApi;
    mainStateApi: ElectronMainStateApi;
    menuEventApi: ElectronMenuEventApi;
    openFolderDialog: ElectronDialogApi["openFolderDialog"];
    preloadEventApi: ElectronPreloadEventApi;
    shellExternalApi: ElectronShellExternalApi;
    themeApi: ElectronThemeApi;
}

export function createElectronApiAppInfoDomain({
    appInfoApi,
    themeApi,
}: Pick<
    ElectronApiFactoryOptions,
    "appInfoApi" | "themeApi"
>): ElectronAppInfoApi & ElectronThemeApi {
    return {
        getAppVersion: appInfoApi.getAppVersion,
        getChromeVersion: appInfoApi.getChromeVersion,
        getElectronVersion: appInfoApi.getElectronVersion,
        getLicenseInfo: appInfoApi.getLicenseInfo,
        getNodeVersion: appInfoApi.getNodeVersion,
        getPlatformInfo: appInfoApi.getPlatformInfo,
        getTheme: themeApi.getTheme,
    };
}

export function createElectronApiClipboardDomain({
    clipboardBridge,
}: Pick<ElectronApiFactoryOptions, "clipboardBridge">): ElectronClipboardApi {
    return {
        writeClipboardPngDataUrl: clipboardBridge.writeClipboardPngDataUrl,
        writeClipboardText: clipboardBridge.writeClipboardText,
    };
}

export function createElectronApiDeveloperDomain({
    devtoolsMenuApi,
}: Pick<
    ElectronApiFactoryOptions,
    "devtoolsMenuApi"
>): ElectronDevtoolsMenuApi {
    return {
        injectMenu: devtoolsMenuApi.injectMenu,
    };
}

export function createElectronApiDiagnosticsDomain({
    apiDiagnostics,
}: Pick<
    ElectronApiFactoryOptions,
    "apiDiagnostics"
>): ElectronApiDiagnosticsApi {
    return {
        getChannelInfo: apiDiagnostics.getChannelInfo,
        validateAPI: apiDiagnostics.validateAPI,
    };
}

export function createElectronApiFileDomain({
    fileApi,
    fitBrowserApi,
    openFolderDialog,
}: Pick<
    ElectronApiFactoryOptions,
    "fileApi" | "fitBrowserApi" | "openFolderDialog"
>): ElectronDialogApi & ElectronFileApi & ElectronFitBrowserApi {
    return {
        addRecentFile: fileApi.addRecentFile,
        approveRecentFile: fileApi.approveRecentFile,
        decodeFitFile: fileApi.decodeFitFile,
        getFitBrowserFolder: fitBrowserApi.getFitBrowserFolder,
        isFitBrowserEnabled: fitBrowserApi.isFitBrowserEnabled,
        listFitBrowserFolder: fitBrowserApi.listFitBrowserFolder,
        onFitBrowserEnabledChanged: fitBrowserApi.onFitBrowserEnabledChanged,
        openFile: fileApi.openFile,
        openFileDialog: fileApi.openFileDialog,
        openFolderDialog,
        openOverlayDialog: fileApi.openOverlayDialog,
        parseFitFile: fileApi.parseFitFile,
        readFile: fileApi.readFile,
        recentFiles: fileApi.recentFiles,
        setFitBrowserEnabled: fitBrowserApi.setFitBrowserEnabled,
        setFitBrowserFolder: fitBrowserApi.setFitBrowserFolder,
    };
}

export function createElectronApiMenuDomain({
    menuEventApi,
    preloadEventApi,
}: Pick<
    ElectronApiFactoryOptions,
    "menuEventApi" | "preloadEventApi"
>): ElectronMenuEventApi & ElectronPreloadEventApi {
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

export function createElectronApiStateDomain({
    mainStateApi,
}: Pick<ElectronApiFactoryOptions, "mainStateApi">): ElectronMainStateApi {
    return {
        getErrors: mainStateApi.getErrors,
        getMainState: mainStateApi.getMainState,
        getMetrics: mainStateApi.getMetrics,
        getOperation: mainStateApi.getOperation,
        getOperations: mainStateApi.getOperations,
        listenToMainState: mainStateApi.listenToMainState,
        setMainState: mainStateApi.setMainState,
        subscribeToMainState: mainStateApi.subscribeToMainState,
        unlistenFromMainState: mainStateApi.unlistenFromMainState,
    };
}
