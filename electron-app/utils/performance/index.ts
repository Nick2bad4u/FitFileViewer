/* eslint-disable no-barrel-files/no-barrel-files -- Preserve the existing public performance utility entrypoint. */

/**
 * Re-exports performance monitoring utilities.
 */
export {
    PerformanceMonitor,
    performanceMonitor,
    type PerformanceTimer,
} from "./performanceMonitor.js";

/* eslint-enable no-barrel-files/no-barrel-files */
