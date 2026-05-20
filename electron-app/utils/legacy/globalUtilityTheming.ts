import {
    applyTheme,
    listenForThemeChange,
    loadTheme,
} from "../theming/core/theme.js";
import { updateMapTheme } from "../theming/specific/updateMapTheme.js";

/** Legacy theming utilities exposed through the global utility bridge. */
export const themingUtilityExports = Object.freeze({
    applyTheme,
    listenForThemeChange,
    loadTheme,
    updateMapTheme,
});
