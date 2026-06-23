type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type PreloadApiAssemblyContext =
    import("./preloadModuleTypes").PreloadApiAssemblyContext;
type PreloadDialogApiDomain =
    import("./preloadModuleTypes").PreloadDialogApiDomain;

export function createPreloadDialogApiDomain({
    constants,
    createSafeInvokeHandler,
}: PreloadApiAssemblyContext): PreloadDialogApiDomain {
    const openFile = createSafeInvokeHandler(
        constants.CHANNELS.DIALOG_OPEN_FILE,
        "openFile"
    ) as ElectronAPI["openFile"];

    return {
        openFile,
        openFileDialog: openFile,
        openFolderDialog: createSafeInvokeHandler(
            constants.CHANNELS.DIALOG_OPEN_FOLDER,
            "openFolderDialog"
        ) as ElectronAPI["openFolderDialog"],
        openOverlayDialog: createSafeInvokeHandler(
            constants.CHANNELS.DIALOG_OPEN_OVERLAY_FILES,
            "openOverlayDialog"
        ) as ElectronAPI["openOverlayDialog"],
    };
}
