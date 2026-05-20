import { appUtilityExports } from "./globalUtilityApp.js";
import { dataUtilityExports } from "./globalUtilityData.js";
import { formattingUtilityExports } from "./globalUtilityFormatting.js";
import { renderingUtilityExports } from "./globalUtilityRendering.js";
import { themingUtilityExports } from "./globalUtilityTheming.js";
import { uiUtilityExports } from "./globalUtilityUi.js";

export const globalUtilities = Object.freeze({
    ...appUtilityExports,
    ...dataUtilityExports,
    ...formattingUtilityExports,
    ...renderingUtilityExports,
    ...themingUtilityExports,
    ...uiUtilityExports,
});

export default globalUtilities;
