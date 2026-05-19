const CHUNK_SIZE = 0x80_00; // 32KB chunks to prevent stack overflow

/**
 * Converts an ArrayBuffer to a Base64-encoded string. Uses chunked processing
 * to handle large buffers efficiently and avoid stack overflow.
 *
 * @example
 *     // Convert FIT file buffer to base64
 *     const base64String = convertArrayBufferToBase64(fitFileBuffer);
 *
 * @param buffer - The ArrayBuffer to convert.
 * @returns The Base64-encoded string representation of the input buffer.
 * @throws TypeError If buffer is not an ArrayBuffer.
 */
export function convertArrayBufferToBase64(buffer: ArrayBuffer): string {
    if (!(buffer instanceof ArrayBuffer)) {
        throw new TypeError(`Expected ArrayBuffer, received ${typeof buffer}`);
    }

    if (buffer.byteLength === 0) {
        return "";
    }

    const binaryChunks: string[] = [],
        bytes = new Uint8Array(buffer);

    for (let index = 0; index < bytes.length; index += CHUNK_SIZE) {
        const chunk = bytes.subarray(index, index + CHUNK_SIZE),
            chunkString = String.fromCodePoint(...chunk);
        binaryChunks.push(chunkString);
    }

    const binaryString = binaryChunks.join("");
    return btoa(binaryString);
}
