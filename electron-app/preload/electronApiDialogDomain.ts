type ElectronDialogApi = import("../shared/preloadApi").ElectronDialogApi;
type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;

export function createElectronApiDialogDomain({
    openFile,
    openFileDialog,
    openFolderDialog,
    openOverlayDialog,
}: Pick<
    ElectronApiFactoryOptions,
    "openFile" | "openFileDialog" | "openFolderDialog" | "openOverlayDialog"
>): ElectronDialogApi {
    return {
        openFile,
        openFileDialog,
        openFolderDialog,
        openOverlayDialog,
    };
}
