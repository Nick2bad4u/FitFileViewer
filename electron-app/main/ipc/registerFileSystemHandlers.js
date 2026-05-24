"use strict";
{
    const { z } = require("zod");
    const { assertFileReadAllowed } = require("../security/fileAccessPolicy");
    const {
        MAX_FIT_FILE_BYTES,
        normalizeFileReadResultToArrayBuffer,
    } = require("./fileReadPayload");
    const getErrorMessage = (error) =>
        error instanceof Error ? error.message : String(error);
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
    const truncateLogValue = (text) =>
        text.length > 300 ? `${text.slice(0, 300)}…` : text;
    const safeLogValue = (value) => {
        try {
            const text =
                typeof value === "string" ? value : JSON.stringify(value);
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
    function registerFileSystemHandlers({
        registerIpcHandle,
        fs,
        logWithContext,
    }) {
        if (typeof registerIpcHandle !== "function") {
            return;
        }
        registerIpcHandle("file:read", async (_event, filePath) => {
            let authorizedPath;
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
                return await new Promise((resolve, reject) => {
                    if (!fs || typeof fs.readFile !== "function") {
                        reject(new Error("Filesystem module unavailable"));
                        return;
                    }
                    const read = () => {
                        fs.readFile(fileReadPath, (err, data) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            try {
                                resolve(
                                    normalizeFileReadResultToArrayBuffer(data)
                                );
                            } catch (readResultError) {
                                reject(readResultError);
                            }
                        });
                    };
                    // Best-effort preflight size check to avoid huge reads.
                    if (typeof fs.stat === "function") {
                        fs.stat(fileReadPath, (statErr, stats) => {
                            if (statErr) {
                                // If we can't stat, fall back to readFile (will still error if missing).
                                read();
                                return;
                            }
                            const size =
                                stats && typeof stats.size === "number"
                                    ? stats.size
                                    : 0;
                            if (size > MAX_FIT_FILE_BYTES) {
                                reject(
                                    new Error("File size exceeds 100MB limit")
                                );
                                return;
                            }
                            read();
                        });
                        return;
                    }
                    read();
                });
            } catch (error) {
                logWithContext?.("error", "Error in file:read:", {
                    authorizedPath,
                    error: getErrorMessage(error),
                    filePath: safeLogValue(filePath),
                });
                throw error;
            }
        });
    }
    module.exports = { registerFileSystemHandlers };
}
