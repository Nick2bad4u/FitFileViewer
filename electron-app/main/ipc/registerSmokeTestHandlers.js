/**
 * Registers IPC handlers used exclusively during smoke-test automation.
 * @param {object} params
 * @param {() => import('electron').App | undefined} params.appRef
 * @param {() => import('electron').IpcMain | undefined} params.ipcMainRef
 * @param {(level: 'info'|'warn'|'error', message: string, context?: Record<string, any>) => void} params.logWithContext
 * @returns {() => void}
 */
let hasRegistered = false;

function registerSmokeTestHandlers({ appRef, ipcMainRef, logWithContext }) {
    if (process.env.FFV_SMOKE_TEST_MODE !== "1" || hasRegistered) {
        return () => { };
    }

    const ipcMain = ipcMainRef();
    if (!ipcMain || typeof ipcMain.on !== "function") {
        logWithContext("warn", "Smoke test mode enabled but ipcMain unavailable", {});
        return () => { };
    }

    hasRegistered = true;

    /** @type {NodeJS.Timeout|null} */
    let timeoutHandle = null;
    let completed = false;

    const finish = (exitCode, context) => {
        if (completed) {
            return;
        }
        completed = true;

        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
        }

        logWithContext(exitCode === 0 ? "info" : "error", "Smoke test completed", context ?? {});

        try {
            const app = appRef();
            if (!app || typeof app.exit !== "function") {
                throw new Error("Electron app instance unavailable");
            }

            setTimeout(() => {
                try {
                    app.exit(exitCode);
                } catch (error) {
                    logWithContext("error", "Smoke test exit handler threw", {
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }, 50);
        } catch (error) {
            logWithContext("error", "Smoke test finalization failed", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };

    const listener = (_event, payload) => {
        const normalizedPayload = payload && typeof payload === "object" ? payload : {};
        const success = Boolean(normalizedPayload.success);
        finish(success ? 0 : 1, { payload: normalizedPayload });
    };

    ipcMain.on("smoke-test:result", listener);

    const timeoutMs = Number(process.env.FFV_SMOKE_TEST_TIMEOUT_MS || 120_000);
    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
            finish(1, { reason: "timeout", timeoutMs });
        }, timeoutMs);
        if (typeof timeoutHandle.unref === "function") {
            timeoutHandle.unref();
        }
    }

    return () => {
        try {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
                timeoutHandle = null;
            }
            ipcMain.removeListener("smoke-test:result", listener);
        } catch (error) {
            logWithContext("warn", "Failed to clean up smoke test handlers", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
        hasRegistered = false;
    };
}

module.exports = { registerSmokeTestHandlers };
