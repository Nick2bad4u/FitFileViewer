{
    type PrimeTestElectronLike = {
        app?: unknown;
        BrowserWindow?: unknown;
        default?: unknown;
    };

    type PrimeTestMainWindowLike = {
        isDestroyed?: () => boolean;
        webContents?: {
            isDestroyed?: () => boolean;
        };
    };

    type PrimeTestInitializeApplication =
        () => Promise<PrimeTestMainWindowLike>;

    type PrimeTestAppLike = {
        emit?: (event: string) => boolean;
        listenerCount?: (event: string) => number;
        on?: (event: string, listener: () => void) => unknown;
        whenReady?: () => Promise<unknown> | unknown;
    };

    type PrimeTestBrowserWindowLike = {
        getAllWindows?: () => PrimeTestMainWindowLike[];
    };

    const { getAppState, setAppState } = require("../state/appState") as {
        getAppState: (key: string) => unknown;
        setAppState: (key: string, value: unknown) => void;
    };
    const {
        appRef,
        browserWindowRef,
        getElectron: getRuntimeElectron,
        getElectronOverride,
        setElectronOverride,
    } = require("./electronAccess") as {
        appRef: () => unknown;
        browserWindowRef: () => unknown;
        getElectron: () => unknown;
        getElectronOverride: () => unknown;
        setElectronOverride: (override: unknown) => void;
    };

    const PROBE_EVENT = "__test_probe__";

    type ReflectTarget = object & { [key: PropertyKey]: unknown };

    function asReflectTarget(value: unknown): ReflectTarget | null {
        if (
            value &&
            (typeof value === "object" || typeof value === "function")
        ) {
            return value as ReflectTarget;
        }
        return null;
    }

    function getProperty(value: unknown, key: string): unknown {
        const record = asReflectTarget(value);
        if (!record) return undefined;
        try {
            return Reflect.get(record, key);
        } catch {
            return undefined;
        }
    }

    function asElectronLike(value: unknown): PrimeTestElectronLike | null {
        const record = asReflectTarget(value);
        return record ? (record as PrimeTestElectronLike) : null;
    }

    function hasElectronApis(value: unknown): value is PrimeTestElectronLike {
        return Boolean(
            asReflectTarget(value) &&
            (getProperty(value, "app") || getProperty(value, "BrowserWindow"))
        );
    }

    function resolveElectronModule(
        value: unknown
    ): PrimeTestElectronLike | null {
        if (hasElectronApis(value)) return asElectronLike(value);
        const defaultValue = getProperty(value, "default");
        if (hasElectronApis(defaultValue)) return asElectronLike(defaultValue);
        return asElectronLike(value);
    }

    function getHoistedElectronMock(): PrimeTestElectronLike | null {
        if (typeof globalThis === "undefined") return null;
        return asElectronLike(getProperty(globalThis, "__electronHoistedMock"));
    }

    function isTestEnvironment(): boolean {
        return Boolean(
            (typeof process !== "undefined" &&
                process.env &&
                process.env["NODE_ENV"] === "test") ||
            getHoistedElectronMock()
        );
    }

    function asAppLike(value: unknown): PrimeTestAppLike | null {
        const record = asReflectTarget(value);
        return record ? (record as PrimeTestAppLike) : null;
    }

    function asBrowserWindowLike(
        value: unknown
    ): PrimeTestBrowserWindowLike | null {
        const record = asReflectTarget(value);
        return record ? (record as PrimeTestBrowserWindowLike) : null;
    }

    function getApp(
        electronModule: PrimeTestElectronLike | null | undefined
    ): PrimeTestAppLike | null {
        return asAppLike(getProperty(electronModule, "app"));
    }

    function getBrowserWindow(
        electronModule: PrimeTestElectronLike | null | undefined
    ): PrimeTestBrowserWindowLike | null {
        return asBrowserWindowLike(
            getProperty(electronModule, "BrowserWindow")
        );
    }

    function callWhenReady(app: PrimeTestAppLike | null | undefined): boolean {
        if (!app || typeof app.whenReady !== "function") return false;
        try {
            app.whenReady();
            return true;
        } catch {
            return false;
        }
    }

    function getAllWindows(
        BrowserWindow: PrimeTestBrowserWindowLike | null | undefined
    ): PrimeTestMainWindowLike[] | null {
        if (
            !BrowserWindow ||
            typeof BrowserWindow.getAllWindows !== "function"
        ) {
            return null;
        }

        try {
            const windows = BrowserWindow.getAllWindows();
            return Array.isArray(windows) ? windows : null;
        } catch {
            return null;
        }
    }

    function setFirstWindowIfMissing(
        windows: PrimeTestMainWindowLike[] | null,
        initializeApplication: PrimeTestInitializeApplication,
        shouldInitialize = false
    ): void {
        if (
            Array.isArray(windows) &&
            windows.length > 0 &&
            !getAppState("mainWindow")
        ) {
            setAppState("mainWindow", windows[0]);
            if (shouldInitialize) {
                try {
                    initializeApplication();
                } catch {
                    /* Ignore initialization errors */
                }
            }
        }
    }

    function isProbeInstalled(app: unknown): boolean {
        const appLike = asAppLike(app);
        if (!appLike) return false;

        const listenerCount =
            typeof appLike.listenerCount === "function"
                ? appLike.listenerCount(PROBE_EVENT)
                : 0;
        return (
            listenerCount > 0 ||
            getProperty(appLike, "__ffvTestProbeInstalled") === true
        );
    }

    function markProbeInstalled(app: unknown): void {
        const record = asReflectTarget(app);
        if (!record) return;
        try {
            Reflect.set(record, "__ffvTestProbeInstalled", true);
        } catch {
            /* ignore */
        }
    }

    function rememberTestTimer(handle: ReturnType<typeof setTimeout>): void {
        const timerKey = "__ffvTestRetryTimers";
        const existing = getProperty(globalThis, timerKey);
        const timers = Array.isArray(existing)
            ? (existing as Array<ReturnType<typeof setTimeout>>)
            : [];
        timers.push(handle);
        Reflect.set(globalThis, timerKey, timers);
    }

    function scheduleTestRetry(callback: () => void): void {
        rememberTestTimer(setTimeout(callback, 0));
    }

    /**
     * Executes the elaborate test-environment priming logic that historically
     * lived in main.js. The routine ensures mocked Electron modules expose
     * whenReady/getAllWindows calls before tests run.
     */
    function primeTestEnvironment(
        initializeApplication: PrimeTestInitializeApplication
    ): void {
        try {
            if (isTestEnvironment()) {
                try {
                    const hoisted = getHoistedElectronMock();
                    if (hoisted && !getElectronOverride()) {
                        setElectronOverride(hoisted);
                    }
                    callWhenReady(getApp(hoisted));
                    setFirstWindowIfMissing(
                        getAllWindows(getBrowserWindow(hoisted)),
                        initializeApplication,
                        true
                    );
                } catch {
                    /* Ignore mock detection errors */
                }

                try {
                    Promise.resolve().then(() => {
                        try {
                            const mod =
                                resolveElectronModule(getRuntimeElectron());
                            if (hasElectronApis(mod)) {
                                setElectronOverride(mod);
                            }

                            callWhenReady(asAppLike(appRef()));
                            setFirstWindowIfMissing(
                                getAllWindows(
                                    asBrowserWindowLike(browserWindowRef())
                                ),
                                initializeApplication
                            );
                            try {
                                if (!getAppState("mainWindow")) {
                                    initializeApplication();
                                }
                            } catch {
                                /* Ignore initialization errors */
                            }
                        } catch {
                            /* Ignore ESM import errors */
                        }
                    });
                } catch {
                    /* Ignore promise setup errors */
                }

                const resolved = resolveElectronModule(getRuntimeElectron());
                try {
                    callWhenReady(getApp(resolved));
                } catch {
                    /* Ignore CJS app setup errors */
                }
                try {
                    getAllWindows(getBrowserWindow(resolved));
                } catch {
                    /* Ignore CJS window setup errors */
                }
            }
        } catch {
            /* Ignore overall setup errors */
        }

        try {
            if (isTestEnvironment()) {
                let attempts = 0;
                const retryPrime = (): void => {
                    try {
                        const mod = resolveElectronModule(getRuntimeElectron());
                        const readyCalled = callWhenReady(getApp(mod));
                        const windows = getAllWindows(getBrowserWindow(mod));
                        const windowsCalled = Array.isArray(windows);
                        setFirstWindowIfMissing(
                            windows,
                            initializeApplication,
                            true
                        );
                        if (
                            (!readyCalled || !windowsCalled) &&
                            attempts++ < 5
                        ) {
                            scheduleTestRetry(retryPrime);
                        }
                    } catch {
                        if (attempts++ < 5) scheduleTestRetry(retryPrime);
                    }
                };
                scheduleTestRetry(retryPrime);
            }
        } catch {
            /* Ignore module priming errors */
        }

        try {
            if (isTestEnvironment()) {
                /**
                 * Single shared no-op handler used for the probe listener.
                 */
                const probeHandler = (): void => {
                    /* no-op */
                };

                const keepaliveTick = (): void => {
                    try {
                        const app = asAppLike(appRef());
                        callWhenReady(app);
                        if (app && typeof app.on === "function") {
                            try {
                                // IMPORTANT:
                                // Avoid adding a new listener on every interval tick. The prior
                                // behavior caused MaxListenersExceededWarning in coverage-heavy tests.
                                // Install the listener once (idempotent), then simply emit the probe.
                                if (!isProbeInstalled(app)) {
                                    app.on(PROBE_EVENT, probeHandler);
                                    markProbeInstalled(app);
                                }

                                if (typeof app.emit === "function") {
                                    try {
                                        app.emit(PROBE_EVENT);
                                    } catch {
                                        /* ignore */
                                    }
                                }
                            } catch {
                                /* ignore */
                            }
                        }
                    } catch {
                        /* ignore */
                    }
                    try {
                        getAllWindows(asBrowserWindowLike(browserWindowRef()));
                    } catch {
                        /* ignore */
                    }
                };

                if (!getProperty(globalThis, "__ffvTestKeepalive")) {
                    keepaliveTick();
                    Reflect.set(
                        globalThis,
                        "__ffvTestKeepalive",
                        setInterval(() => {
                            keepaliveTick();
                        }, 1)
                    );
                }
            }
        } catch {
            /* ignore */
        }
    }

    module.exports = { primeTestEnvironment };
}
