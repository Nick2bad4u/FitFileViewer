/**
 * Builds and sets the application menu for the Electron app.
 * The menu includes File, Edit, View, Window, and Settings menus, with support for opening files,
 * displaying a list of recent files, and standard menu roles.
 *
 * @param {Electron.BrowserWindow} mainWindow - The main application window to which menu actions are dispatched.
 * @param {string} [currentTheme=null] - The current theme of the application, used to set the checked state of theme radio buttons.
 * @param {string|null} [loadedFitFilePath=null] - The path of the loaded FIT file, used to enable/disable the Summary Columns menu item.
 */
export function createAppMenu(
    mainWindow: Electron.BrowserWindow,
    currentTheme?: string,
    loadedFitFilePath?: string | null
): void;
//# sourceMappingURL=createAppMenu.d.ts.map
