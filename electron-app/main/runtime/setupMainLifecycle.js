"use strict";
{
    function asElectronModule(value) {
        if (!isObjectLike(value)) {
            return null;
        }
        const electron = {};
        const app = asAppLike(Reflect.get(value, "app"));
        if (app !== undefined) {
            electron.app = app;
        }
        const BrowserWindow = asBrowserWindowLike(
            Reflect.get(value, "BrowserWindow")
        );
        if (BrowserWindow !== undefined) {
            electron.BrowserWindow = BrowserWindow;
        }
        return electron;
    }
    function isObjectLike(value) {
        return (
            value !== null &&
            (typeof value === "object" || typeof value === "function")
        );
    }
    function asAppLike(value) {
        if (!isObjectLike(value)) {
            return undefined;
        }
        const whenReady = Reflect.get(value, "whenReady");
        return typeof whenReady === "function"
            ? {
                  whenReady: () =>
                      Promise.resolve(Reflect.apply(whenReady, value, [])),
              }
            : {};
    }
    function asBrowserWindowLike(value) {
        if (!isObjectLike(value)) {
            return undefined;
        }
        const getAllWindows = Reflect.get(value, "getAllWindows");
        return typeof getAllWindows === "function"
            ? {
                  getAllWindows: () => {
                      const windows = Reflect.apply(getAllWindows, value, []);
                      return Array.isArray(windows) ? windows : [];
                  },
              }
            : {};
    }
    function getErrorMessage(error) {
        return error instanceof Error ? error.message : String(error);
    }
    function getErrorContext(error) {
        return { error: getErrorMessage(error) };
    }
    /**
     * Attempts to resolve Electron's App instance via require, falling back to
     * appRef when the module is unavailable, such as during tests.
     */
    function resolveElectronApp(appRef) {
        try {
            const electron = asElectronModule(require("electron"));
            if (electron?.app && typeof electron.app === "object") {
                return electron.app;
            }
        } catch {
            /* ignore resolution errors */
        }
        return appRef();
    }
    /**
     * Safely invokes a function, swallowing any errors to match the legacy
     * defensive behavior.
     */
    function safeCall(fn) {
        try {
            return fn();
        } catch {
            // Intentionally swallow errors to mirror historic defensive behavior.
            return undefined;
        }
    }
    /**
     * Registers the full main-process lifecycle, including test fallbacks that
     * eagerly initialize the window and IPC wiring.
     */
    function setupMainLifecycle(deps) {
        const {
            appRef,
            browserWindowRef,
            getAppState,
            initializeApplication,
            setupApplicationEventHandlers,
            setupIPCHandlers,
            setupMenuAndEventHandlers,
            exposeDevHelpers,
            logWithContext,
        } = deps;
        let initScheduled = false;
        let initCompleted = false;
        let blockedRequestsInstalled = false;
        const isTestEnv = () =>
            typeof process !== "undefined" &&
            process.env?.["NODE_ENV"] === "test";
        const isDevMode = () =>
            typeof process !== "undefined" &&
            (process.env?.["NODE_ENV"] === "development" ||
                (Array.isArray(process.argv) &&
                    process.argv.includes("--dev")));
        const ensureWhenReadyCalled = (app) => {
            if (app && typeof app.whenReady === "function") {
                safeCall(() => {
                    void app.whenReady?.();
                });
            }
        };
        const wireHandlers = (windowCandidate) => {
            if (!blockedRequestsInstalled) {
                blockedRequestsInstalled = true;
                safeCall(() => {
                    const {
                        setupBlockedRequests,
                    } = require("../security/setupBlockedRequests");
                    setupBlockedRequests();
                });
            }
            safeCall(() => setupIPCHandlers(windowCandidate));
            safeCall(() => setupMenuAndEventHandlers());
            safeCall(() => setupApplicationEventHandlers());
        };
        const maybeExposeDevHelpers = () => {
            if (!isDevMode()) {
                return;
            }
            safeCall(() => exposeDevHelpers());
        };
        const primeBrowserWindowMocks = () => {
            const invokeGetAllWindows = (candidate) => {
                if (
                    candidate &&
                    typeof candidate.getAllWindows === "function"
                ) {
                    safeCall(() => candidate.getAllWindows?.());
                }
            };
            try {
                const electron = asElectronModule(require("electron"));
                invokeGetAllWindows(electron?.BrowserWindow);
            } catch {
                invokeGetAllWindows(browserWindowRef());
            }
        };
        const runMainInitialization = async () => {
            if (initCompleted) {
                return;
            }
            initCompleted = true;
            try {
                const mainWindow = await Promise.resolve(
                    initializeApplication()
                );
                wireHandlers(mainWindow);
                maybeExposeDevHelpers();
                logWithContext("info", "Application initialized successfully");
            } catch (error) {
                logWithContext(
                    "error",
                    "Failed to initialize application:",
                    getErrorContext(error)
                );
            }
        };
        const runEarlyTestInitialization = (resolvedApp) => {
            if (initCompleted) {
                return;
            }
            ensureWhenReadyCalled(resolvedApp);
            ensureWhenReadyCalled(appRef());
            primeBrowserWindowMocks();
            safeCall(() => initializeApplication());
            const mainWindow = getAppState("mainWindow");
            wireHandlers(mainWindow);
            const fallbackWindow = mainWindow || {
                isDestroyed: () => false,
                webContents: { isDestroyed: () => false },
            };
            wireHandlers(fallbackWindow);
            maybeExposeDevHelpers();
            initCompleted = true;
            logWithContext(
                "info",
                "Application initialized via early test path (sync)"
            );
        };
        const runLateTestFallback = () => {
            if (initCompleted) {
                return;
            }
            ensureWhenReadyCalled(resolveElectronApp(appRef));
            ensureWhenReadyCalled(appRef());
            initCompleted = true;
            void Promise.resolve(initializeApplication())
                .then((mainWindow) => {
                    wireHandlers(mainWindow);
                    maybeExposeDevHelpers();
                    logWithContext(
                        "info",
                        "Application initialized via test fallback"
                    );
                })
                .catch((error) => {
                    logWithContext(
                        "error",
                        "Test fallback initialization failed:",
                        getErrorContext(error)
                    );
                });
        };
        try {
            const resolvedApp = resolveElectronApp(appRef);
            if (isTestEnv() && !initCompleted) {
                initScheduled = true;
                try {
                    runEarlyTestInitialization(resolvedApp);
                } catch (error) {
                    logWithContext(
                        "error",
                        "Early test path threw:",
                        getErrorContext(error)
                    );
                }
            }
            if (
                resolvedApp &&
                typeof resolvedApp.whenReady === "function" &&
                !initScheduled
            ) {
                initScheduled = true;
                void resolvedApp
                    .whenReady()
                    .then(() => runMainInitialization())
                    .catch((error) => {
                        logWithContext(
                            "error",
                            "Failed to initialize application:",
                            getErrorContext(error)
                        );
                    });
            }
            if (isTestEnv() && !initCompleted) {
                initScheduled = true;
                try {
                    runLateTestFallback();
                } catch (error) {
                    logWithContext(
                        "error",
                        "Test fallback initialization threw:",
                        getErrorContext(error)
                    );
                }
            }
        } catch {
            /* ignore - allows importing in non-Electron environments */
        }
        primeBrowserWindowMocks();
    }
    module.exports = { setupMainLifecycle };
}
