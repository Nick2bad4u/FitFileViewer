/**
 * Utilities for producing file-system safe names and extensions while obeying
 * Electron's legacy renderer constraints (no additional dependencies).
 */

const RESERVED_FILENAME_CHARACTERS = new Set([
    ":",
    "?",
    '"',
    "*",
    "/",
    "\\",
    "<",
    ">",
    "|",
]); // Sorted for lint rules
const RESERVED_DEVICE_NAMES = new Set([
    "AUX",
    "CLOCK$",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "CON",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
    "NUL",
    "PRN",
]);

const DEFAULT_FALLBACK_BASE = "file";
const MAX_FILENAME_LENGTH = 120;
const MAX_EXTENSION_LENGTH = 16;
const PATH_SPLIT_REGEX = /[\\/]+/u;

/**
 * Builds a safe download name from an arbitrary path/label. If the source lacks
 * an extension, `defaultExtension` is appended after sanitisation. The result
 * is always safe to assign to the `download` attribute of an anchor element.
 *
 * @param {string} candidatePath - Raw file path or label suggested by the
 *   user/app.
 * @param {{ defaultExtension?: string; fallbackBase?: string }} [options]
 *
 * @returns {string}
 */
export function buildDownloadFilename(candidatePath, options = {}) {
    const { defaultExtension = "", fallbackBase = DEFAULT_FALLBACK_BASE } =
        options;
    const pathSegment = typeof candidatePath === "string" ? candidatePath : "";
    const leaf = pathSegment.split(PATH_SPLIT_REGEX).pop() ?? "";
    const dotIndex = leaf.lastIndexOf(".");

    const rawBase = dotIndex > 0 ? leaf.slice(0, dotIndex) : leaf;
    const rawExtension = dotIndex > 0 ? leaf.slice(dotIndex + 1) : "";

    const sanitizedBase = sanitizeFilenameComponent(
        rawBase || leaf,
        fallbackBase
    );
    const extensionSource = defaultExtension || rawExtension;
    const sanitizedExtension = sanitizeFileExtension(extensionSource);

    if (sanitizedExtension) {
        return `${sanitizedBase}.${sanitizedExtension}`;
    }
    return sanitizedBase;
}

/**
 * Normalises file extensions by removing leading dots/whitespace and any
 * characters that are not alphanumeric, dashes or underscores. Extensions are
 * lower-cased for consistency.
 *
 * @param {string} extension - Raw file extension (with or without leading dot).
 * @param {string} [fallback=""] - Optional fallback extension when sanitisation
 *   empties the value. Default is `""`
 *
 * @returns {string} A safe extension without leading dots. Empty string when
 *   sanitisation fails.
 */
export function sanitizeFileExtension(extension, fallback = "") {
    if (typeof extension !== "string" || extension.length === 0) {
        if (!fallback || fallback === extension) {
            return "";
        }
        return sanitizeFileExtension(fallback, "");
    }

    let normalised = extension.normalize("NFKC").toLowerCase();
    normalised = normalised.replaceAll(/^[.\s]+/gu, "");
    normalised = normalised.replaceAll(/[^a-z0-9_-]+/gu, "");

    if (!normalised) {
        if (!fallback || fallback === extension) {
            return "";
        }
        return sanitizeFileExtension(fallback, "");
    }

    return [...normalised].slice(0, MAX_EXTENSION_LENGTH).join("");
}

/**
 * Safely transforms an arbitrary string into a file-system friendly segment.
 * Reserved Windows characters, ASCII control codes (0x00-0x1F), trailing dots
 * and leading periods are stripped. Whitespace collapses to single
 * underscores.
 *
 * @param {string} value - Original label that needs to become file-name safe.
 * @param {string} [fallback="file"] - Replacement when the input sanitises to
 *   nothing. Default is `"file"`
 *
 * @returns {string} Sanitised file name component without an extension.
 */
export function sanitizeFilenameComponent(
    value,
    fallback = DEFAULT_FALLBACK_BASE
) {
    return sanitiseFilenameInternal(value, fallback, 0);
}

/**
 * Internal helper that performs the heavy lifting for name sanitisation. A
 * recursion guard is included so malicious inputs cannot cause stack growth.
 *
 * @param {unknown} value - Raw value to sanitise.
 * @param {string} fallback - Fallback value when the primary input yields
 *   nothing.
 * @param {number} depth - Recursion depth guard.
 *
 * @returns {string}
 */
function sanitiseFilenameInternal(value, fallback, depth) {
    if (depth > 3) {
        return DEFAULT_FALLBACK_BASE;
    }

    if (typeof value !== "string" || value.length === 0) {
        if (!fallback || fallback === value) {
            return DEFAULT_FALLBACK_BASE;
        }
        return sanitiseFilenameInternal(
            fallback,
            DEFAULT_FALLBACK_BASE,
            depth + 1
        );
    }

    let normalised = "";
    for (const char of value.normalize("NFKC")) {
        const codePoint = char.codePointAt(0);
        if (codePoint === undefined) {
            continue;
        }
        if (codePoint <= 31 || RESERVED_FILENAME_CHARACTERS.has(char)) {
            normalised += "_";
            continue;
        }
        normalised += char;
    }

    let compacted = normalised.trim();
    compacted = compacted.replaceAll(/\s+/gu, "_");
    compacted = compacted.replaceAll(/_+/gu, "_");
    compacted = compacted.replaceAll(/^_+|_+$/gu, "");
    compacted = compacted.replaceAll(/^\.+/gu, "");
    compacted = compacted.replaceAll(/\.+$/gu, "");

    if (!compacted) {
        if (!fallback || fallback === value) {
            return DEFAULT_FALLBACK_BASE;
        }
        return sanitiseFilenameInternal(
            fallback,
            DEFAULT_FALLBACK_BASE,
            depth + 1
        );
    }

    if (RESERVED_DEVICE_NAMES.has(compacted.toUpperCase())) {
        compacted = `${compacted}_file`;
    }

    const limited = [...compacted].slice(0, MAX_FILENAME_LENGTH).join("");
    return limited || DEFAULT_FALLBACK_BASE;
}

export const __TESTING_INTERNALS__ = {
    RESERVED_DEVICE_NAMES,
    RESERVED_FILENAME_CHARACTERS,
};
