type ElectronAPI = import("../shared/preloadApi").ElectronAPI;

import {
    createElectronApiAppInfoDomain,
    createElectronApiClipboardDomain,
    createElectronApiDeveloperDomain,
    createElectronApiDiagnosticsDomain,
    createElectronApiExternalDomain,
    createElectronApiFileDomain,
    createElectronApiMenuDomain,
    createElectronApiStateDomain,
    type ElectronApiFactoryOptions,
} from "./electronApiDomains.js";

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
