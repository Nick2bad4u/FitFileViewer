/**
 * Builds a safe download name from an arbitrary path/label. If the source lacks
 * an extension, `defaultExtension` is appended after sanitisation. The result is
 * always safe to assign to the `download` attribute of an anchor element.
 *
 * @param {string} candidatePath - Raw file path or label suggested by the user/app.
 * @param {{ defaultExtension?: string, fallbackBase?: string }} [options]
 * @returns {string}
 */
export function buildDownloadFilename(candidatePath: string, options?: {
    defaultExtension?: string;
    fallbackBase?: string;
}): string;
/**
 * Normalises file extensions by removing leading dots/whitespace and any
 * characters that are not alphanumeric, dashes or underscores. Extensions are
 * lower-cased for consistency.
 *
 * @param {string} extension - Raw file extension (with or without leading dot).
 * @param {string} [fallback=""] - Optional fallback extension when sanitisation empties the value.
 * @returns {string} A safe extension without leading dots. Empty string when sanitisation fails.
 */
export function sanitizeFileExtension(extension: string, fallback?: string): string;
/**
 * Safely transforms an arbitrary string into a file-system friendly segment.
 * Reserved Windows characters, ASCII control codes (0x00-0x1F), trailing dots
 * and leading periods are stripped. Whitespace collapses to single underscores.
 *
 * @param {string} value - Original label that needs to become file-name safe.
 * @param {string} [fallback="file"] - Replacement when the input sanitises to nothing.
 * @returns {string} Sanitised file name component without an extension.
 */
export function sanitizeFilenameComponent(value: string, fallback?: string): string;
export namespace __TESTING_INTERNALS__ {
    export { RESERVED_DEVICE_NAMES };
    export { RESERVED_FILENAME_CHARACTERS };
}
declare const RESERVED_DEVICE_NAMES: Set<string>;
/**
 * Utilities for producing file-system safe names and extensions while obeying
 * Electron's legacy renderer constraints (no additional dependencies).
 */
declare const RESERVED_FILENAME_CHARACTERS: Set<string>;
export {};
//# sourceMappingURL=sanitizeFilename.d.ts.map