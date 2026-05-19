/**
 * Structured error information used by logging and user-facing diagnostics.
 */
export type ErrorInfo = {
    message: string;
    stack?: string;
};

/**
 * Safely extracts a message and optional stack from an unknown thrown value.
 *
 * @param err - Unknown thrown value.
 *
 * @returns Normalized error information.
 */
export function getErrorInfo(err: unknown): ErrorInfo {
    if (err && typeof err === "object") {
        const errorRecord = err as Record<string, unknown>;
        const message =
            typeof errorRecord["message"] === "string"
                ? errorRecord["message"]
                : String(err);
        const stack =
            typeof errorRecord["stack"] === "string"
                ? errorRecord["stack"]
                : undefined;

        return stack === undefined ? { message } : { message, stack };
    }

    return { message: String(err) };
}
