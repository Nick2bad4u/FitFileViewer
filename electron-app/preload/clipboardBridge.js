"use strict";
{
    function createClipboardBridge({ channels, ipcRenderer, preloadLog }) {
        async function writeClipboardPngDataUrl(pngDataUrl) {
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
        async function writeClipboardText(text) {
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
    module.exports = {
        createClipboardBridge,
    };
}
