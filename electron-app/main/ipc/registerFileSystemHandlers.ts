{
    const { z } = require("zod") as typeof import("zod");

    const { assertFileReadAllowed } =
        require("../security/fileAccessPolicy") as {
            assertFileReadAllowed: (filePath: string) => string;
        };

    type FileSystemModule = Pick<typeof import("node:fs"), "readFile" | "stat">;

    type RegisterFileSystemIpcHandler = (
        event: unknown,
        ...args: unknown[]
    ) => unknown;

    type RegisterFileSystemIpcHandle = (
        channel: string,
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

    // Keep aligned with other IPC size caps (e.g., registerFitFileHandlers).
    const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024;

    /**
     * Registers IPC handlers for filesystem operations.
     */
    function registerFileSystemHandlers({
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

                return await new Promise<ArrayBuffer>((resolve, reject) => {
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

                            // Node can return strings when an encoding is provided. We expect binary.
                            if (
                                !data ||
                                typeof data !== "object" ||
                                typeof data.byteLength !== "number"
                            ) {
                                reject(
                                    new Error("Unexpected file read result")
                                );
                                return;
                            }

                            if (data.byteLength > MAX_FIT_FILE_BYTES) {
                                reject(
                                    new Error("File size exceeds 100MB limit")
                                );
                                return;
                            }

                            // Buffer/Uint8Array share an ArrayBuffer. Slice to avoid returning the entire backing buffer.
                            const sourceBuffer = data.buffer as ArrayBuffer;
                            resolve(
                                sourceBuffer.slice(
                                    data.byteOffset,
                                    data.byteOffset + data.byteLength
                                )
                            );
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
