type ClipboardInvokeChannel = import("../shared/ipc").ClipboardInvokeChannel;
type ClipboardRequestPayload = import("../shared/ipc").ClipboardRequestPayload;
type ClipboardResponsePayload =
    import("../shared/ipc").ClipboardResponsePayload;

type PreloadLog = (
    level: "error" | "info" | "warn",
    message: string,
    ...details: unknown[]
) => void;

interface ClipboardBridgeChannels {
    CLIPBOARD_WRITE_PNG_DATA_URL: Extract<
        ClipboardInvokeChannel,
        "clipboard:writePngDataUrl"
    >;
    CLIPBOARD_WRITE_TEXT: Extract<
        ClipboardInvokeChannel,
        "clipboard:writeText"
    >;
}

interface IpcRendererLike {
    invoke: (
        channel: ClipboardInvokeChannel,
        payload: ClipboardRequestPayload
    ) => Promise<unknown>;
}

interface ClipboardBridge {
    writeClipboardPngDataUrl: (
        pngDataUrl: ClipboardRequestPayload
    ) => Promise<ClipboardResponsePayload>;
    writeClipboardText: (
        text: ClipboardRequestPayload
    ) => Promise<ClipboardResponsePayload>;
}

interface ClipboardBridgeOptions {
    channels: ClipboardBridgeChannels;
    ipcRenderer: IpcRendererLike;
    preloadLog: PreloadLog;
}

export function createClipboardBridge({
    channels,
    ipcRenderer,
    preloadLog,
}: ClipboardBridgeOptions): ClipboardBridge {
    async function writeClipboardPngDataUrl(
        pngDataUrl: ClipboardRequestPayload
    ): Promise<ClipboardResponsePayload> {
        try {
            const ok = await ipcRenderer.invoke(
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
            const ok = await ipcRenderer.invoke(
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
