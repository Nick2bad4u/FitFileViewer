"use strict";
{
    const nodeModules = require("../runtime/nodeModules");
    const { path } = nodeModules;
    // Defensive cap: prevents unbounded growth if approval is triggered repeatedly.
    const MAX_APPROVED_FIT_FILES = 500;
    /**
     * TEST-ONLY: clears approvals to keep suites isolated.
     */
    function __resetForTests() {
        getState().approved.clear();
    }
    /**
     * Approve a FIT file path for subsequent reads.
     *
     * @throws Error when the path is invalid or does not target a FIT file.
     */
    function approveFilePath(filePath, options = {}) {
        const validated = validateFilePathInput(filePath);
        if (!hasFitExtension(validated)) {
            throw new Error("Only .fit files can be approved");
        }
        const key = normalizeKey(validated);
        const state = getState();
        state.approved.add(key);
        // Set preserves insertion order, so deleting the first entry removes the oldest approval.
        while (state.approved.size > MAX_APPROVED_FIT_FILES) {
            const first = state.approved.values().next().value;
            if (typeof first !== "string") {
                break;
            }
            state.approved.delete(first);
        }
        if (options.source && process.env["NODE_ENV"] !== "production") {
            try {
                console.log(
                    `[FileAccessPolicy] Approved: ${validated} (source=${options.source})`
                );
            } catch {
                /* ignore */
            }
        }
        return validated;
    }
    /**
     * Best-effort bulk approval. Invalid entries are ignored.
     */
    function approveFilePaths(filePaths, options = {}) {
        if (!Array.isArray(filePaths)) {
            return;
        }
        for (const entry of filePaths) {
            try {
                approveFilePath(entry, options);
            } catch {
                // Callers generally already validated via dialog filters.
            }
        }
    }
    /**
     * Assert that a requested file read is allowed.
     *
     * @throws Error when the path is invalid, not a FIT file, or not approved.
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
    function getState() {
        const g = globalThis;
        if (
            !g.__ffvFileAccessPolicyState ||
            typeof g.__ffvFileAccessPolicyState !== "object"
        ) {
            Object.defineProperty(g, "__ffvFileAccessPolicyState", {
                configurable: true,
                enumerable: false,
                value: { approved: new Set() },
                writable: true,
            });
        }
        return g.__ffvFileAccessPolicyState;
    }
    function hasFitExtension(filePath) {
        return path.extname(filePath).toLowerCase() === ".fit";
    }
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
    function isNonEmptyString(filePath) {
        return typeof filePath === "string" && filePath.trim().length > 0;
    }
    /**
     * Validate that a value is a well-formed absolute filesystem path to a .fit
     * file.
     *
     * This does not approve anything; it is for filtering user-provided or
     * persisted lists without mutating allowlist state.
     */
    function isValidFitFilePathCandidate(filePath) {
        try {
            const validated = validateFilePathInput(filePath);
            return hasFitExtension(validated);
        } catch {
            return false;
        }
    }
    function isWindowsStylePath(filePath) {
        return (
            /^[A-Za-z]:[/\\]/u.test(filePath) ||
            /^\\\\/u.test(filePath) ||
            /^\/\//u.test(filePath)
        );
    }
    function normalizeKey(filePath) {
        const resolver = isWindowsStylePath(filePath) ? path.win32 : path.posix;
        const resolved = resolver.resolve(filePath);
        let canonical = resolved;
        try {
            const { fs } = nodeModules;
            if (fs && typeof fs.realpathSync === "function") {
                const realpathFn =
                    typeof fs.realpathSync.native === "function"
                        ? fs.realpathSync.native
                        : fs.realpathSync;
                const realpath = realpathFn(resolved);
                if (typeof realpath === "string" && realpath.length > 0) {
                    canonical = realpath;
                }
            }
        } catch {
            // Common in tests: the path does not exist. Fall back to the resolved path.
        }
        return isWindowsStylePath(filePath)
            ? canonical.toLowerCase()
            : canonical;
    }
    /**
     * Validate and normalize an IPC-provided file path.
     *
     * @throws Error when the value is not an acceptable absolute filesystem
     *   path.
     */
    function validateFilePathInput(filePath) {
        if (!isNonEmptyString(filePath)) {
            throw new Error("Invalid file path provided");
        }
        const trimmed = filePath.trim();
        if (/^\w+:\/\//u.test(trimmed)) {
            throw new Error("Invalid file path provided");
        }
        if (trimmed.includes("\0")) {
            throw new Error("Invalid file path provided");
        }
        if (
            /^\\\\\?\\/u.test(trimmed) ||
            /^\\\\\.\\/u.test(trimmed) ||
            /^\/\/\?\//u.test(trimmed) ||
            /^\/\/\.\//u.test(trimmed)
        ) {
            throw new Error("Invalid file path provided");
        }
        const isAbsolute =
            path.posix.isAbsolute(trimmed) || path.win32.isAbsolute(trimmed);
        if (!isAbsolute) {
            throw new Error("Only absolute file paths are allowed");
        }
        return trimmed;
    }
    module.exports = {
        __resetForTests,
        approveFilePath,
        approveFilePaths,
        assertFileReadAllowed,
        isApprovedFilePath,
        isValidFitFilePathCandidate,
    };
}
