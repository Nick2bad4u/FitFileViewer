import type {
    FitDecodeErrorPayload,
    FitDecodeResult,
    FitFieldValue,
    FitMessageRow,
    FitMessages,
} from "../../../shared/fit";

/** Parser results may arrive wrapped by legacy IPC paths. */
export type FitParseEnvelope = {
    data?: FitDecodeResult;
    details?: FitFieldValue;
    error?: string;
    success?: boolean;
} & Record<string, unknown>;

/** FIT parser payload shape accepted by renderer file-open flows. */
export type FitParsePayload = FitDecodeResult | FitParseEnvelope;

/** User-facing and error-state summaries for FIT parser failures. */
export type FitParseErrorMessage = {
    display: string;
    summary: string;
};

/** Return a named FIT message row collection using a typed indexed access. */
export function getFitMessageRows(
    data: FitMessages,
    messageName: string
): FitMessageRow[] {
    return data[messageName] ?? [];
}

/** Extract a parser failure from either direct or wrapped FIT parse payloads. */
export function getFitParseErrorMessage(
    result: FitParsePayload
): FitParseErrorMessage | null {
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
export function getFitMessagesSessionCount(data: FitMessages): number {
    return Math.max(
        getFitMessageRows(data, "sessionMesgs").length,
        getFitMessageRows(data, "sessions").length,
        getFitMessageRows(data, "session").length
    );
}

/**
 * Return decoded FIT messages or throw for parser error payloads.
 *
 * @throws Error when the parser returned a FIT decode error payload.
 * @throws TypeError when the parser returned a non-object payload.
 */
export function unwrapFitParseMessages(result: FitParsePayload): FitMessages {
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

function formatFitParseError(
    error: string,
    details: FitFieldValue | undefined
): FitParseErrorMessage {
    const detailText = formatErrorDetails(details);
    const display = detailText ? `${error}\n${detailText}` : error;
    return { display, summary: error };
}

function formatErrorDetails(details: FitFieldValue | undefined): string {
    if (details === undefined || details === null || details === "") {
        return "";
    }

    if (typeof details === "string") {
        return details;
    }

    try {
        return JSON.stringify(details);
    } catch {
        return String(details);
    }
}

function isFitDecodeErrorPayload(
    value: unknown
): value is FitDecodeErrorPayload {
    return isPlainRecord(value) && typeof value["error"] === "string";
}

function isFitMessages(value: unknown): value is FitMessages {
    return isPlainRecord(value) && Object.values(value).every(isFitMessageRows);
}

function isFitMessageRows(value: unknown): value is FitMessageRow[] {
    return Array.isArray(value) && value.every(isPlainRecord);
}

function isFitParseEnvelope(value: FitParsePayload): value is FitParseEnvelope {
    return isPlainRecord(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
