type ElectronDialogApi = import("../shared/preloadApi").ElectronDialogApi;

export interface ElectronApiDialogDomainOptions {
    openFile: ElectronDialogApi["openFile"];
    openFileDialog: ElectronDialogApi["openFileDialog"];
    openFolderDialog: ElectronDialogApi["openFolderDialog"];
    openOverlayDialog: ElectronDialogApi["openOverlayDialog"];
}

export function createElectronApiDialogDomain({
    openFile,
    openFileDialog,
    openFolderDialog,
    openOverlayDialog,
}: ElectronApiDialogDomainOptions): ElectronDialogApi {
    return {
        openFile,
        openFileDialog,
        openFolderDialog,
        openOverlayDialog,
    };
}
