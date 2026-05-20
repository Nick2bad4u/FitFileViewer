/* eslint-disable no-barrel-files/no-barrel-files -- Mirrors the debug barrel module's public declaration surface. */

import * as debugChartFormatting from "./debugChartFormatting.js";
import * as debugSensorInfo from "./debugSensorInfo.js";
import * as lastAnimationLog from "./lastAnimLog.js";
import * as stateDevTools from "./stateDevTools.js";
export {
    testFaveroCase,
    testFaveroStringCase,
    testNewFormatting,
} from "./debugChartFormatting.js";
export type {
    SensorAnalysis,
    SensorEntry,
    SensorIssue,
} from "./debugSensorInfo.js";
export {
    checkDataAvailability,
    debugSensorInfo,
    showDataKeys,
    showSensorNames,
    testManufacturerId,
    testProductId,
} from "./debugSensorInfo.js";
export {
    criticalAnimLog,
    perfAnimLog,
    throttledAnimLog,
} from "./lastAnimLog.js";
export type {
    ErrorRecord,
    MemoryUsageRecord,
    PerformanceMetrics,
    SlowOperationRecord,
    SnapshotComparison,
    SnapshotDiffStateChange,
    StateSnapshot,
    ValidationResult,
} from "./stateDevTools.js";
export {
    cleanupStateDevTools,
    debugUtilities,
    initializeStateDevTools,
    measureStateOperation,
    performanceMonitor,
    withPerformanceMonitoring,
} from "./stateDevTools.js";

/** Combined debug helper exports. */
declare const debugHelpers: typeof debugChartFormatting &
    typeof debugSensorInfo &
    typeof lastAnimationLog &
    typeof stateDevTools;

export default debugHelpers;

/* eslint-enable no-barrel-files/no-barrel-files */
