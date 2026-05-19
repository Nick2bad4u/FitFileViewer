/**
 * Safely extracts a message and optional stack from an unknown thrown value.
 *
 * @param err - Unknown thrown value.
 *
 * @returns Normalized error information.
 */
export function getErrorInfo(err) {
    if (err && typeof err === "object") {
        const errorRecord = err;
        const message = typeof errorRecord["message"] === "string"
            ? errorRecord["message"]
            : String(err);
        const stack = typeof errorRecord["stack"] === "string"
            ? errorRecord["stack"]
            : undefined;
        return stack === undefined ? { message } : { message, stack };
    }
    return { message: String(err) };
}
