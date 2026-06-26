type ClipboardInvokeChannel = import("../shared/ipc").ClipboardInvokeChannel;
type ClipboardRequestPayload = import("../shared/ipc").ClipboardRequestPayload;
type ClipboardResponsePayload =
    import("../shared/ipc").ClipboardResponsePayload;
type ClipboardBridge = import("../shared/preloadApi").ElectronClipboardApi;
type CreateClipboardBridgeOptions =
    import("./preloadModuleTypes").CreateClipboardBridgeOptions;

export function createClipboardBridge({
    channels,
    ipcRenderer,
    preloadLog,
}: CreateClipboardBridgeOptions): ClipboardBridge {
    async function invokeClipboard(
        channel: ClipboardInvokeChannel,
        payload: ClipboardRequestPayload
    ): Promise<unknown> {
        if (typeof ipcRenderer?.invoke !== "function") {
            throw new TypeError("ipcRenderer.invoke unavailable");
        }
        return ipcRenderer.invoke(channel, payload);
    }

    async function writeClipboardPngDataUrl(
        pngDataUrl: ClipboardRequestPayload
    ): Promise<ClipboardResponsePayload> {
        try {
            const ok = await invokeClipboard(
                channels.CLIPBOARD_WRITE_PNG_DATA_URL,
                pngDataUrl
            );
            return Boolean(ok);
        } catch (error) {
            preloadLog(
                "error",
                "[preload.js] writeClipboardPngDataUrl failed:",
                error
            );
            return false;
        }
    }

    async function writeClipboardText(
        text: ClipboardRequestPayload
    ): Promise<ClipboardResponsePayload> {
        try {
            const ok = await invokeClipboard(
                channels.CLIPBOARD_WRITE_TEXT,
                text
            );
            return Boolean(ok);
        } catch (error) {
            preloadLog(
                "error",
                "[preload.js] writeClipboardText failed:",
                error
            );
            return false;
        }
    }

    return {
        writeClipboardPngDataUrl,
        writeClipboardText,
    };
}
