/**
 * Provides named exports and a namespace default export for logging helpers
 *
 * @file Barrel export for logging utilities
 */

import { getErrorInfo } from "./getErrorInfo.js";
import { logWithLevel } from "./logWithLevel.js";

export * from "./getErrorInfo.js";
export * from "./logWithLevel.js";

/**
 * Namespace default keeps compatibility with patterns like `import logging from
 * "../logging/index.js"; logging.logWithLevel(...)`.
 */
export default {
    getErrorInfo,
    logWithLevel,
};
