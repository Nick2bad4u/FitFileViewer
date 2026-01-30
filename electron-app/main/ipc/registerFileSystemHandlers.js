/**
 * Registers IPC handlers for filesystem operations.
 *
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {{ readFile?: Function }} options.fs
 * @param {(
 *     level: "error" | "warn" | "info",
 *     message: string,
 *     context?: Record<string, any>
 * ) => void} options.logWithContext
 */
function registerFileSystemHandlers({ registerIpcHandle, fs, logWithContext }) {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    const { z } = require("zod");

    // Security: file reads must be validated and authorized in the main process.
    // We keep this local (instead of trusting renderer-provided paths) to prevent
    // arbitrary file disclosure if the renderer is compromised.
    const { assertFileReadAllowed } = require("../security/fileAccessPolicy");

    // Keep this validation minimal; fileAccessPolicy performs the authoritative
    // security checks (approved paths + .fit extension). This is primarily:
    // - to fail fast on obviously invalid inputs
    // - to avoid logging huge objects or extremely long strings
    const filePathSchema = z
        .string()
        .transform((s) => s.trim())
        .refine((s) => s.length > 0, { message: "Invalid file path provided" })
        .refine((s) => s.length <= 4096, {
            message: "Invalid file path provided",
        });

    /**
     * @param {unknown} value
     *
     * @returns {string}
     */
    const safeLogValue = (value) => {
        try {
            const text =
                typeof value === "string" ? value : JSON.stringify(value);
            return text.length > 300 ? `${text.slice(0, 300)}…` : text;
        } catch {
            try {
                const text = String(value);
                return text.length > 300 ? `${text.slice(0, 300)}…` : text;
            } catch {
                return "<unserializable>";
            }
        }
    };

    // Keep aligned with other IPC size caps (e.g., registerFitFileHandlers).
    const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024;

    registerIpcHandle("file:read", async (_event, filePath) => {
        /** @type {string | undefined} */
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

            return await new Promise((resolve, reject) => {
                if (!fs || typeof fs.readFile !== "function") {
                    reject(new Error("Filesystem module unavailable"));
                    return;
                }

                // Best-effort preflight size check to avoid huge reads.
                if (typeof fs.stat === "function") {
                    fs.stat(authorizedPath, (statErr, stats) => {
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
                            reject(new Error("File size exceeds 100MB limit"));
                            return;
                        }
                        read();
                    });
                    return;
                }

                read();

                function read() {
                    fs.readFile(authorizedPath, (err, data) => {
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
                            reject(new Error("Unexpected file read result"));
                            return;
                        }

                        if (
                            data &&
                            typeof data.byteLength === "number" &&
                            data.byteLength > MAX_FIT_FILE_BYTES
                        ) {
                            reject(new Error("File size exceeds 100MB limit"));
                            return;
                        }

                        // Buffer/Uint8Array share an ArrayBuffer. Slice to avoid returning the entire backing buffer.
                        // @ts-ignore byteOffset exists on Buffer/Uint8Array
                        resolve(
                            data.buffer.slice(
                                data.byteOffset,
                                data.byteOffset + data.byteLength
                            )
                        );
                    });
                }
            });
        } catch (error) {
            logWithContext?.("error", "Error in file:read:", {
                error: /** @type {Error} */ (error)?.message,
                filePath: safeLogValue(filePath),
                authorizedPath,
            });
            throw error;
        }
    });
}

module.exports = { registerFileSystemHandlers };
