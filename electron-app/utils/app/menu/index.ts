/**
 * Re-exports modules in the app/menu category with compatibility helpers.
 */

const createAppMenuModule = require("./createAppMenu.js") as {
    createAppMenu?: unknown;
};

type CreateAppMenuCallable = (
    mainWindow?: unknown,
    currentTheme?: null | string,
    loadedFitFilePath?: null | string
) => void;

type AppMenuGlobal = typeof globalThis & {
    __FFV_createAppMenuExports?: { createAppMenu?: unknown };
};

function getGlobalCreateAppMenu(): CreateAppMenuCallable | undefined {
    const candidate = (globalThis as AppMenuGlobal).__FFV_createAppMenuExports
        ?.createAppMenu;
    return typeof candidate === "function"
        ? (candidate as CreateAppMenuCallable)
        : undefined;
}

function getImportedCreateAppMenu(): CreateAppMenuCallable | undefined {
    const candidate: unknown = Reflect.get(
        createAppMenuModule,
        "createAppMenu"
    );
    return typeof candidate === "function"
        ? (candidate as CreateAppMenuCallable)
        : undefined;
}

const noopCreateAppMenu: CreateAppMenuCallable = () => {
    throw new Error("createAppMenu is not available in this environment.");
};

const resolvedCreateAppMenu =
    getImportedCreateAppMenu() ?? getGlobalCreateAppMenu() ?? noopCreateAppMenu;

/**
 * Creates and installs the Electron application menu when the legacy bridge is
 * available.
 */
export const createAppMenu = resolvedCreateAppMenu;

export default {
    createAppMenu: resolvedCreateAppMenu,
};
