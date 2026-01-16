const nodeModules = require("../runtime/nodeModules");
const { path } = nodeModules;

// Defensive cap: prevents unbounded growth if approval is triggered repeatedly.
const MAX_APPROVED_FIT_FILES = 500;

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
 * @typedef {typeof globalThis & { __ffvFileAccessPolicyState?: FileAccessPolicyState }} FileAccessPolicyGlobal
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
    const state = getState();
    state.approved.add(key);

    // Enforce cap (Set preserves insertion order).
    while (state.approved.size > MAX_APPROVED_FIT_FILES) {
        const first = state.approved.values().next().value;
        if (typeof first !== "string") break;
        state.approved.delete(first);
    }

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
    /** @type {FileAccessPolicyGlobal} */
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
 * Validate that a value is a well-formed absolute filesystem path to a .fit file.
 *
 * This does NOT approve anything; it's intended for callers that need to filter
 * user-provided or persisted lists (e.g., recent-files.json) without mutating
 * allowlist state.
 *
 * @param {unknown} filePath
 * @returns {filePath is string}
 */
function isValidFitFilePathCandidate(filePath) {
    try {
        const validated = validateFilePathInput(filePath);
        return hasFitExtension(validated);
    } catch {
        return false;
    }
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
    // Drive-letter paths:  C:\x or C:/x
    // UNC paths:           \\server\share\x   or //server/share/x
    return /^[A-Za-z]:[/\\]/.test(filePath) || /^\\\\/.test(filePath) || /^\/\//.test(filePath);
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function normalizeKey(filePath) {
    const resolver = isWindowsStylePath(filePath) ? path.win32 : path.posix;
    const resolved = resolver.resolve(filePath);

    // Canonicalize via realpath when possible.
    // This mitigates symlink retargeting after a path has been approved.
    let canonical = resolved;
    try {
        const { fs } = nodeModules;
        if (fs && typeof fs.realpathSync === "function") {
            const realpathFn =
                fs.realpathSync && typeof fs.realpathSync.native === "function"
                    ? fs.realpathSync.native
                    : fs.realpathSync;
            const rp = realpathFn(resolved);
            if (typeof rp === "string" && rp.length > 0) {
                canonical = rp;
            }
        }
    } catch {
        // Common in tests: the path doesn't exist. Fall back to resolved.
    }

    // Windows paths are case-insensitive in practice.
    return isWindowsStylePath(filePath) ? canonical.toLowerCase() : canonical;
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

    // Reject URI-like values (paths must be filesystem paths).
    if (/^\w+:\/\//u.test(trimmed)) {
        throw new Error("Invalid file path provided");
    }

    // Reject NUL byte injection attempts.
    if (trimmed.includes("\0")) {
        throw new Error("Invalid file path provided");
    }

    // Reject Windows device / extended-length path prefixes.
    // These can bypass certain normalization assumptions and are unnecessary for FFV.
    // Backslash form: \\?\C:\path or \\.\PhysicalDrive0
    // Slash form (defense-in-depth): //?/C:/path or //./COM1
    if (
        /^\\\\\?\\/u.test(trimmed) ||
        /^\\\\\.\\/u.test(trimmed) ||
        /^\/\/\?\//u.test(trimmed) ||
        /^\/\/\.\//u.test(trimmed)
    ) {
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
    isValidFitFilePathCandidate,
    __resetForTests,
};
