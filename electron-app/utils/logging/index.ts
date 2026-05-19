import {
    getErrorInfo as getErrorInfoImpl,
    type ErrorInfo,
} from "./getErrorInfo.js";
import { logWithLevel as logWithLevelImpl } from "./logWithLevel.js";
import type { LogLevel } from "./logWithLevel.js";

/**
 * Extracts normalized error information.
 *
 * @param err - Unknown thrown value.
 *
 * @returns Normalized error information.
 */
export function getErrorInfo(err: unknown): ErrorInfo {
    return getErrorInfoImpl(err);
}

/**
 * Logs a timestamped FitFileViewer message.
 *
 * @param level - Console level.
 * @param message - Message to log.
 * @param context - Optional context payload.
 */
export function logWithLevel(
    level: LogLevel | string,
    message: string,
    context?: Record<string, unknown> | null
): void {
    logWithLevelImpl(level, message, context);
}

/**
 * Namespace default keeps compatibility with existing default imports.
 */
export default {
    getErrorInfo,
    logWithLevel,
};
