/* eslint-disable no-barrel-files/no-barrel-files -- Stable debug category entry point for existing runtime imports. */
/**
 * Re-exports all modules in the debug category.
 */
import * as debugChartFormatting from "./debugChartFormatting.js";
import * as debugSensorInfo from "./debugSensorInfo.js";
import * as lastAnimationLog from "./lastAnimLog.js";
import * as stateDevTools from "./stateDevTools.js";

export * from "./debugChartFormatting.js";
export * from "./debugSensorInfo.js";
export * from "./lastAnimLog.js";
export * from "./stateDevTools.js";

export default {
    ...debugChartFormatting,
    ...debugSensorInfo,
    ...lastAnimationLog,
    ...stateDevTools,
};
/* eslint-enable no-barrel-files/no-barrel-files */
