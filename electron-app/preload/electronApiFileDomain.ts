type ElectronDialogApi = import("../shared/preloadApi").ElectronDialogApi;
type ElectronFileApi = import("../shared/preloadApi").ElectronFileApi;
type ElectronFitBrowserApi =
    import("../shared/preloadApi").ElectronFitBrowserApi;
type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;

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
