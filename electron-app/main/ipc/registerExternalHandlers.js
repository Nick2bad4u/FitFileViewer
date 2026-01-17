const { z } = require("zod");

const { validateExternalUrl } = require("../security/externalUrlPolicy");

// Security: restrict the callback server to non-privileged ports.
// Allow 0 so the OS can choose an ephemeral port.
const gyazoPortSchema = z.coerce
    .number()
    .int()
    .min(0)
    .max(65_535)
    .refine((p) => p === 0 || p >= 1024, { message: "Invalid port provided" });

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
            if (typeof startGyazoOAuthServer !== "function") {
                throw new TypeError("Gyazo OAuth server start unavailable");
            }

            const parsed = gyazoPortSchema.safeParse(port);
            if (!parsed.success) {
                throw new Error("Invalid port provided");
            }

            return await startGyazoOAuthServer(parsed.data);
        } catch (error) {
            logWithContext?.("error", "Error in gyazo:server:start:", {
                error: /** @type {Error} */ (error)?.message,
            });
            throw error;
        }
    });

    registerIpcHandle("gyazo:server:stop", async () => {
        try {
            if (typeof stopGyazoOAuthServer !== "function") {
                throw new TypeError("Gyazo OAuth server stop unavailable");
            }

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
