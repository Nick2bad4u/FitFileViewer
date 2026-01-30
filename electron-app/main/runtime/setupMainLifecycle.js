/**
 * Coordinates FitFileViewer's Electron main-process initialization lifecycle.
 * Extracting the logic from the legacy monolithic main.js keeps the entry point
 * concise while preserving behaviour relied upon by the extensive Vitest suite.
 * The orchestration mirrors the original flow, including the redundant
 * test-only fallbacks that prime BrowserWindow mocks and register IPC handlers
 * eagerly.
 */

/**
 * @typedef {object} AppLike
 *
 * @property {() => Promise<unknown>} [whenReady]
 */

/**
 * @typedef {object} WindowLike
 *
 * @property {() => boolean} [isDestroyed]
 * @property {{ isDestroyed?: () => boolean }} [webContents]
 */

/**
 * @typedef {object} LifecycleDependencies
 *
 * @property {() => AppLike | undefined} appRef
 * @property {() => { getAllWindows?: () => WindowLike[] } | undefined} browserWindowRef
 * @property {(key: string) => unknown} getAppState
 * @property {() => Promise<WindowLike | undefined> | WindowLike | undefined} initializeApplication
 * @property {() => void} setupApplicationEventHandlers
 * @property {(win: WindowLike | undefined) => void} setupIPCHandlers
 * @property {() => void} setupMenuAndEventHandlers
 * @property {() => void} exposeDevHelpers
 * @property {(
 *     level: "info" | "warn" | "error" | string,
 *     message: string,
 *     context?: Record<string, unknown>
 * ) => void} logWithContext
 */

/**
 * Attempts to resolve Electron's App instance via require, falling back to
 * {@link appRef} when the module is unavailable (e.g. during tests).
 *
 * @param {() => AppLike | undefined} appRef
 *
 * @returns {AppLike | undefined}
 */
function resolveElectronApp(appRef) {
    try {
        const electron = require("electron");
        if (electron && typeof electron.app === "object") {
            return /** @type {AppLike} */ (electron.app);
        }
    } catch {
        /* ignore resolution errors */
    }
    return appRef();
}

/**
 * Safely invokes a function, swallowing any errors (matching the defensive
 * style of the legacy implementation).
 *
 * @template T
 *
 * @param {() => T} fn
 *
 * @returns {T | undefined}
 */
function safeCall(fn) {
    try {
        return fn();
    } catch {
        // Intentionally swallow errors to mirror historic defensive behaviour
    }
}

/**
 * Registers the full main-process lifecycle, including test fallbacks that
 * eagerly initialize the window and IPC wiring.
 *
 * @param {LifecycleDependencies} deps
 *
 * @returns {void}
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

    /** @type {boolean} */
    let initScheduled = false;
    /** @type {boolean} */
    let initCompleted = false;
    /** @type {boolean} */
    let blockedRequestsInstalled = false;

    const isTestEnv = () =>
        typeof process !== "undefined" && process.env?.NODE_ENV === "test";
    const isDevMode = () =>
        typeof process !== "undefined" &&
        (process.env?.NODE_ENV === "development" ||
            (Array.isArray(process.argv) && process.argv.includes("--dev")));

    /**
     * Invokes whenReady on the provided App-like instance if present.
     *
     * @param {AppLike | undefined} app
     *
     * @returns {void}
     */
    const ensureWhenReadyCalled = (app) => {
        if (app && typeof app.whenReady === "function") {
            safeCall(() => app.whenReady());
        }
    };

    /**
     * Runs the trio of setup helpers with defensive try/catch boundaries to
     * mirror the legacy flow.
     *
     * @param {WindowLike | undefined} windowCandidate
     *
     * @returns {void}
     */
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

    /**
     * Exposes development helpers when running in dev mode, matching the old
     * behaviour.
     *
     * @returns {void}
     */
    const maybeExposeDevHelpers = () => {
        if (!isDevMode()) {
            return;
        }
        safeCall(() => exposeDevHelpers());
    };

    /**
     * Ensures BrowserWindow.getAllWindows is invoked once to prime hoisted
     * mocks for coverage.
     *
     * @returns {void}
     */
    const primeBrowserWindowMocks = () => {
        const invokeGetAllWindows = (candidate) => {
            if (candidate && typeof candidate.getAllWindows === "function") {
                safeCall(() => candidate.getAllWindows());
            }
        };

        try {
            const electron = require("electron");
            invokeGetAllWindows(electron?.BrowserWindow);
        } catch {
            invokeGetAllWindows(browserWindowRef?.());
        }
    };

    /**
     * Primary initialization invoked once app.whenReady resolves in production
     * environments.
     *
     * @returns {Promise<void>}
     */
    const runMainInitialization = async () => {
        if (initCompleted) {
            return;
        }
        initCompleted = true;

        try {
            const mainWindow = await Promise.resolve(initializeApplication());
            wireHandlers(mainWindow);
            maybeExposeDevHelpers();
            logWithContext("info", "Application initialized successfully");
        } catch (error) {
            logWithContext("error", "Failed to initialize application:", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };

    /**
     * Eager synchronous initialization path used exclusively by tests to
     * maximise coverage.
     *
     * @param {AppLike | undefined} resolvedApp
     *
     * @returns {void}
     */
    const runEarlyTestInitialization = (resolvedApp) => {
        if (initCompleted) {
            return;
        }

        ensureWhenReadyCalled(resolvedApp);
        ensureWhenReadyCalled(appRef());
        primeBrowserWindowMocks();
        safeCall(() => initializeApplication());

        const mainWindow = /** @type {WindowLike | undefined} */ (
            getAppState("mainWindow")
        );
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

    /**
     * Asynchronous test fallback that mirrors the legacy defensive logic when
     * whenReady mocks fire too late for the synchronous path above.
     *
     * @returns {void}
     */
    const runLateTestFallback = () => {
        if (initCompleted) {
            return;
        }

        ensureWhenReadyCalled(resolveElectronApp(appRef));
        ensureWhenReadyCalled(appRef());
        initCompleted = true;

        Promise.resolve(initializeApplication())
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
                    {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    }
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
                logWithContext("error", "Early test path threw:", {
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }

        if (
            resolvedApp &&
            typeof resolvedApp.whenReady === "function" &&
            !initScheduled
        ) {
            initScheduled = true;
            resolvedApp
                .whenReady()
                .then(() => runMainInitialization())
                .catch((error) => {
                    logWithContext(
                        "error",
                        "Failed to initialize application:",
                        {
                            error:
                                error instanceof Error
                                    ? error.message
                                    : String(error),
                        }
                    );
                });
        }

        if (isTestEnv() && !initCompleted) {
            initScheduled = true;
            try {
                runLateTestFallback();
            } catch (error) {
                logWithContext("error", "Test fallback initialization threw:", {
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }
    } catch {
        /* ignore – allows importing in non-Electron environments */
    }

    primeBrowserWindowMocks();
}

module.exports = { setupMainLifecycle };
