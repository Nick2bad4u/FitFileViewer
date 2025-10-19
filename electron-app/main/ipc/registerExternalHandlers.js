/**
 * Registers IPC handlers for external integrations (shell and Gyazo server control).
 * @param {object} options
 * @param {(channel: string, handler: Function) => void} options.registerIpcHandle
 * @param {() => any} options.shellRef
 * @param {(port?: number) => Promise<any>} options.startGyazoOAuthServer
 * @param {() => Promise<any>} options.stopGyazoOAuthServer
 * @param {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} options.logWithContext
 */
function registerExternalHandlers({
    registerIpcHandle,
    shellRef,
    startGyazoOAuthServer,
    stopGyazoOAuthServer,
    logWithContext,
}) {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    registerIpcHandle("shell:openExternal", async (_event, url) => {
        try {
            if (!url || typeof url !== "string") {
                throw new Error("Invalid URL provided");
            }
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                throw new Error("Only HTTP and HTTPS URLs are allowed");
            }

            const shell = shellRef?.();
            if (!shell || typeof shell.openExternal !== "function") {
                throw new Error("shell.openExternal unavailable");
            }

            await shell.openExternal(url);
            return true;
        } catch (error) {
            logWithContext?.("error", "Error in shell:openExternal:", {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });

    registerIpcHandle("gyazo:server:start", async (_event, port = 3000) => {
        try {
            return await startGyazoOAuthServer(port);
        } catch (error) {
            logWithContext?.("error", "Error in gyazo:server:start:", {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });

    registerIpcHandle("gyazo:server:stop", async () => {
        try {
            return await stopGyazoOAuthServer();
        } catch (error) {
            logWithContext?.("error", "Error in gyazo:server:stop:", {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });
}

module.exports = { registerExternalHandlers };
