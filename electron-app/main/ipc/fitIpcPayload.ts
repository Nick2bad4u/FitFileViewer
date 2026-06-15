type NodeBuffer = Buffer;

/** Maximum supported FIT payload size accepted over main-process IPC. */
export const MAX_FIT_IPC_PAYLOAD_BYTES = 100 * 1024 * 1024;

/**
 * Asserts that a FIT IPC payload length is finite, non-negative, and below the
 * renderer-driven memory cap.
 *
 * @throws TypeError when the byte length is not finite or is negative.
 * @throws Error when the byte length exceeds the FIT IPC payload cap.
 */
function assertFitIpcPayloadSize(byteLength: number): void {
    if (!Number.isFinite(byteLength) || byteLength < 0) {
        throw new TypeError("Invalid FIT data: expected a finite byte length");
    }

    if (byteLength > MAX_FIT_IPC_PAYLOAD_BYTES) {
        throw new Error("File size exceeds 100MB limit");
    }
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
    return (
        value instanceof ArrayBuffer ||
        Object.prototype.toString.call(value) === "[object ArrayBuffer]"
    );
}

function isArrayBufferView(value: unknown): value is ArrayBufferView {
    return (
        typeof value === "object" &&
        value !== null &&
        ArrayBuffer.isView(value) &&
        isArrayBuffer(value.buffer)
    );
}

/**
 * Normalizes renderer-provided FIT IPC payloads into a Node Buffer.
 *
 * Electron usually transports FIT file bytes as ArrayBuffer. Supporting
 * ArrayBufferView keeps the boundary robust if a caller sends a typed view,
 * while still rejecting unrelated shapes before they reach the decoder.
 *
 * @throws TypeError when the payload is not an ArrayBuffer or ArrayBufferView.
 * @throws Error when the payload exceeds the FIT IPC payload cap.
 */
export function normalizeFitIpcPayloadToBuffer(value: unknown): NodeBuffer {
    if (isArrayBuffer(value)) {
        assertFitIpcPayloadSize(value.byteLength);
        return Buffer.from(value);
    }

    if (isArrayBufferView(value)) {
        assertFitIpcPayloadSize(value.byteLength);
        return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    }

    throw new TypeError("Invalid FIT data: expected ArrayBuffer");
}

export default {
    MAX_FIT_IPC_PAYLOAD_BYTES,
    normalizeFitIpcPayloadToBuffer,
};
