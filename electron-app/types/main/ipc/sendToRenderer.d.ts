import type { BrowserWindow } from "electron";

/**
 * Sends an IPC message to the renderer only when the target window is still
 * usable.
 */
export function sendToRenderer(
    win: BrowserWindow | null | undefined,
    channel: string,
    ...args: unknown[]
): void;
