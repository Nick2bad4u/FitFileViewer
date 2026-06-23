type ElectronClipboardApi = import("../shared/preloadApi").ElectronClipboardApi;
type ElectronApiFactoryOptions =
    import("./electronApiFactoryOptions").ElectronApiFactoryOptions;

export function createElectronApiClipboardDomain({
    clipboardBridge,
}: Pick<ElectronApiFactoryOptions, "clipboardBridge">): ElectronClipboardApi {
    return {
        writeClipboardPngDataUrl: clipboardBridge.writeClipboardPngDataUrl,
        writeClipboardText: clipboardBridge.writeClipboardText,
    };
}
