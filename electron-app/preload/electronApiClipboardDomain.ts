type ElectronClipboardApi = import("../shared/preloadApi").ElectronClipboardApi;

export interface ElectronApiClipboardDomainOptions {
    clipboardBridge: ElectronClipboardApi;
}

export function createElectronApiClipboardDomain({
    clipboardBridge,
}: ElectronApiClipboardDomainOptions): ElectronClipboardApi {
    return {
        writeClipboardPngDataUrl: clipboardBridge.writeClipboardPngDataUrl,
        writeClipboardText: clipboardBridge.writeClipboardText,
    };
}
