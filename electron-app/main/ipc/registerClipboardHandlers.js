const { z } = require("zod");

// Keep payload limits conservative to defend against accidental huge clipboard writes.
// CSV exports can be large, so we allow several MB.
const MAX_TEXT_CHARS = 5_000_000;
const MAX_DATA_URL_CHARS = 25_000_000;

const textSchema = z
    .string()
    .max(MAX_TEXT_CHARS)
    .transform((value) => value);

const pngDataUrlSchema = z
    .string()
    .max(MAX_DATA_URL_CHARS)
    .refine((value) => value.startsWith("data:image/png"), {
        message: "Expected a PNG data URL",
    });

/**
 * Registers IPC handlers that write to the OS clipboard.
 *
 * Why IPC is required:
 * FitFileViewer uses `sandbox: true` renderers. In sandboxed renderers, the preload script
 * cannot reliably access Electron's `clipboard` / `nativeImage` modules directly.
 * Therefore, clipboard writes must be performed in the main process.
 *
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => any} options.clipboardRef
 * @param {() => any} options.nativeImageRef
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 */
function registerClipboardHandlers({ registerIpcHandle, clipboardRef, nativeImageRef, logWithContext }) {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    registerIpcHandle("clipboard:writeText", async (_event, text) => {
        try {
            const parsed = textSchema.safeParse(String(text));
            if (!parsed.success) {
                return false;
            }

            const clipboard = clipboardRef?.();
            if (!clipboard || typeof clipboard.writeText !== "function") {
                return false;
            }

            clipboard.writeText(parsed.data);
            return true;
        } catch (error) {
            logWithContext?.("warn", "clipboard:writeText failed", {
                error: /** @type {Error} */ (error)?.message,
            });
            return false;
        }
    });

    registerIpcHandle("clipboard:writePngDataUrl", async (_event, pngDataUrl) => {
        try {
            const parsed = pngDataUrlSchema.safeParse(String(pngDataUrl));
            if (!parsed.success) {
                return false;
            }

            const clipboard = clipboardRef?.();
            const nativeImage = nativeImageRef?.();
            if (!clipboard || typeof clipboard.writeImage !== "function") {
                return false;
            }
            if (!nativeImage || typeof nativeImage.createFromDataURL !== "function") {
                return false;
            }

            const image = nativeImage.createFromDataURL(parsed.data);
            clipboard.writeImage(image);
            return true;
        } catch (error) {
            logWithContext?.("warn", "clipboard:writePngDataUrl failed", {
                error: /** @type {Error} */ (error)?.message,
            });
            return false;
        }
    });
}

module.exports = { registerClipboardHandlers };
