/**
 * Re-exports all modules in the app/menu category with compatibility helpers
 *
 * @file Barrel Export for app/menu
 */

import * as createAppMenuModule from "./createAppMenu.js";

export * from "./createAppMenu.js";

/** @typedef {(...args: unknown[]) => unknown} CreateAppMenuCallable */
/**
 * @typedef {typeof globalThis & {
 *     __FFV_createAppMenuExports?: { createAppMenu?: unknown };
 * }} AppMenuGlobal
 */

/**
 * @returns {CreateAppMenuCallable | undefined}
 */
function getGlobalCreateAppMenu() {
    const appGlobal = /** @type {AppMenuGlobal} */ (globalThis);
    const candidate = appGlobal.__FFV_createAppMenuExports?.createAppMenu;
    return typeof candidate === "function"
        ? /** @type {CreateAppMenuCallable} */ (candidate)
        : undefined;
}

const noopCreateAppMenu = () => {
        throw new Error("createAppMenu is not available in this environment.");
    },
    moduleCreateAppMenu =
        createAppMenuModule?.createAppMenu ?? createAppMenuModule?.default,
    resolvedCreateAppMenu =
        (typeof moduleCreateAppMenu === "function"
            ? moduleCreateAppMenu
            : undefined) ??
        getGlobalCreateAppMenu() ??
        noopCreateAppMenu;

export { resolvedCreateAppMenu as createAppMenu };

export default {
    createAppMenu: resolvedCreateAppMenu,
};
