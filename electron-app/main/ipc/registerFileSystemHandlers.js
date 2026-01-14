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

    /**
     * Validate file path input for filesystem IPC calls.
     * @param {unknown} filePath
     * @returns {filePath is string}
     */
    const isValidFilePath = (filePath) => typeof filePath === "string" && filePath.trim().length > 0;

    registerIpcHandle("file:read", async (_event, filePath) => {
        try {
            if (!isValidFilePath(filePath)) {
                const error = new Error("Invalid file path provided");
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

                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        logWithContext?.("error", "Error reading file:", {
                            error: /** @type {Error} */ (err)?.message,
                            filePath,
                        });
                        reject(err);
                        return;
                    }

                    resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
                });
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
