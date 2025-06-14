/**
 * Converts an ArrayBuffer to a Base64-encoded string.
 *
 * @param {ArrayBuffer} buffer - The ArrayBuffer to convert.
 * @returns {string} The Base64-encoded string representation of the input buffer.
 */
export function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const binaryChunks = [];
    const chunkSize = 0x8000; // 32k chunks to avoid stack overflow caused by large input sizes exceeding the recursion or memory limits of JavaScript engines
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        const chunkString = String.fromCharCode.apply(null, chunk);
        binaryChunks.push(chunkString);
    }
    const binaryString = binaryChunks.join("");
    return btoa(binaryString);
}
