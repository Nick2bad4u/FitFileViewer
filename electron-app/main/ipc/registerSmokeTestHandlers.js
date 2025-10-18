/**
 * Registers IPC handlers used exclusively during smoke-test automation.
 * @param {object} params
 * @param {() => import('electron').App | undefined} params.appRef
 * @param {() => import('electron').IpcMain | undefined} params.ipcMainRef
 * @param {(level: 'info'|'warn'|'error', message: string, context?: Record<string, any>) => void} params.logWithContext
 * @param {() => any} [params.getMainWindow]
 * @param {(win: any, channel: string, ...args: any[]) => void} [params.sendToRenderer]
 * @returns {() => void}
 */
let hasRegistered = false;
const DEFAULT_SMOKE_TIMEOUT_MS = 120 * 1000;
const DEFAULT_SMOKE_READINESS_DELAY_MS = 5 * 1000;
const MAX_SMOKE_READINESS_DELAY_MS = 10 * 1000;

function registerSmokeTestHandlers({ appRef, ipcMainRef, logWithContext, getMainWindow, sendToRenderer }) {
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
    let readinessTimeoutHandle = null;
    let rendererReadyListener = null;
    let dispatchInvoked = false;

    const forcedPath = process.env.FFV_E2E_OPEN_FILE_PATH ? String(process.env.FFV_E2E_OPEN_FILE_PATH) : null;
    const canDispatch = typeof getMainWindow === "function" && typeof sendToRenderer === "function";

    const dispatchMenuOpen = () => {
        if (!canDispatch) {
            return;
        }

        try {
            const win = getMainWindow();
            if (!win || !win.webContents) {
                logWithContext("warn", "Smoke test renderer ready but window unavailable", {});
                return;
            }

            if (typeof win.webContents.isDestroyed === "function" && win.webContents.isDestroyed()) {
                logWithContext("warn", "Smoke test window destroyed before dispatch", {});
                return;
            }

            if (typeof win.webContents.isLoading === "function" && win.webContents.isLoading()) {
                win.webContents.once("did-finish-load", () => {
                    dispatchMenuOpen();
                });
                return;
            }

            if (dispatchInvoked) {
                return;
            }
            dispatchInvoked = true;

            logWithContext("info", "Smoke test prompting renderer to open forced file", {
                forcedPath,
            });
            sendToRenderer(win, "menu-open-file");
            if (readinessTimeoutHandle) {
                clearTimeout(readinessTimeoutHandle);
                readinessTimeoutHandle = null;
            }
        } catch (error) {
            logWithContext("error", "Failed to dispatch smoke test menu-open-file event", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };

    const finish = (exitCode, context) => {
        if (completed) {
            return;
        }
        completed = true;

        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timeoutHandle = null;
        }
        if (readinessTimeoutHandle) {
            clearTimeout(readinessTimeoutHandle);
            readinessTimeoutHandle = null;
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

    const timeoutMs = Number(process.env.FFV_SMOKE_TEST_TIMEOUT_MS || DEFAULT_SMOKE_TIMEOUT_MS);
    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
            finish(1, { reason: "timeout", timeoutMs });
        }, timeoutMs);
        if (typeof timeoutHandle.unref === "function") {
            timeoutHandle.unref();
        }
    }

    if (canDispatch) {
        const readinessDelay = Number.isFinite(timeoutMs) && timeoutMs > 0
            ? Math.min(Math.trunc(timeoutMs / 4), MAX_SMOKE_READINESS_DELAY_MS)
            : DEFAULT_SMOKE_READINESS_DELAY_MS;

        rendererReadyListener = () => {
            logWithContext("info", "Smoke test renderer signaled readiness", {});
            dispatchMenuOpen();
        };

        ipcMain.on("smoke-test:renderer-ready", rendererReadyListener);

        readinessTimeoutHandle = setTimeout(() => {
            logWithContext("warn", "Smoke test renderer readiness not received, dispatching anyway", {
                delayMs: readinessDelay,
            });
            dispatchMenuOpen();
        }, readinessDelay);
        if (typeof readinessTimeoutHandle.unref === "function") {
            readinessTimeoutHandle.unref();
        }
    }

    return () => {
        try {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
                timeoutHandle = null;
            }
            if (readinessTimeoutHandle) {
                clearTimeout(readinessTimeoutHandle);
                readinessTimeoutHandle = null;
            }
            if (rendererReadyListener) {
                ipcMain.removeListener("smoke-test:renderer-ready", rendererReadyListener);
                rendererReadyListener = null;
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
