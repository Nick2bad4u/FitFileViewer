const { z } = require("zod");

const { validateExternalUrl } = require("../security/externalUrlPolicy");

/**
 * @typedef {{ openExternal: (url: string) => Promise<void> }} ExternalShell
 *
 * @typedef {{ success: boolean; message: string; port?: number }} GyazoServerStartResult
 *
 * @typedef {{ success: boolean; message: string }} GyazoServerStopResult
 *
 * @typedef {(
 *     channel: string,
 *     handler: (event: unknown, ...args: unknown[]) => unknown
 * ) => void} RegisterIpcHandle
 *
 * @typedef {(
 *     level: "error" | "warn" | "info",
 *     message: string,
 *     context?: Record<string, unknown>
 * ) => void} LogWithContext
 *
 * @typedef {{
 *     registerIpcHandle: RegisterIpcHandle;
 *     shellRef?: () => ExternalShell | null | undefined;
 *     startGyazoOAuthServer?: (
 *         port?: number
 *     ) => Promise<GyazoServerStartResult>;
 *     stopGyazoOAuthServer?: () => Promise<GyazoServerStopResult>;
 *     logWithContext?: LogWithContext;
 * }} RegisterExternalHandlersOptions
 */

/**
 * @param {unknown} error
 *
 * @returns {string}
 */
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

// Security: restrict the callback server to non-privileged ports.
// Allow 0 so the OS can choose an ephemeral port.
const gyazoPortSchema = z.coerce
    .number()
    .int()
    .min(0)
    .max(65_535)
    .refine((p) => p === 0 || p >= 1024, { message: "Invalid port provided" });

/**
 * Registers IPC handlers for external integrations (shell and Gyazo server
 * control).
 *
 * @param {RegisterExternalHandlersOptions} options
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

            // eslint-disable-next-line sdl/no-electron-untrusted-open-external -- validateExternalUrl allows only https/mailto URLs without credentials.
            await shell.openExternal(validatedUrl);
            return true;
        } catch (error) {
            logWithContext?.("error", "Error in shell:openExternal:", {
                error: getErrorMessage(error),
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
                error: getErrorMessage(error),
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
                error: getErrorMessage(error),
            });
            throw error;
        }
    });
}

module.exports = { registerExternalHandlers };
