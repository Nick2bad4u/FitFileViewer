import { getErrorInfo as getErrorInfoImpl } from "./getErrorInfo.js";
import { logWithLevel as logWithLevelImpl } from "./logWithLevel.js";
/**
 * Extracts normalized error information.
 *
 * @param err - Unknown thrown value.
 *
 * @returns Normalized error information.
 */
export function getErrorInfo(err) {
    return getErrorInfoImpl(err);
}
/**
 * Logs a timestamped FitFileViewer message.
 *
 * @param level - Console level.
 * @param message - Message to log.
 * @param context - Optional context payload.
 */
export function logWithLevel(level, message, context) {
    logWithLevelImpl(level, message, context);
}
/**
 * Namespace default keeps compatibility with existing default imports.
 */
export default {
    getErrorInfo,
    logWithLevel,
};
