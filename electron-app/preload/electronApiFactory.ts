{
    type ElectronAPI = import("../shared/preloadApi").ElectronAPI;

    type ApiDiagnostics = Pick<ElectronAPI, "getChannelInfo" | "validateAPI">;
    type AppInfoApi = Pick<
        ElectronAPI,
        | "getAppVersion"
        | "getChromeVersion"
        | "getElectronVersion"
        | "getLicenseInfo"
        | "getNodeVersion"
        | "getPlatformInfo"
    >;
    type ClipboardBridge = Pick<
        ElectronAPI,
        "writeClipboardPngDataUrl" | "writeClipboardText"
    >;
    type DevtoolsMenuApi = Pick<ElectronAPI, "injectMenu">;
    type ExternalApi = Pick<
        ElectronAPI,
        | "onGyazoOAuthCallback"
        | "openExternal"
        | "startGyazoServer"
        | "stopGyazoServer"
    >;
    type FileApi = Pick<
        ElectronAPI,
        | "addRecentFile"
        | "approveRecentFile"
        | "decodeFitFile"
        | "openFile"
        | "openFileDialog"
        | "openOverlayDialog"
        | "parseFitFile"
        | "readFile"
        | "recentFiles"
    >;
    type FitBrowserApi = Pick<
        ElectronAPI,
        | "getFitBrowserFolder"
        | "isFitBrowserEnabled"
        | "listFitBrowserFolder"
        | "onFitBrowserEnabledChanged"
        | "setFitBrowserEnabled"
        | "setFitBrowserFolder"
    >;
    type GenericIpcApi = Pick<
        ElectronAPI,
        "invoke" | "notifyFitFileLoaded" | "onIpc" | "onUpdateEvent" | "send"
    >;
    type MainStateApi = Pick<
        ElectronAPI,
        | "getErrors"
        | "getMainState"
        | "getMetrics"
        | "getOperation"
        | "getOperations"
        | "listenToMainState"
        | "setMainState"
        | "subscribeToMainState"
        | "unlistenFromMainState"
    >;
    type MenuEventApi = Pick<
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
    type ThemeApi = Pick<ElectronAPI, "getTheme">;

    interface ElectronApiFactoryOptions {
        apiDiagnostics: ApiDiagnostics;
        appInfoApi: AppInfoApi;
        clipboardBridge: ClipboardBridge;
        devtoolsMenuApi: DevtoolsMenuApi;
        externalApi: ExternalApi;
        fileApi: FileApi;
        fitBrowserApi: FitBrowserApi;
        genericIpcApi: GenericIpcApi;
        mainStateApi: MainStateApi;
        menuEventApi: MenuEventApi;
        openFolderDialog: ElectronAPI["openFolderDialog"];
        themeApi: ThemeApi;
    }

    function createElectronApi({
        apiDiagnostics,
        appInfoApi,
        clipboardBridge,
        devtoolsMenuApi,
        externalApi,
        fileApi,
        fitBrowserApi,
        genericIpcApi,
        mainStateApi,
        menuEventApi,
        openFolderDialog,
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
            onGyazoOAuthCallback: externalApi.onGyazoOAuthCallback,
            onDecoderOptionsChanged: menuEventApi.onDecoderOptionsChanged,
            onExportFile: menuEventApi.onExportFile,
            invoke: genericIpcApi.invoke,
            isFitBrowserEnabled: fitBrowserApi.isFitBrowserEnabled,
            onFitBrowserEnabledChanged:
                fitBrowserApi.onFitBrowserEnabledChanged,
            listenToMainState: mainStateApi.listenToMainState,
            listFitBrowserFolder: fitBrowserApi.listFitBrowserFolder,
            notifyFitFileLoaded: genericIpcApi.notifyFitFileLoaded,
            onIpc: genericIpcApi.onIpc,
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
            onOpenSummaryColumnSelector:
                menuEventApi.onOpenSummaryColumnSelector,
            onSetFontSize: menuEventApi.onSetFontSize,
            onSetHighContrast: menuEventApi.onSetHighContrast,
            onUnloadFitFile: menuEventApi.onUnloadFitFile,
            onSetTheme: menuEventApi.onSetTheme,
            onShowNotification: menuEventApi.onShowNotification,
            onUpdateEvent: genericIpcApi.onUpdateEvent,
            requestExport: menuEventApi.requestExport,
            requestSaveAs: menuEventApi.requestSaveAs,
            openExternal: externalApi.openExternal,
            openFile: fileApi.openFile,
            openFileDialog: fileApi.openFileDialog,
            openFolderDialog,
            openOverlayDialog: fileApi.openOverlayDialog,
            parseFitFile: fileApi.parseFitFile,
            readFile: fileApi.readFile,
            recentFiles: fileApi.recentFiles,
            send: genericIpcApi.send,
            sendThemeChanged: menuEventApi.sendThemeChanged,
            setFitBrowserEnabled: fitBrowserApi.setFitBrowserEnabled,
            setFitBrowserFolder: fitBrowserApi.setFitBrowserFolder,
            setFullScreen: menuEventApi.setFullScreen,
            setMainState: mainStateApi.setMainState,
            startGyazoServer: externalApi.startGyazoServer,
            stopGyazoServer: externalApi.stopGyazoServer,
            subscribeToMainState: mainStateApi.subscribeToMainState,
            unlistenFromMainState: mainStateApi.unlistenFromMainState,
            validateAPI: apiDiagnostics.validateAPI,
            writeClipboardPngDataUrl: clipboardBridge.writeClipboardPngDataUrl,
            writeClipboardText: clipboardBridge.writeClipboardText,
        };
    }

    module.exports = {
        createElectronApi,
    };
}
