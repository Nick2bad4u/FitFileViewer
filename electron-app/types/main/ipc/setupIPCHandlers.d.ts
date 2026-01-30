/**
 * Registers all IPC handlers for the main process. The structure mirrors the
 * legacy implementation but lives in a dedicated module to keep main.js lean.
 *
 * @param {any} mainWindow - Primary BrowserWindow instance (may be undefined in
 *   some test scenarios).
 */
export function setupIPCHandlers(mainWindow: any): void;
