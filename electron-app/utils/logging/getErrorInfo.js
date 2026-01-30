/**
 * Safely extract message/stack from unknown errors
 *
 * @param {unknown} err
 *
 * @returns {{ message: string; stack?: string }}
 */
export function getErrorInfo(err) {
    if (err && typeof err === "object") {
        const anyErr = /** @type {any} */ (err),
            message =
                typeof anyErr.message === "string"
                    ? anyErr.message
                    : String(err),
            stack = typeof anyErr.stack === "string" ? anyErr.stack : undefined;
        return { message, stack };
    }
    return { message: String(err) };
}
