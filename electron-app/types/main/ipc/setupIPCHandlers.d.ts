import type { BrowserWindow } from "electron";

/**
 * Registers all IPC handlers for the main process. The structure mirrors the
 * legacy implementation but lives in a dedicated module to keep main.js lean.
 */
export function setupIPCHandlers(
    mainWindow?: BrowserWindow | null
): void;
