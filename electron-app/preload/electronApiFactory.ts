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
    openFolderDialog: ElectronDialogApi["openFolderDialog"];
    preloadEventApi: ElectronPreloadEventApi;
    shellExternalApi: ElectronShellExternalApi;
    themeApi: ElectronThemeApi;
}

function createElectronApiAppInfoDomain({
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

function createElectronApiClipboardDomain({
    clipboardBridge,
}: Pick<ElectronApiFactoryOptions, "clipboardBridge">): ElectronClipboardApi {
    return {
        writeClipboardPngDataUrl: clipboardBridge.writeClipboardPngDataUrl,
        writeClipboardText: clipboardBridge.writeClipboardText,
    };
}

function createElectronApiDeveloperDomain({
    devtoolsMenuApi,
}: Pick<ElectronApiFactoryOptions, "devtoolsMenuApi">): ElectronDevtoolsMenuApi {
    return {
        injectMenu: devtoolsMenuApi.injectMenu,
    };
}

function createElectronApiDiagnosticsDomain({
    apiDiagnostics,
}: Pick<ElectronApiFactoryOptions, "apiDiagnostics">): ElectronApiDiagnosticsApi {
    return {
        getChannelInfo: apiDiagnostics.getChannelInfo,
        validateAPI: apiDiagnostics.validateAPI,
    };
}

function createElectronApiExternalDomain({
    gyazoExternalApi,
    shellExternalApi,
}: Pick<
    ElectronApiFactoryOptions,
    "gyazoExternalApi" | "shellExternalApi"
>): ElectronGyazoExternalApi & ElectronShellExternalApi {
    return {
        onGyazoOAuthCallback: gyazoExternalApi.onGyazoOAuthCallback,
        openExternal: shellExternalApi.openExternal,
        startGyazoServer: gyazoExternalApi.startGyazoServer,
        stopGyazoServer: gyazoExternalApi.stopGyazoServer,
    };
}

function createElectronApiFileDomain({
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

function createElectronApiMenuDomain({
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

function createElectronApiStateDomain({
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
    const appInfoDomain = createElectronApiAppInfoDomain({
        appInfoApi,
        themeApi,
    });
    const clipboardDomain = createElectronApiClipboardDomain({
        clipboardBridge,
    });
    const developerDomain = createElectronApiDeveloperDomain({
        devtoolsMenuApi,
    });
    const diagnosticsDomain = createElectronApiDiagnosticsDomain({
        apiDiagnostics,
    });
    const externalDomain = createElectronApiExternalDomain({
        gyazoExternalApi,
        shellExternalApi,
    });
    const fileDomain = createElectronApiFileDomain({
        fileApi,
        fitBrowserApi,
        openFolderDialog,
    });
    const menuDomain = createElectronApiMenuDomain({
        menuEventApi,
        preloadEventApi,
    });
    const stateDomain = createElectronApiStateDomain({ mainStateApi });

    return {
        addRecentFile: fileDomain.addRecentFile,
        approveRecentFile: fileDomain.approveRecentFile,
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
        onGyazoOAuthCallback: externalDomain.onGyazoOAuthCallback,
        onDecoderOptionsChanged: menuDomain.onDecoderOptionsChanged,
        onExportFile: menuDomain.onExportFile,
        isFitBrowserEnabled: fileDomain.isFitBrowserEnabled,
        onFitBrowserEnabledChanged: fileDomain.onFitBrowserEnabledChanged,
        listenToMainState: stateDomain.listenToMainState,
        listFitBrowserFolder: fileDomain.listFitBrowserFolder,
        notifyFitFileLoaded: menuDomain.notifyFitFileLoaded,
        onMenuOpenFile: menuDomain.onMenuOpenFile,
        onMenuOpenOverlay: menuDomain.onMenuOpenOverlay,
        onMenuPrint: menuDomain.onMenuPrint,
        onOpenRecentFile: menuDomain.onOpenRecentFile,
        onMenuAbout: menuDomain.onMenuAbout,
        onMenuExport: menuDomain.onMenuExport,
        onMenuKeyboardShortcuts: menuDomain.onMenuKeyboardShortcuts,
        onMenuCheckForUpdates: menuDomain.onMenuCheckForUpdates,
        onMenuRestartUpdate: menuDomain.onMenuRestartUpdate,
        onMenuSaveAs: menuDomain.onMenuSaveAs,
        onOpenAccentColorPicker: menuDomain.onOpenAccentColorPicker,
        onOpenSummaryColumnSelector: menuDomain.onOpenSummaryColumnSelector,
        onSetFontSize: menuDomain.onSetFontSize,
        onSetHighContrast: menuDomain.onSetHighContrast,
        onUnloadFitFile: menuDomain.onUnloadFitFile,
        onSetTheme: menuDomain.onSetTheme,
        onShowNotification: menuDomain.onShowNotification,
        onUpdateEvent: menuDomain.onUpdateEvent,
        requestExport: menuDomain.requestExport,
        requestSaveAs: menuDomain.requestSaveAs,
        openExternal: externalDomain.openExternal,
        openFile: fileDomain.openFile,
        openFileDialog: fileDomain.openFileDialog,
        openFolderDialog: fileDomain.openFolderDialog,
        openOverlayDialog: fileDomain.openOverlayDialog,
        parseFitFile: fileDomain.parseFitFile,
        readFile: fileDomain.readFile,
        recentFiles: fileDomain.recentFiles,
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
