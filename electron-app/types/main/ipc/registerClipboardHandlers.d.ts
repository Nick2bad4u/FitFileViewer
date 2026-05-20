export interface ClipboardWriter {
    writeText?: (text: string) => void;
    writeImage?: (image: unknown) => void;
}

export interface NativeImageFactory {
    createFromDataURL?: (dataUrl: string) => unknown;
}

export type RegisterClipboardIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => unknown;

export type RegisterClipboardIpcHandle = (
    channel: string,
    handler: RegisterClipboardIpcHandler
) => void;

export type LogWithContext = (
    level: "error" | "warn" | "info",
    message: string,
    context?: Record<string, unknown>
) => void;

export interface RegisterClipboardHandlersOptions {
    registerIpcHandle: RegisterClipboardIpcHandle;
    clipboardRef?: () => ClipboardWriter | null | undefined;
    nativeImageRef?: () => NativeImageFactory | null | undefined;
    logWithContext?: LogWithContext;
}

/**
 * Registers IPC handlers that write to the OS clipboard.
 */
export function registerClipboardHandlers(
    options: RegisterClipboardHandlersOptions
): void;
