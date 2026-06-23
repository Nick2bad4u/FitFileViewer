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
