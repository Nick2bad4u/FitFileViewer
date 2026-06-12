import { z } from "zod";

type ClipboardInvokeChannel = import("../../shared/ipc").ClipboardInvokeChannel;
type ClipboardResult = import("../../shared/ipc").ClipboardResponsePayload;

interface ClipboardWriter {
    writeImage?: (image: unknown) => void;
    writeText?: (text: string) => void;
}

interface NativeImageFactory {
    createFromDataURL?: (dataUrl: string) => unknown;
}

type RegisterClipboardIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => unknown;

type RegisterClipboardIpcHandle = (
    channel: ClipboardInvokeChannel,
    handler: RegisterClipboardIpcHandler
) => void;

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

interface RegisterClipboardHandlersOptions {
    clipboardRef?: () => ClipboardWriter | null | undefined;
    logWithContext?: LogWithContext;
    nativeImageRef?: () => NativeImageFactory | null | undefined;
    registerIpcHandle: RegisterClipboardIpcHandle;
}

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

// Keep payload limits conservative to defend against accidental huge
// clipboard writes. CSV exports can be large, so allow several MB.
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
 * Why IPC is required: FitFileViewer uses `sandbox: true` renderers. In
 * sandboxed renderers, the preload script cannot reliably access Electron's
 * `clipboard` / `nativeImage` modules directly. Therefore, clipboard writes
 * must be performed in the main process.
 */
export function registerClipboardHandlers({
    registerIpcHandle,
    clipboardRef,
    nativeImageRef,
    logWithContext,
}: RegisterClipboardHandlersOptions): void {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    registerIpcHandle(
        "clipboard:writeText",
        (_event, text): ClipboardResult => {
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
                    error: getErrorMessage(error),
                });
                return false;
            }
        }
    );

    registerIpcHandle(
        "clipboard:writePngDataUrl",
        (_event, pngDataUrl): ClipboardResult => {
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
                if (
                    !nativeImage ||
                    typeof nativeImage.createFromDataURL !== "function"
                ) {
                    return false;
                }

                const image = nativeImage.createFromDataURL(parsed.data);
                clipboard.writeImage(image);
                return true;
            } catch (error) {
                logWithContext?.("warn", "clipboard:writePngDataUrl failed", {
                    error: getErrorMessage(error),
                });
                return false;
            }
        }
    );
}

export default { registerClipboardHandlers };
