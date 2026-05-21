/**
 * Re-exports modules in the app/menu category with compatibility helpers.
 */
import "./createAppMenu.js";
function getGlobalCreateAppMenu() {
    const candidate = globalThis.__FFV_createAppMenuExports?.createAppMenu;
    return typeof candidate === "function" ? candidate : undefined;
}
const noopCreateAppMenu = () => {
    throw new Error("createAppMenu is not available in this environment.");
};
const resolvedCreateAppMenu = getGlobalCreateAppMenu() ?? noopCreateAppMenu;
/**
 * Creates and installs the Electron application menu when the legacy bridge is
 * available.
 */
export const createAppMenu = resolvedCreateAppMenu;
export default {
    createAppMenu: resolvedCreateAppMenu,
};
