/**
 * Configures electron-updater for the application, wiring all event handlers to relay progress to
 * the renderer. The logic matches the historic main.js implementation so behaviour and logging stay
 * consistent.
 *
 * @param {any} mainWindow - BrowserWindow receiving updater events.
 * @param {any} [providedAutoUpdater] - Optional pre-resolved autoUpdater (used by tests).
 */
export function setupAutoUpdater(mainWindow: any, providedAutoUpdater?: any): void;
//# sourceMappingURL=setupAutoUpdater.d.ts.map