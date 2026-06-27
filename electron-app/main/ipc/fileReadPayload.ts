/** Maximum supported FIT file size accepted by main-process file reads. */
export const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024;

/**
 * Asserts that a FIT file byte length is finite, non-negative, and below the
 * main-process file read cap.
 *
 * @throws TypeError when the byte length is not finite or is negative.
 * @throws Error when the byte length exceeds the FIT file cap.
 */
export function assertFitFileByteLength(byteLength: number): void {
    if (!Number.isFinite(byteLength) || byteLength < 0) {
        throw new TypeError("Invalid FIT data: expected a finite byte length");
    }

    if (byteLength > MAX_FIT_FILE_BYTES) {
        throw new Error("File size exceeds 100MB limit");
    }
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
    return (
        value instanceof ArrayBuffer ||
        Object.prototype.toString.call(value) === "[object ArrayBuffer]"
    );
}

function isArrayBufferViewWithArrayBuffer(
    value: unknown
): value is ArrayBufferView & { buffer: ArrayBuffer } {
    return (
        typeof value === "object" &&
        value !== null &&
        ArrayBuffer.isView(value) &&
        isArrayBuffer(value.buffer)
    );
}

/**
 * Normalizes a binary `fs.readFile` result into the exact ArrayBuffer that
 * should be returned to the renderer.
 *
 * Node Buffers and Uint8Arrays often share a larger backing ArrayBuffer.
 * Slicing by byteOffset/byteLength avoids leaking unrelated backing bytes
 * across the IPC boundary.
 *
 * @throws Error when the file read result is not binary data or exceeds the FIT
 *   file cap.
 */
export function normalizeFileReadResultToArrayBuffer(
    value: unknown
): ArrayBuffer {
    if (isArrayBuffer(value)) {
        assertFitFileByteLength(value.byteLength);
        const clone = new ArrayBuffer(value.byteLength);
        new Uint8Array(clone).set(new Uint8Array(value));
        return clone;
    }

    if (!isArrayBufferViewWithArrayBuffer(value)) {
        throw new Error("Unexpected file read result");
    }

    assertFitFileByteLength(value.byteLength);
    return value.buffer.slice(
        value.byteOffset,
        value.byteOffset + value.byteLength
    );
}
