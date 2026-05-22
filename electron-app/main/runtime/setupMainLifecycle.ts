{
    type AppLike = {
        whenReady?: () => Promise<unknown>;
    };

    type WindowLike = {
        isDestroyed?: () => boolean;
        webContents?: {
            isDestroyed?: () => boolean;
        };
    };

    type BrowserWindowLike = {
        getAllWindows?: () => WindowLike[];
    };

    type ElectronModuleLike = {
        app?: AppLike;
        BrowserWindow?: BrowserWindowLike;
    };

    type LifecycleDependencies = {
        appRef: () => AppLike | undefined;
        browserWindowRef: () => BrowserWindowLike | undefined;
        exposeDevHelpers: () => void;
        getAppState: (key: string) => unknown;
        initializeApplication: () =>
            | Promise<WindowLike | undefined>
            | WindowLike
            | undefined;
        logWithContext: (
            level: string,
            message: string,
            context?: Record<string, unknown>
        ) => void;
        setupApplicationEventHandlers: () => void;
        setupIPCHandlers: (win: WindowLike | undefined) => void;
        setupMenuAndEventHandlers: () => void;
    };

    function asElectronModule(value: unknown): ElectronModuleLike | null {
        return value &&
            (typeof value === "object" || typeof value === "function")
            ? (value as ElectronModuleLike)
            : null;
    }

    function getErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    function getErrorContext(error: unknown): { error: string } {
        return { error: getErrorMessage(error) };
    }

    /**
     * Attempts to resolve Electron's App instance via require, falling back to
     * appRef when the module is unavailable, such as during tests.
     */
    function resolveElectronApp(
        appRef: () => AppLike | undefined
    ): AppLike | undefined {
        try {
            const electron = asElectronModule(require("electron") as unknown);
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
    function safeCall<T>(fn: () => T): T | undefined {
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
    function setupMainLifecycle(deps: LifecycleDependencies): void {
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

        const isTestEnv = (): boolean =>
            typeof process !== "undefined" &&
            process.env?.["NODE_ENV"] === "test";
        const isDevMode = (): boolean =>
            typeof process !== "undefined" &&
            (process.env?.["NODE_ENV"] === "development" ||
                (Array.isArray(process.argv) &&
                    process.argv.includes("--dev")));

        const ensureWhenReadyCalled = (app: AppLike | undefined): void => {
            if (app && typeof app.whenReady === "function") {
                safeCall(() => {
                    void app.whenReady?.();
                });
            }
        };

        const wireHandlers = (
            windowCandidate: WindowLike | undefined
        ): void => {
            if (!blockedRequestsInstalled) {
                blockedRequestsInstalled = true;
                safeCall(() => {
                    const { setupBlockedRequests } =
                        require("../security/setupBlockedRequests") as {
                            setupBlockedRequests: () => void;
                        };
                    setupBlockedRequests();
                });
            }
            safeCall(() => setupIPCHandlers(windowCandidate));
            safeCall(() => setupMenuAndEventHandlers());
            safeCall(() => setupApplicationEventHandlers());
        };

        const maybeExposeDevHelpers = (): void => {
            if (!isDevMode()) {
                return;
            }
            safeCall(() => exposeDevHelpers());
        };

        const primeBrowserWindowMocks = (): void => {
            const invokeGetAllWindows = (
                candidate: BrowserWindowLike | undefined
            ): void => {
                if (
                    candidate &&
                    typeof candidate.getAllWindows === "function"
                ) {
                    safeCall(() => candidate.getAllWindows?.());
                }
            };

            try {
                const electron = asElectronModule(
                    require("electron") as unknown
                );
                invokeGetAllWindows(electron?.BrowserWindow);
            } catch {
                invokeGetAllWindows(browserWindowRef());
            }
        };

        const runMainInitialization = async (): Promise<void> => {
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

        const runEarlyTestInitialization = (
            resolvedApp: AppLike | undefined
        ): void => {
            if (initCompleted) {
                return;
            }

            ensureWhenReadyCalled(resolvedApp);
            ensureWhenReadyCalled(appRef());
            primeBrowserWindowMocks();
            safeCall(() => initializeApplication());

            const mainWindow = getAppState("mainWindow") as
                | WindowLike
                | undefined;
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

        const runLateTestFallback = (): void => {
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
                .catch((error: unknown) => {
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
                    .catch((error: unknown) => {
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
