type ElectronDialogApi = import("../shared/preloadApi").ElectronDialogApi;
type PreloadApiAssemblyContext =
    import("./preloadModuleTypes").PreloadApiAssemblyContext;
type PreloadDialogApiDomain =
    import("./preloadModuleTypes").PreloadDialogApiDomain;

export function createPreloadDialogApiDomain({
    constants,
    createSafeInvokeHandler,
}: PreloadApiAssemblyContext): PreloadDialogApiDomain {
    const openFile: ElectronDialogApi["openFile"] = createSafeInvokeHandler(
        constants.CHANNELS.DIALOG_OPEN_FILE,
        "openFile"
    );

    return {
        openFile,
        openFileDialog: openFile,
        openFolderDialog: createSafeInvokeHandler(
            constants.CHANNELS.DIALOG_OPEN_FOLDER,
            "openFolderDialog"
        ),
        openOverlayDialog: createSafeInvokeHandler(
            constants.CHANNELS.DIALOG_OPEN_OVERLAY_FILES,
            "openOverlayDialog"
        ),
    };
}
