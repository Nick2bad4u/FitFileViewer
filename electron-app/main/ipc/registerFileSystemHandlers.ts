import {
    MAX_FIT_FILE_BYTES,
    normalizeFileReadResultToArrayBuffer,
} from "./fileReadPayload.js";
import { assertFileReadAllowed } from "../security/fileAccessPolicy.js";
import { z } from "zod";

type FileSystemInvokeChannel =
    import("../../shared/ipc").FileSystemInvokeChannel;
type FileReadResult = import("../../shared/ipc").FileSystemResponsePayload;

type FileSystemModule = Pick<
    typeof import("node:fs"),
    "readFile" | "stat"
> | null;

type RegisterFileSystemIpcHandler = (
    event: unknown,
    ...args: unknown[]
) => unknown;

type RegisterFileSystemIpcHandle = (
    channel: FileSystemInvokeChannel,
    handler: RegisterFileSystemIpcHandler
) => void;

type LogWithContext = (
    level: "error" | "info" | "warn",
    message: string,
    context?: Record<string, unknown>
) => void;

interface RegisterFileSystemHandlersOptions {
    fs: FileSystemModule;
    logWithContext?: LogWithContext;
    registerIpcHandle: RegisterFileSystemIpcHandle;
}

const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

function isMissingFileError(error: unknown): boolean {
    if (error && typeof error === "object" && "code" in error) {
        return (error as { code?: unknown }).code === "ENOENT";
    }

    return /\bENOENT\b/u.test(getErrorMessage(error));
}

// Keep this validation minimal; fileAccessPolicy performs the authoritative
// security checks (approved paths + .fit extension). This is primarily:
// - to fail fast on obviously invalid inputs
// - to avoid logging huge objects or extremely long strings
const filePathSchema = z
    .string()
    .transform((filePath) => filePath.trim())
    .refine((filePath) => filePath.length > 0, {
        message: "Invalid file path provided",
    })
    .refine((filePath) => filePath.length <= 4096, {
        message: "Invalid file path provided",
    });

const truncateLogValue = (text: string): string =>
    text.length > 300 ? `${text.slice(0, 300)}…` : text;

const safeLogValue = (value: unknown): string => {
    try {
        const text = typeof value === "string" ? value : JSON.stringify(value);
        if (typeof text === "string") {
            return truncateLogValue(text);
        }
    } catch {
        // Fall through to String coercion below.
    }

    try {
        return truncateLogValue(String(value));
    } catch {
        return "<unserializable>";
    }
};

/**
 * Registers IPC handlers for filesystem operations.
 */
export function registerFileSystemHandlers({
    registerIpcHandle,
    fs,
    logWithContext,
}: RegisterFileSystemHandlersOptions): void {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    registerIpcHandle("file:read", async (_event, filePath) => {
        let authorizedPath: string | undefined;

        try {
            const parsedPath = filePathSchema.safeParse(filePath);
            if (!parsedPath.success) {
                throw new Error("Invalid file path provided");
            }

            try {
                authorizedPath = assertFileReadAllowed(parsedPath.data);
            } catch (policyError) {
                throw policyError instanceof Error
                    ? policyError
                    : new Error(String(policyError));
            }
            const fileReadPath = authorizedPath;

            return await new Promise<FileReadResult>((resolve, reject) => {
                if (!fs || typeof fs.readFile !== "function") {
                    reject(new Error("Filesystem module unavailable"));
                    return;
                }

                const read = (): void => {
                    fs.readFile(fileReadPath, (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        try {
                            resolve(normalizeFileReadResultToArrayBuffer(data));
                        } catch (readResultError) {
                            reject(
                                readResultError instanceof Error
                                    ? readResultError
                                    : new Error(String(readResultError))
                            );
                        }
                    });
                };

                // Best-effort preflight size check to avoid huge reads.
                if (typeof fs.stat === "function") {
                    fs.stat(fileReadPath, (statErr, stats) => {
                        if (statErr) {
                            if (isMissingFileError(statErr)) {
                                reject(statErr);
                                return;
                            }

                            // If non-existence is not the problem, fall back
                            // to readFile and let the platform decide.
                            read();
                            return;
                        }
                        const size =
                            stats && typeof stats.size === "number"
                                ? stats.size
                                : 0;
                        if (size > MAX_FIT_FILE_BYTES) {
                            reject(new Error("File size exceeds 100MB limit"));
                            return;
                        }
                        read();
                    });
                    return;
                }

                read();
            });
        } catch (error) {
            if (!isMissingFileError(error)) {
                logWithContext?.("error", "Error in file:read:", {
                    authorizedPath,
                    error: getErrorMessage(error),
                    filePath: safeLogValue(filePath),
                });
            }
            throw error;
        }
    });
}

export default { registerFileSystemHandlers };
