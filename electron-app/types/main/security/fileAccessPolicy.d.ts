export type FileAccessPolicyState = {
    approved: Set<string>;
};
export type FileAccessPolicyGlobal = typeof globalThis & {
    __ffvFileAccessPolicyState?: FileAccessPolicyState;
};
/**
 * Approve a FIT file path for subsequent reads.
 * @param {unknown} filePath
 * @param {{ source?: string }} [options]
 * @returns {string} validated path
 */
export function approveFilePath(
    filePath: unknown,
    options?: {
        source?: string;
    }
): string;
/**
 * Best-effort bulk approval. Invalid entries are ignored.
 * @param {unknown} filePaths
 * @param {{ source?: string }} [options]
 */
export function approveFilePaths(
    filePaths: unknown,
    options?: {
        source?: string;
    }
): void;
/**
 * Assert that a requested file read is allowed.
 * @param {unknown} filePath
 * @returns {string} validated path
 */
export function assertFileReadAllowed(filePath: unknown): string;
/**
 * @param {unknown} filePath
 * @returns {boolean}
 */
export function isApprovedFilePath(filePath: unknown): boolean;
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
export function isValidFitFilePathCandidate(filePath: unknown): filePath is string;
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
export function __resetForTests(): void;
//# sourceMappingURL=fileAccessPolicy.d.ts.map
