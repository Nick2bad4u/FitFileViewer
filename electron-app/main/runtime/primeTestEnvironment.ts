import {
    appRef,
    browserWindowRef,
    getElectron as getRuntimeElectron,
    getElectronOverride,
    setElectronOverride,
} from "./electronAccess.js";
import { isTestEnvironment as isRuntimeTestEnvironment } from "../../utils/runtime/processEnvironment.js";
import {
    getMainWindow,
    setMainWindow,
} from "../state/appState.js";
import type {
    MainProcessIntervalHandle,
    MainProcessTimerHandle,
} from "./mainProcessTimerHandle.js";

let clearPrimeTestEnvironmentTimersImpl: (() => void) | undefined;
let primeTestEnvironmentImpl:
    | ((initializeApplication: () => Promise<PrimeTestMainWindowLike>) => void)
    | undefined;

type PrimeTestMainWindowLike = {
    isDestroyed?: () => boolean;
    webContents?: {
        isDestroyed?: () => boolean;
    };
};

{
    type PrimeTestElectronLike = {
        app?: unknown;
        BrowserWindow?: unknown;
        default?: unknown;
    };

    type PrimeTestInitializeApplication =
        () => Promise<PrimeTestMainWindowLike>;

    type PrimeTestAppLike = {
        emit?: (event: string) => boolean;
        listenerCount?: (event: string) => number;
        on?: (event: string, listener: () => void) => unknown;
        whenReady?: () => unknown;
    };

    type PrimeTestBrowserWindowLike = {
        getAllWindows?: () => PrimeTestMainWindowLike[];
    };

    type PrimeTestPropertyCandidate = PrimeTestElectronLike &
        PrimeTestAppLike &
        PrimeTestBrowserWindowLike & {
            readonly [property: string]: unknown;
        };

    const PROBE_EVENT = "__test_probe__";
    const PROBE_INSTALLED_APPS = new WeakSet<object>();

    function asPropertyCandidate(
        value: unknown
    ): PrimeTestPropertyCandidate | null {
        if (
            value &&
            (typeof value === "object" || typeof value === "function")
        ) {
            return value as PrimeTestPropertyCandidate;
        }
        return null;
    }

    function getProperty(value: unknown, key: string): unknown {
        const record = asPropertyCandidate(value);
        if (!record) return undefined;
        try {
            return record[key];
        } catch {
            return undefined;
        }
    }

    function asElectronLike(value: unknown): PrimeTestElectronLike | null {
        const record = asPropertyCandidate(value);
        return record || null;
    }

    function hasElectronApis(value: unknown): value is PrimeTestElectronLike {
        return Boolean(
            asPropertyCandidate(value) &&
            (getProperty(value, "app") || getProperty(value, "BrowserWindow"))
        );
    }

    function resolveElectronModule(
        value: unknown
    ): PrimeTestElectronLike | null {
        if (hasElectronApis(value)) return value;
        const defaultValue = getProperty(value, "default");
        if (hasElectronApis(defaultValue)) return defaultValue;
        return asElectronLike(value);
    }

    function isTestEnvironment(): boolean {
        return Boolean(
            isRuntimeTestEnvironment() || hasElectronApis(getElectronOverride())
        );
    }

    function asAppLike(value: unknown): PrimeTestAppLike | null {
        const record = asPropertyCandidate(value);
        return record || null;
    }

    function asBrowserWindowLike(
        value: unknown
    ): PrimeTestBrowserWindowLike | null {
        const record = asPropertyCandidate(value);
        return record || null;
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
            !getMainWindow()
        ) {
            const firstWindow = windows[0];
            if (!firstWindow) {
                return;
            }
            setMainWindow(firstWindow);
            if (shouldInitialize) {
                try {
                    ignoreSettledPromise(initializeApplication());
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
        return listenerCount > 0 || PROBE_INSTALLED_APPS.has(appLike);
    }

    function markProbeInstalled(app: unknown): void {
        const record = asPropertyCandidate(app);
        if (!record) return;
        PROBE_INSTALLED_APPS.add(record);
    }

    let testKeepaliveTimer: MainProcessIntervalHandle | undefined;
    const testRetryTimers = new Set<MainProcessTimerHandle>();

    function rememberTestTimer(handle: MainProcessTimerHandle): void {
        testRetryTimers.add(handle);
    }

    function scheduleTestRetry(callback: () => void): void {
        rememberTestTimer(setTimeout(callback, 0));
    }

    function ignoreSettledPromise(value: unknown): void {
        if (!value || typeof value !== "object" || !("then" in value)) {
            return;
        }

        void Promise.resolve(value).catch(() => undefined);
    }

    function primeRuntimeElectronAsync(
        initializeApplication: PrimeTestInitializeApplication
    ): void {
        void Promise.resolve().then(
            () => {
                try {
                    const mod = resolveElectronModule(getRuntimeElectron());
                    if (hasElectronApis(mod)) {
                        setElectronOverride(mod);
                    }

                    callWhenReady(asAppLike(appRef()));
                    setFirstWindowIfMissing(
                        getAllWindows(asBrowserWindowLike(browserWindowRef())),
                        initializeApplication
                    );
                    try {
                        if (!getMainWindow()) {
                            ignoreSettledPromise(initializeApplication());
                        }
                    } catch {
                        /* Ignore initialization errors */
                    }
                } catch {
                    /* Ignore ESM import errors */
                }
                return undefined;
            },
            () => undefined
        );
    }

    function scheduleRetryPrime(
        initializeApplication: PrimeTestInitializeApplication
    ): void {
        let attempts = 0;
        const shouldRetry = (): boolean => {
            if (attempts >= 5) {
                return false;
            }
            attempts += 1;
            return true;
        };

        const retryPrime = (): void => {
            try {
                const mod = resolveElectronModule(getRuntimeElectron());
                const readyCalled = callWhenReady(getApp(mod));
                const windows = getAllWindows(getBrowserWindow(mod));
                const windowsCalled = Array.isArray(windows);
                setFirstWindowIfMissing(windows, initializeApplication, true);
                if ((!readyCalled || !windowsCalled) && shouldRetry()) {
                    scheduleTestRetry(retryPrime);
                }
            } catch {
                if (shouldRetry()) scheduleTestRetry(retryPrime);
            }
        };

        scheduleTestRetry(retryPrime);
    }

    function probeHandler(): void {
        /* no-op */
    }

    function emitProbe(app: PrimeTestAppLike): void {
        if (typeof app.emit !== "function") {
            return;
        }

        try {
            app.emit(PROBE_EVENT);
        } catch {
            /* ignore */
        }
    }

    function ensureProbeListener(app: PrimeTestAppLike): void {
        if (typeof app.on !== "function") {
            return;
        }

        try {
            if (!isProbeInstalled(app)) {
                app.on(PROBE_EVENT, probeHandler);
                markProbeInstalled(app);
            }
            emitProbe(app);
        } catch {
            /* ignore */
        }
    }

    function keepaliveTick(): void {
        try {
            const app = asAppLike(appRef());
            callWhenReady(app);
            if (app) {
                ensureProbeListener(app);
            }
        } catch {
            /* ignore */
        }
        try {
            getAllWindows(asBrowserWindowLike(browserWindowRef()));
        } catch {
            /* ignore */
        }
    }

    function installTestKeepalive(): void {
        if (testKeepaliveTimer) {
            return;
        }

        keepaliveTick();
        testKeepaliveTimer = setInterval(() => {
            keepaliveTick();
        }, 1);
    }

    function clearPrimeTestEnvironmentTimers(): void {
        if (testKeepaliveTimer) {
            clearInterval(testKeepaliveTimer);
            testKeepaliveTimer = undefined;
        }

        for (const timer of testRetryTimers) {
            clearTimeout(timer);
        }
        testRetryTimers.clear();
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
                    const override = resolveElectronModule(
                        getElectronOverride()
                    );
                    const runtimeElectron = hasElectronApis(override)
                        ? override
                        : resolveElectronModule(getRuntimeElectron());
                    if (
                        hasElectronApis(runtimeElectron) &&
                        !getElectronOverride()
                    ) {
                        setElectronOverride(runtimeElectron);
                    }
                    callWhenReady(getApp(runtimeElectron));
                    setFirstWindowIfMissing(
                        getAllWindows(getBrowserWindow(runtimeElectron)),
                        initializeApplication,
                        true
                    );
                } catch {
                    /* Ignore mock detection errors */
                }

                primeRuntimeElectronAsync(initializeApplication);

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
                scheduleRetryPrime(initializeApplication);
            }
        } catch {
            /* Ignore module priming errors */
        }

        try {
            if (isTestEnvironment()) {
                installTestKeepalive();
            }
        } catch {
            /* ignore */
        }
    }

    clearPrimeTestEnvironmentTimersImpl = clearPrimeTestEnvironmentTimers;
    primeTestEnvironmentImpl = primeTestEnvironment;
}

export function clearPrimeTestEnvironmentTimers(): void {
    clearPrimeTestEnvironmentTimersImpl?.();
}

export function primeTestEnvironment(
    initializeApplication: () => Promise<PrimeTestMainWindowLike>
): void {
    primeTestEnvironmentImpl?.(initializeApplication);
}
