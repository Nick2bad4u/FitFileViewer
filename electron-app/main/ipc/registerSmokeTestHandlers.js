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
const SMOKE_DISPATCH_RETRY_INTERVAL_MS = 500;

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
    let retryTimeoutHandle = null;
    let retryAttemptCount = 0;
    let maxDispatchAttempts = 0;
    let appListenerCleanup = null;
    let resultListener = null;

    const forcedPath = process.env.FFV_E2E_OPEN_FILE_PATH ? String(process.env.FFV_E2E_OPEN_FILE_PATH) : null;
    const canDispatch = typeof getMainWindow === "function" && typeof sendToRenderer === "function";
    const configuredTimeout = Number(process.env.FFV_SMOKE_TEST_TIMEOUT_MS || DEFAULT_SMOKE_TIMEOUT_MS);
    const timeoutMs = Number.isFinite(configuredTimeout) ? configuredTimeout : DEFAULT_SMOKE_TIMEOUT_MS;

    function clearRetryTimer() {
        if (retryTimeoutHandle) {
            clearTimeout(retryTimeoutHandle);
            retryTimeoutHandle = null;
        }
    }

    function finish(exitCode, context) {
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
        clearRetryTimer();

        if (rendererReadyListener) {
            try {
                ipcMain.removeListener("smoke-test:renderer-ready", rendererReadyListener);
            } catch {
                /* noop */
            }
            rendererReadyListener = null;
        }

        if (resultListener) {
            try {
                ipcMain.removeListener("smoke-test:result", resultListener);
            } catch {
                /* noop */
            }
            resultListener = null;
        }

        if (typeof appListenerCleanup === "function") {
            try {
                appListenerCleanup();
            } catch {
                /* noop */
            }
            appListenerCleanup = null;
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
    }

    function finalizeDispatchFailure(reason, extra = {}) {
        clearRetryTimer();
        finish(1, {
            reason,
            ...extra,
        });
    }

    function scheduleRetry(reason) {
        if (dispatchInvoked) {
            return;
        }

        if (retryAttemptCount >= maxDispatchAttempts) {
            logWithContext("error", "Smoke test dispatch retries exhausted", {
                attempts: retryAttemptCount,
                reason,
            });
            finalizeDispatchFailure("dispatch-retry-exhausted", {
                attempts: retryAttemptCount,
                lastReason: reason,
            });
            return;
        }

        retryAttemptCount += 1;
        clearRetryTimer();
        retryTimeoutHandle = setTimeout(() => {
            retryTimeoutHandle = null;
            dispatchMenuOpen();
        }, SMOKE_DISPATCH_RETRY_INTERVAL_MS);
        if (retryTimeoutHandle && typeof retryTimeoutHandle.unref === "function") {
            retryTimeoutHandle.unref();
        }

        logWithContext("info", "Smoke test dispatch retry scheduled", {
            attempt: retryAttemptCount,
            maxDispatchAttempts,
            reason,
        });
    }

    function attemptSend(win) {
        if (dispatchInvoked) {
            return;
        }
        dispatchInvoked = true;
        clearRetryTimer();

        if (readinessTimeoutHandle) {
            clearTimeout(readinessTimeoutHandle);
            readinessTimeoutHandle = null;
        }

        logWithContext("info", "Smoke test prompting renderer to open file", {
            forcedPath,
        });

        try {
            sendToRenderer(win, "menu-open-file");
        } catch (error) {
            logWithContext("error", "Smoke test dispatch failed", {
                error: error instanceof Error ? error.message : String(error),
            });
            finalizeDispatchFailure("dispatch-send-error", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    function dispatchMenuOpen() {
        if (!canDispatch || dispatchInvoked) {
            return;
        }

        let win = null;
        try {
            win = getMainWindow();
        } catch (error) {
            logWithContext("warn", "Smoke test failed to retrieve main window", {
                error: error instanceof Error ? error.message : String(error),
            });
        }

        if (!win) {
            logWithContext("info", "Smoke test main window not yet available", {});
            scheduleRetry("main-window-unavailable");
            return;
        }

        const webContents = typeof win.webContents === "object" ? win.webContents : null;
        if (!webContents) {
            logWithContext("warn", "Smoke test window missing webContents", {});
            scheduleRetry("webcontents-missing");
            return;
        }

        if (typeof webContents.isDestroyed === "function" && webContents.isDestroyed()) {
            logWithContext("warn", "Smoke test window webContents destroyed before dispatch", {});
            scheduleRetry("webcontents-destroyed");
            return;
        }

        if (typeof webContents.isLoading === "function" && webContents.isLoading()) {
            logWithContext("info", "Smoke test waiting for did-finish-load before dispatch", {});
            if (typeof webContents.once === "function") {
                webContents.once("did-finish-load", () => {
                    attemptSend(win);
                });
                return;
            }
            scheduleRetry("webcontents-loading");
            return;
        }

        attemptSend(win);
    }

    resultListener = (_event, payload) => {
        const normalizedPayload = payload && typeof payload === "object" ? payload : {};
        const success = Boolean(normalizedPayload.success);
        finish(success ? 0 : 1, { payload: normalizedPayload });
    };

    ipcMain.on("smoke-test:result", resultListener);
    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
            finish(1, { reason: "timeout", timeoutMs });
        }, timeoutMs);
        if (typeof timeoutHandle.unref === "function") {
            timeoutHandle.unref();
        }
    }

    if (canDispatch) {
        const baseAttemptsWindow = timeoutMs > 0 ? timeoutMs : DEFAULT_SMOKE_TIMEOUT_MS;
        maxDispatchAttempts = Math.max(10, Math.ceil(baseAttemptsWindow / SMOKE_DISPATCH_RETRY_INTERVAL_MS));
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

        try {
            const app = appRef();
            if (app && typeof app.on === "function" && typeof app.removeListener === "function") {
                const createdListener = () => {
                    dispatchMenuOpen();
                };
                app.on("browser-window-created", createdListener);
                appListenerCleanup = () => {
                    try {
                        app.removeListener("browser-window-created", createdListener);
                    } catch {
                        /* noop */
                    }
                };
            }
        } catch (error) {
            logWithContext("warn", "Smoke test failed to attach browser-window-created listener", {
                error: error instanceof Error ? error.message : String(error),
            });
        }

        dispatchMenuOpen();
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
            if (retryTimeoutHandle) {
                clearTimeout(retryTimeoutHandle);
                retryTimeoutHandle = null;
            }
            if (rendererReadyListener) {
                ipcMain.removeListener("smoke-test:renderer-ready", rendererReadyListener);
                rendererReadyListener = null;
            }
            if (resultListener) {
                ipcMain.removeListener("smoke-test:result", resultListener);
                resultListener = null;
            }
            if (appListenerCleanup) {
                appListenerCleanup();
                appListenerCleanup = null;
            }
        } catch (error) {
            logWithContext("warn", "Failed to clean up smoke test handlers", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
        hasRegistered = false;
    };
}

module.exports = { registerSmokeTestHandlers };
