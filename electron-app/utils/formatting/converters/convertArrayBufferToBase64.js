/**
 * Converts an ArrayBuffer to a Base64-encoded string.
 * Uses chunked processing to handle large buffers efficiently and avoid stack overflow.
 *
 * @param {ArrayBuffer} buffer - The ArrayBuffer to convert
 * @returns {string} The Base64-encoded string representation of the input buffer
 * @throws {TypeError} If buffer is not an ArrayBuffer
 * @example
 * // Convert FIT file buffer to base64
 * const base64String = convertArrayBufferToBase64(fitFileBuffer);
 */
export function convertArrayBufferToBase64(buffer) {
    // Input validation
    if (!(buffer instanceof ArrayBuffer)) {
        throw new TypeError(`Expected ArrayBuffer, received ${typeof buffer}`);
    }

    if (buffer.byteLength === 0) {
        return "";
    }

    const binaryChunks = [],
        bytes = new Uint8Array(buffer),
        CHUNK_SIZE = 0x80_00; // 32KB chunks to prevent stack overflow

    // Process in chunks to handle large buffers efficiently
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.subarray(i, i + CHUNK_SIZE),
            chunkString = String.fromCodePoint(...chunk);
        binaryChunks.push(chunkString);
    }

    const binaryString = binaryChunks.join("");
    return btoa(binaryString);
}
