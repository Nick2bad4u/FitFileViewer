/**
 * Re-exports all modules in the app/menu category with compatibility helpers
 *
 * @file Barrel Export for app/menu
 */

import * as createAppMenuModule from "./createAppMenu.js";

export * from "./createAppMenu.js";

const noopCreateAppMenu = () => {
        throw new Error("createAppMenu is not available in this environment.");
    },
    resolvedCreateAppMenu =
        createAppMenuModule?.createAppMenu ??
        createAppMenuModule?.default ??
        (typeof globalThis !== "undefined" &&
        /** @type {any} */ (globalThis).__FFV_createAppMenuExports
            ?.createAppMenu
            ? /** @type {any} */ (globalThis).__FFV_createAppMenuExports
                  .createAppMenu
            : undefined) ??
        noopCreateAppMenu;

export { resolvedCreateAppMenu as createAppMenu };

export default {
    createAppMenu: resolvedCreateAppMenu,
};
