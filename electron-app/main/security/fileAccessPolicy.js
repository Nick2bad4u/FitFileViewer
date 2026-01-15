const { path } = require("../runtime/nodeModules");

/**
 * In-memory allowlist for renderer-initiated file reads.
 *
 * Why this exists:
 * - `file:read` is an IPC bridge from renderer -> main.
 * - If the renderer is ever compromised (XSS, dependency bug), unrestricted file reads become
 *   an immediate local file disclosure primitive.
 *
 * Design:
 * - Only allow reading files that the application has explicitly "approved" via a trusted
 *   user flow (e.g. native file dialog selection or main-process menu action).
 * - Keep approval state in the main process only.
 *
 * Notes:
 * - This is intentionally conservative: it is better to block a read and log than to allow
 *   arbitrary filesystem access via IPC.
 */

/**
 * @typedef {{ approved: Set<string> }} FileAccessPolicyState
 */

/**
 * TEST-ONLY: clears approvals to keep suites isolated.
 */
function __resetForTests() {
    getState().approved.clear();
}

/**
 * Approve a FIT file path for subsequent reads.
 * @param {unknown} filePath
 * @param {{ source?: string }} [options]
 * @returns {string} validated path
 */
function approveFilePath(filePath, options = {}) {
    const validated = validateFilePathInput(filePath);

    if (!hasFitExtension(validated)) {
        throw new Error("Only .fit files can be approved");
    }

    const key = normalizeKey(validated);
    getState().approved.add(key);

    // Optional debug breadcrumb (kept low-noise)
    if (options.source && process.env.NODE_ENV !== "production") {
        try {
            console.log(`[FileAccessPolicy] Approved: ${validated} (source=${options.source})`);
        } catch {
            /* ignore */
        }
    }

    return validated;
}

/**
 * Best-effort bulk approval. Invalid entries are ignored.
 * @param {unknown} filePaths
 * @param {{ source?: string }} [options]
 */
function approveFilePaths(filePaths, options = {}) {
    if (!Array.isArray(filePaths)) {
        return;
    }

    for (const entry of filePaths) {
        try {
            approveFilePath(entry, options);
        } catch {
            // Ignore invalid entries; callers generally already validated via dialog filters.
        }
    }
}

/**
 * Assert that a requested file read is allowed.
 * @param {unknown} filePath
 * @returns {string} validated path
 */
function assertFileReadAllowed(filePath) {
    const validated = validateFilePathInput(filePath);

    if (!hasFitExtension(validated)) {
        throw new Error("Only .fit files are allowed");
    }

    if (!isApprovedFilePath(validated)) {
        throw new Error("File access denied");
    }

    return validated;
}

/**
 * @returns {FileAccessPolicyState}
 */
function getState() {
    /** @type {any} */
    const g = globalThis;
    if (!g.__ffvFileAccessPolicyState || typeof g.__ffvFileAccessPolicyState !== "object") {
        Object.defineProperty(g, "__ffvFileAccessPolicyState", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: { approved: new Set() },
        });
    }

    return /** @type {FileAccessPolicyState} */ (g.__ffvFileAccessPolicyState);
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function hasFitExtension(filePath) {
    return path.extname(filePath).toLowerCase() === ".fit";
}

/**
 * @param {unknown} filePath
 * @returns {boolean}
 */
function isApprovedFilePath(filePath) {
    try {
        const validated = validateFilePathInput(filePath);
        if (!hasFitExtension(validated)) {
            return false;
        }
        return getState().approved.has(normalizeKey(validated));
    } catch {
        return false;
    }
}

/**
 * @param {unknown} filePath
 * @returns {filePath is string}
 */
function isNonEmptyString(filePath) {
    return typeof filePath === "string" && filePath.trim().length > 0;
}

/**
 * Detect whether a path is Windows-style (drive letter or UNC).
 * This is important because Vitest may run on non-Windows platforms while
 * our fixtures/tests still use Windows-like paths (e.g., "C:/file.fit").
 *
 * @param {string} filePath
 * @returns {boolean}
 */
function isWindowsStylePath(filePath) {
    return /^[A-Za-z]:[/\\]/.test(filePath) || /^\\\\/.test(filePath);
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function normalizeKey(filePath) {
    const resolver = isWindowsStylePath(filePath) ? path.win32 : path.posix;
    const resolved = resolver.resolve(filePath);
    // Windows paths are case-insensitive in practice.
    return isWindowsStylePath(filePath) ? resolved.toLowerCase() : resolved;
}

/**
 * Validate and normalize an IPC-provided file path.
 * @param {unknown} filePath
 * @returns {string}
 */
function validateFilePathInput(filePath) {
    if (!isNonEmptyString(filePath)) {
        throw new Error("Invalid file path provided");
    }

    const trimmed = filePath.trim();

    // Reject NUL byte injection attempts.
    if (trimmed.includes("\0")) {
        throw new Error("Invalid file path provided");
    }

    const isAbsolute = path.posix.isAbsolute(trimmed) || path.win32.isAbsolute(trimmed);
    if (!isAbsolute) {
        throw new Error("Only absolute file paths are allowed");
    }

    return trimmed;
}

module.exports = {
    approveFilePath,
    approveFilePaths,
    assertFileReadAllowed,
    isApprovedFilePath,
    __resetForTests,
};
