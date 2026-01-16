/**
 * Registers IPC handlers for filesystem operations.
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {{ readFile?: Function }} options.fs
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 */
function registerFileSystemHandlers({ registerIpcHandle, fs, logWithContext }) {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    // Security: file reads must be validated and authorized in the main process.
    // We keep this local (instead of trusting renderer-provided paths) to prevent
    // arbitrary file disclosure if the renderer is compromised.
    const { assertFileReadAllowed } = require("../security/fileAccessPolicy");

    // Keep aligned with main/ipc/setupIPCHandlers.js.
    const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024;

    registerIpcHandle("file:read", async (_event, filePath) => {
        try {
            let authorizedPath;
            try {
                authorizedPath = assertFileReadAllowed(filePath);
            } catch (policyError) {
                const error = policyError instanceof Error ? policyError : new Error(String(policyError));
                logWithContext?.("error", "Error in file:read:", {
                    error: error.message,
                    filePath,
                });
                throw error;
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
                        const size = stats && typeof stats.size === "number" ? stats.size : 0;
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
                            logWithContext?.("error", "Error reading file:", {
                                error: /** @type {Error} */ (err)?.message,
                                filePath: authorizedPath,
                            });
                            reject(err);
                            return;
                        }

                        if (data && typeof data.byteLength === "number" && data.byteLength > MAX_FIT_FILE_BYTES) {
                            reject(new Error("File size exceeds 100MB limit"));
                            return;
                        }

                        resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
                    });
                }
            });
        } catch (error) {
            logWithContext?.("error", "Error in file:read:", {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });
}

module.exports = { registerFileSystemHandlers };
