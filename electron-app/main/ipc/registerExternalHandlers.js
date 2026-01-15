const { validateExternalUrl } = require("../security/externalUrlPolicy");

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
            const validatedUrl = validateExternalUrl(url);

            const shell = shellRef?.();
            if (!shell || typeof shell.openExternal !== "function") {
                throw new Error("shell.openExternal unavailable");
            }

            await shell.openExternal(validatedUrl);
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
            const numericPort = typeof port === "number" ? port : Number(port);
            if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65_535) {
                throw new Error("Invalid port provided");
            }

            return await startGyazoOAuthServer(numericPort);
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
