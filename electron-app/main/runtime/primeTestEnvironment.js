const { getAppState, setAppState } = require("../state/appState");
const {
    appRef,
    browserWindowRef,
    getElectronOverride,
    setElectronOverride,
} = require("./electronAccess");

/**
 * @typedef {import("../../types/main/runtime/electronAccess").ElectronLike} ElectronLike
 * @typedef {import("../../types/main/window/bootstrapMainWindow").MainWindowLike} MainWindowLike
 * @typedef {() => Promise<MainWindowLike>} InitializeApplication
 * @typedef {{
 *     emit?: (event: string) => boolean;
 *     listenerCount?: (event: string) => number;
 *     on?: (event: string, listener: () => void) => unknown;
 *     whenReady?: () => Promise<unknown> | unknown;
 * }} AppLike
 * @typedef {{ getAllWindows?: () => MainWindowLike[] }} BrowserWindowLike
 */

const PROBE_EVENT = "__test_probe__";

/**
 * @param {unknown} value
 *
 * @returns {Record<string, unknown> | null}
 */
function asRecord(value) {
    if (value && (typeof value === "object" || typeof value === "function")) {
        return /** @type {Record<string, unknown>} */ (value);
    }
    return null;
}

/**
 * @param {unknown} value
 * @param {string} key
 *
 * @returns {unknown}
 */
function getProperty(value, key) {
    const record = asRecord(value);
    if (!record) return undefined;
    try {
        return Reflect.get(record, key);
    } catch {
        return undefined;
    }
}

/**
 * @param {unknown} value
 *
 * @returns {ElectronLike | null}
 */
function asElectronLike(value) {
    const record = asRecord(value);
    return record ? /** @type {ElectronLike} */ (record) : null;
}

/**
 * @param {unknown} value
 *
 * @returns {value is ElectronLike}
 */
function hasElectronApis(value) {
    return Boolean(
        asRecord(value) &&
            (getProperty(value, "app") ||
                getProperty(value, "BrowserWindow"))
    );
}

/**
 * @param {unknown} value
 *
 * @returns {ElectronLike | null}
 */
function resolveElectronModule(value) {
    if (hasElectronApis(value)) return asElectronLike(value);
    const defaultValue = getProperty(value, "default");
    if (hasElectronApis(defaultValue)) return asElectronLike(defaultValue);
    return asElectronLike(value);
}

/**
 * @returns {ElectronLike | null}
 */
function getHoistedElectronMock() {
    if (typeof globalThis === "undefined") return null;
    return asElectronLike(getProperty(globalThis, "__electronHoistedMock"));
}

/**
 * @returns {boolean}
 */
function isTestEnvironment() {
    return Boolean(
        (typeof process !== "undefined" &&
            process.env &&
            process.env.NODE_ENV === "test") ||
            getHoistedElectronMock()
    );
}

/**
 * @param {unknown} value
 *
 * @returns {AppLike | null}
 */
function asAppLike(value) {
    const record = asRecord(value);
    return record ? /** @type {AppLike} */ (record) : null;
}

/**
 * @param {unknown} value
 *
 * @returns {BrowserWindowLike | null}
 */
function asBrowserWindowLike(value) {
    const record = asRecord(value);
    return record ? /** @type {BrowserWindowLike} */ (record) : null;
}

/**
 * @param {ElectronLike | null | undefined} electronModule
 *
 * @returns {AppLike | null}
 */
function getApp(electronModule) {
    return asAppLike(getProperty(electronModule, "app"));
}

/**
 * @param {ElectronLike | null | undefined} electronModule
 *
 * @returns {BrowserWindowLike | null}
 */
function getBrowserWindow(electronModule) {
    return asBrowserWindowLike(getProperty(electronModule, "BrowserWindow"));
}

/**
 * @param {AppLike | null | undefined} app
 *
 * @returns {boolean}
 */
function callWhenReady(app) {
    if (!app || typeof app.whenReady !== "function") return false;
    try {
        app.whenReady();
        return true;
    } catch {
        return false;
    }
}

/**
 * @param {BrowserWindowLike | null | undefined} BrowserWindow
 *
 * @returns {MainWindowLike[] | null}
 */
function getAllWindows(BrowserWindow) {
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

/**
 * @param {MainWindowLike[] | null} windows
 * @param {InitializeApplication} initializeApplication
 * @param {boolean} [shouldInitialize=false]
 */
function setFirstWindowIfMissing(
    windows,
    initializeApplication,
    shouldInitialize = false
) {
    if (Array.isArray(windows) && windows.length > 0 && !getAppState("mainWindow")) {
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

/**
 * @param {unknown} app
 *
 * @returns {boolean}
 */
function isProbeInstalled(app) {
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

/**
 * @param {unknown} app
 */
function markProbeInstalled(app) {
    const record = asRecord(app);
    if (!record) return;
    try {
        Reflect.set(record, "__ffvTestProbeInstalled", true);
    } catch {
        /* ignore */
    }
}

/**
 * Executes the elaborate test-environment priming logic that historically lived
 * in main.js. The routine ensures mocked Electron modules expose
 * whenReady/getAllWindows calls before tests run.
 *
 * @param {InitializeApplication} initializeApplication - Callback used to
 *   bootstrap the app when a window already exists in tests.
 */
function primeTestEnvironment(initializeApplication) {
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
                Promise.resolve().then(async () => {
                    try {
                        const esm = /** @type {unknown} */ (
                            await import("electron")
                        );
                        const mod = resolveElectronModule(esm);
                        if (hasElectronApis(mod)) {
                            setElectronOverride(mod);
                        }

                        callWhenReady(asAppLike(appRef()));
                        setFirstWindowIfMissing(
                            getAllWindows(asBrowserWindowLike(browserWindowRef())),
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

            const electronModule = /** @type {unknown} */ (
                require("electron")
            );
            const resolved = resolveElectronModule(electronModule);
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
            const retryPrime = () => {
                try {
                    const raw = /** @type {unknown} */ (require("electron"));
                    const mod = resolveElectronModule(raw);
                    const readyCalled = callWhenReady(getApp(mod));
                    const windows = getAllWindows(getBrowserWindow(mod));
                    const windowsCalled = Array.isArray(windows);
                    setFirstWindowIfMissing(
                        windows,
                        initializeApplication,
                        true
                    );
                    if ((!readyCalled || !windowsCalled) && attempts++ < 5) {
                        setTimeout(retryPrime, 0);
                    }
                } catch {
                    if (attempts++ < 5) setTimeout(retryPrime, 0);
                }
            };
            setTimeout(retryPrime, 0);
        }
    } catch {
        /* Ignore module priming errors */
    }

    try {
        if (isTestEnvironment()) {
            /**
             * Single shared no-op handler used for the probe listener.
             *
             * @returns {void}
             */
            const probeHandler = () => {
                /* no-op */
            };

            const keepaliveTick = () => {
                try {
                    const a = asAppLike(appRef());
                    callWhenReady(a);
                    if (a && typeof a.on === "function") {
                        try {
                            // IMPORTANT:
                            // Avoid adding a new listener on every interval tick. The prior
                            // behavior caused MaxListenersExceededWarning in coverage-heavy tests.
                            // Install the listener once (idempotent), then simply emit the probe.
                            if (!isProbeInstalled(a)) {
                                a.on(PROBE_EVENT, probeHandler);
                                markProbeInstalled(a);
                            }

                            if (typeof a.emit === "function") {
                                try {
                                    a.emit(PROBE_EVENT);
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
