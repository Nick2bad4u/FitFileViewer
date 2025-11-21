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
export function convertArrayBufferToBase64(buffer: ArrayBuffer): string;
//# sourceMappingURL=convertArrayBufferToBase64.d.ts.map
