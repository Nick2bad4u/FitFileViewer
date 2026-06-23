type ElectronAPI = import("../shared/preloadApi").ElectronAPI;
type PreloadApiAssemblyContext =
    import("./preloadModuleTypes").PreloadApiAssemblyContext;
type PreloadDialogApiDomain =
    import("./preloadModuleTypes").PreloadDialogApiDomain;

export function createPreloadDialogApiDomain({
    constants,
    createSafeInvokeHandler,
}: PreloadApiAssemblyContext): PreloadDialogApiDomain {
    return {
        openFolderDialog: createSafeInvokeHandler(
            constants.CHANNELS.DIALOG_OPEN_FOLDER,
            "openFolderDialog"
        ) as ElectronAPI["openFolderDialog"],
    };
}
