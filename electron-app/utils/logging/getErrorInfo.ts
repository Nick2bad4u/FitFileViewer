/**
 * Structured error information used by logging and user-facing diagnostics.
 */
export type ErrorInfo = {
    message: string;
    stack?: string;
};

function getStringProperty(value: object, key: "message" | "stack"): string | undefined {
    if (!(key in value)) {
        return undefined;
    }

    const property = value[key as keyof typeof value];
    return typeof property === "string" ? property : undefined;
}

/**
 * Safely extracts a message and optional stack from an unknown thrown value.
 *
 * @param err - Unknown thrown value.
 *
 * @returns Normalized error information.
 */
export function getErrorInfo(err: unknown): ErrorInfo {
    if (err && typeof err === "object") {
        const message = getStringProperty(err, "message") ?? String(err);
        const stack = getStringProperty(err, "stack");

        return stack === undefined ? { message } : { message, stack };
    }

    return { message: String(err) };
}
