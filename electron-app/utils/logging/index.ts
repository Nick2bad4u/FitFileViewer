import {
    getErrorInfo as getErrorInfoImpl,
    type ErrorInfo,
} from "./getErrorInfo.js";
import {
    getObjectKeysThrowAllowedForTests as getObjectKeysThrowAllowedForTestsImpl,
    logWithLevel as logWithLevelImpl,
    type LogLevel,
} from "./logWithLevel.js";

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

export function getObjectKeysThrowAllowedForTests(): boolean {
    return getObjectKeysThrowAllowedForTestsImpl();
}
