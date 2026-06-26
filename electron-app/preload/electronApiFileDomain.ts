type ElectronFileApi = import("../shared/preloadApi").ElectronFileApi;
type ElectronFitBrowserApi =
    import("../shared/preloadApi").ElectronFitBrowserApi;

export interface ElectronApiFileDomainOptions {
    fileApi: ElectronFileApi;
    fitBrowserApi: ElectronFitBrowserApi;
}

export function createElectronApiFileDomain({
    fileApi,
    fitBrowserApi,
}: ElectronApiFileDomainOptions): ElectronFileApi & ElectronFitBrowserApi {
    return {
        addRecentFile: fileApi.addRecentFile,
        approveRecentFile: fileApi.approveRecentFile,
        decodeFitFile: fileApi.decodeFitFile,
        getFitBrowserFolder: fitBrowserApi.getFitBrowserFolder,
        isFitBrowserEnabled: fitBrowserApi.isFitBrowserEnabled,
        listFitBrowserFolder: fitBrowserApi.listFitBrowserFolder,
        onFitBrowserEnabledChanged: fitBrowserApi.onFitBrowserEnabledChanged,
        parseFitFile: fileApi.parseFitFile,
        readFile: fileApi.readFile,
        recentFiles: fileApi.recentFiles,
        setFitBrowserEnabled: fitBrowserApi.setFitBrowserEnabled,
        setFitBrowserFolder: fitBrowserApi.setFitBrowserFolder,
    };
}
