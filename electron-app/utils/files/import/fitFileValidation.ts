/** Maximum supported FIT file size for renderer-side import flows. */
export const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024;

/** Runtime validation switches for FIT file buffer checks. */
export type FitFileBufferValidationOptions = {
    allowEmpty?: boolean;
    enforceMaxSize?: boolean;
};

/** Returns whether a value is the ArrayBuffer shape expected by FIT decoders. */
export function isFitFileArrayBuffer(value: unknown): value is ArrayBuffer {
    return value instanceof ArrayBuffer;
}

/** Returns a user-facing validation error for unsupported FIT file buffers. */
export function getFitFileBufferValidationError(
    value: unknown,
    options: FitFileBufferValidationOptions = {}
): string | null {
    if (!isFitFileArrayBuffer(value)) {
        return "Failed to read file as ArrayBuffer";
    }

    if (!options.allowEmpty && value.byteLength === 0) {
        return "Selected file appears to be empty";
    }

    if (
        options.enforceMaxSize !== false &&
        value.byteLength > MAX_FIT_FILE_BYTES
    ) {
        return "File size exceeds 100MB limit";
    }

    return null;
}
