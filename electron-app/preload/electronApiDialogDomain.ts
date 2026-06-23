type ElectronDialogApi = import("../shared/preloadApi").ElectronDialogApi;
type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;

export function createElectronApiDialogDomain({
    openFolderDialog,
}: Pick<ElectronApiFactoryOptions, "openFolderDialog">): ElectronDialogApi {
    return {
        openFolderDialog,
    };
}
