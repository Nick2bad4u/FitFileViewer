import { createAppMenu as resolvedCreateAppMenu } from "./createAppMenu.js";

export { createAppMenu } from "./createAppMenu.js";

/**
 * Creates and installs the Electron application menu.
 */
export default {
    createAppMenu: resolvedCreateAppMenu,
};
