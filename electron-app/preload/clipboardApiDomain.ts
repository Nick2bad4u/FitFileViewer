type PreloadApiAssemblyContext =
    import("./preloadAssemblyTypes").PreloadApiAssemblyContext;
type PreloadClipboardApiDomain =
    import("./preloadAssemblyTypes").PreloadClipboardApiDomain;

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
