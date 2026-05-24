function getStringProperty(value, key) {
    if (!(key in value)) {
        return undefined;
    }
    const property = value[key];
    return typeof property === "string" ? property : undefined;
}
/**
 * Safely extracts a message and optional stack from an unknown thrown value.
 *
 * @param err - Unknown thrown value.
 *
 * @returns Normalized error information.
 */
export function getErrorInfo(err) {
    if (err && typeof err === "object") {
        const message = getStringProperty(err, "message") ?? String(err);
        const stack = getStringProperty(err, "stack");
        return stack === undefined ? { message } : { message, stack };
    }
    return { message: String(err) };
}
