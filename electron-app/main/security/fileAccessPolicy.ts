import { validateFitFilePathInput } from "../../shared/fitFilePathPolicy.js";
import { isNodeEnvironment } from "../../utils/runtime/processEnvironment.js";
import {
    getFileAccessPolicyState,
    resetFileAccessPolicyState,
    type FileAccessPolicyState,
} from "./fileAccessPolicyState.js";
import * as nodeModules from "../runtime/nodeModules.js";

const { path } = nodeModules;

interface ApprovalOptions {
    source?: string;
}

// Defensive cap: prevents unbounded growth if approval is triggered repeatedly.
const MAX_APPROVED_FIT_FILES = 500;

/**
 * TEST-ONLY: clears approvals to keep suites isolated.
 */
export function __resetForTests(): void {
    resetFileAccessPolicyState();
}

/**
 * Approve a FIT file path for subsequent reads.
 *
 * @throws Error when the path is invalid or does not target a FIT file.
 */
export function approveFilePath(
    filePath: unknown,
    options: ApprovalOptions = {}
): string {
    const validated = validateFitFilePathInput(filePath);

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

    if (options.source && !isNodeEnvironment("production")) {
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
export function approveFilePaths(
    filePaths: unknown,
    options: ApprovalOptions = {}
): void {
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
export function assertFileReadAllowed(filePath: unknown): string {
    const validated = validateFitFilePathInput(filePath);

    if (!hasFitExtension(validated)) {
        throw new Error("Only .fit files are allowed");
    }

    if (!isApprovedFilePath(validated)) {
        throw new Error("File access denied");
    }

    return validated;
}

function getState(): FileAccessPolicyState {
    return getFileAccessPolicyState();
}

function hasFitExtension(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === ".fit";
}

export function isApprovedFilePath(filePath: unknown): boolean {
    try {
        const validated = validateFitFilePathInput(filePath);
        if (!hasFitExtension(validated)) {
            return false;
        }
        return getState().approved.has(normalizeKey(validated));
    } catch {
        return false;
    }
}

/**
 * Validate that a value is a well-formed absolute filesystem path to a .fit
 * file.
 *
 * This does not approve anything; it is for filtering user-provided or
 * persisted lists without mutating allowlist state.
 */
export function isValidFitFilePathCandidate(
    filePath: unknown
): filePath is string {
    try {
        const validated = validateFitFilePathInput(filePath);
        return hasFitExtension(validated);
    } catch {
        return false;
    }
}

function isWindowsStylePath(filePath: string): boolean {
    return (
        /^[A-Za-z]:[/\\]/u.test(filePath) ||
        filePath.startsWith("\\\\") ||
        filePath.startsWith("//")
    );
}

function normalizeKey(filePath: string): string {
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

    return isWindowsStylePath(filePath) ? canonical.toLowerCase() : canonical;
}
