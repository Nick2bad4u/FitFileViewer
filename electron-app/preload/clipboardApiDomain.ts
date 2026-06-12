type PreloadApiAssemblyContext =
    import("./preloadModuleTypes").PreloadApiAssemblyContext;
type PreloadClipboardApiDomain =
    import("./preloadModuleTypes").PreloadClipboardApiDomain;

export function createPreloadClipboardApiDomain({
    constants,
    ipcRenderer,
    modules,
    preloadLog,
}: PreloadApiAssemblyContext): PreloadClipboardApiDomain {
    const { createClipboardBridge } = modules;

    return {
        clipboardBridge: createClipboardBridge({
            channels: constants.CHANNELS,
            ipcRenderer,
            preloadLog,
        }),
    };
}
