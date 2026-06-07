import { dataUtilityExports } from "./globalUtilityData.js";
import { renderingUtilityExports } from "./globalUtilityRendering.js";
import { themingUtilityExports } from "./globalUtilityTheming.js";
import { uiUtilityExports } from "./globalUtilityUi.js";

/** All legacy utilities exposed through the global utility bridge. */
export const globalUtilities = Object.freeze({
    ...dataUtilityExports,
    ...renderingUtilityExports,
    ...themingUtilityExports,
    ...uiUtilityExports,
});

export default globalUtilities;
