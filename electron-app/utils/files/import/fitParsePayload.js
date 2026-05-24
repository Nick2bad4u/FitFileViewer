/** Return a named FIT message row collection using a typed indexed access. */
export function getFitMessageRows(data, messageName) {
    return data[messageName] ?? [];
}
/** Extract a parser failure from either direct or wrapped FIT parse payloads. */
export function getFitParseErrorMessage(result) {
    const errorPayload = isFitDecodeErrorPayload(result)
        ? result
        : isFitParseEnvelope(result) && isFitDecodeErrorPayload(result.data)
            ? result.data
            : undefined;
    if (errorPayload) {
        return formatFitParseError(errorPayload.error, errorPayload.details);
    }
    if (isFitParseEnvelope(result) && typeof result.error === "string") {
        return formatFitParseError(result.error, result.details);
    }
    return null;
}
/** Count decoded sessions defensively for debug logging. */
export function getFitMessagesSessionCount(data) {
    return Math.max(getFitMessageRows(data, "sessionMesgs").length, getFitMessageRows(data, "sessions").length, getFitMessageRows(data, "session").length);
}
/**
 * Return decoded FIT messages or throw for parser error payloads.
 *
 * @throws Error when the parser returned a FIT decode error payload.
 * @throws TypeError when the parser returned a non-object payload.
 */
export function unwrapFitParseMessages(result) {
    const parseErrorMessage = getFitParseErrorMessage(result);
    if (parseErrorMessage) {
        throw new Error(parseErrorMessage.display);
    }
    if (isFitParseEnvelope(result) && isFitMessages(result.data)) {
        return result.data;
    }
    if (isFitMessages(result)) {
        return result;
    }
    throw new TypeError("Invalid FIT parse result");
}
function formatFitParseError(error, details) {
    const detailText = formatErrorDetails(details);
    const display = detailText ? `${error}\n${detailText}` : error;
    return { display, summary: error };
}
function formatErrorDetails(details) {
    if (details === undefined || details === null || details === "") {
        return "";
    }
    if (typeof details === "string") {
        return details;
    }
    try {
        return JSON.stringify(details);
    }
    catch {
        return String(details);
    }
}
function isFitDecodeErrorPayload(value) {
    return (isPlainRecord(value) &&
        typeof value.error === "string");
}
function isFitMessages(value) {
    return isPlainRecord(value) && Object.values(value).every(isFitMessageRows);
}
function isFitMessageRows(value) {
    return Array.isArray(value) && value.every(isPlainRecord);
}
function isFitParseEnvelope(value) {
    return isPlainRecord(value);
}
function isPlainRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
