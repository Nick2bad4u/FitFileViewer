/**
 * Lazily creates the application menu. The helper is intentionally defensive so
 * unit tests that run without a real Electron runtime do not crash when the
 * menu builder is required.
 *
 * @param {any} mainWindow - Target BrowserWindow instance.
 * @param {string} theme - Currently active theme.
 * @param {string | undefined | null} loadedFitFilePath - Path of the currently
 *   loaded FIT file.
 */
export function safeCreateAppMenu(
    mainWindow: any,
    theme: string,
    loadedFitFilePath: string | undefined | null
): void;
