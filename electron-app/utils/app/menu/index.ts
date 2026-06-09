type CreateAppMenuCallable = (
    mainWindow?: unknown,
    currentTheme?: null | string,
    loadedFitFilePath?: null | string
) => void;

const createAppMenuModule = require("./createAppMenu.js") as {
    createAppMenu: CreateAppMenuCallable;
};

const resolvedCreateAppMenu = createAppMenuModule.createAppMenu;

/**
 * Creates and installs the Electron application menu.
 */
export const createAppMenu = resolvedCreateAppMenu;

export default {
    createAppMenu: resolvedCreateAppMenu,
};
