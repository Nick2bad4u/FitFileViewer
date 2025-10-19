const { getAppState, setAppState } = require("../state/appState");
const { appRef, browserWindowRef, getElectronOverride, setElectronOverride } = require("./electronAccess");

/**
 * Executes the elaborate test-environment priming logic that historically lived in main.js. The
 * routine ensures mocked Electron modules expose whenReady/getAllWindows calls before tests run.
 *
 * @param {() => Promise<any>} initializeApplication - Function used to bootstrap the app when a
 * window already exists in tests.
 */
function primeTestEnvironment(initializeApplication) {
    try {
        if (
            (typeof process !== "undefined" && process.env && /** @type {any} */ (process.env).NODE_ENV === "test") ||
            (typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).__electronHoistedMock)
        ) {
            try {
                const g = /** @type {any} */ (
                    (typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).__electronHoistedMock) || null
                );
                if (g && !getElectronOverride()) setElectronOverride(g);
                const a0 = g && g.app;
                if (a0 && typeof a0.whenReady === "function") {
                    try {
                        a0.whenReady();
                    } catch {
                        /* Ignore initialization errors */
                    }
                }
                const BW0 = g && g.BrowserWindow;
                if (BW0 && typeof BW0.getAllWindows === "function") {
                    try {
                        BW0.getAllWindows();
                    } catch {
                        /* Ignore mock setup errors */
                    }
                    try {
                        const list0 = BW0.getAllWindows();
                        if (Array.isArray(list0) && list0.length > 0 && !getAppState("mainWindow")) {
                            setAppState("mainWindow", list0[0]);
                            try {
                                initializeApplication();
                            } catch {
                                /* Ignore initialization errors */
                            }
                        }
                    } catch {
                        /* Ignore window enumeration errors */
                    }
                }
            } catch {
                /* Ignore mock detection errors */
            }

            try {
                Promise.resolve().then(async () => {
                    try {
                        const esm = /** @type {any} */ (await import("electron"));
                        const mod = esm && (esm.app || esm.BrowserWindow) ? esm : esm && esm.default ? esm.default : esm;
                        if (mod && (mod.app || mod.BrowserWindow)) {
                            setElectronOverride(mod);
                        }
                        const a = appRef();
                        if (a && typeof a.whenReady === "function") {
                            try {
                                a.whenReady();
                            } catch {
                                /* Ignore app setup errors */
                            }
                        }
                        const BW = browserWindowRef();
                        if (BW && typeof BW.getAllWindows === "function") {
                            try {
                                BW.getAllWindows();
                            } catch {
                                /* Ignore window enumeration errors */
                            }
                            try {
                                const list = BW.getAllWindows();
                                if (Array.isArray(list) && list.length > 0 && !getAppState("mainWindow")) {
                                    setAppState("mainWindow", list[0]);
                                }
                            } catch {
                                /* Ignore window access errors */
                            }
                        }
                        try {
                            if (!getAppState("mainWindow")) initializeApplication();
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

            const electronModule = /** @type {any} */ (require("electron"));
            const resolved =
                electronModule && (electronModule.app || electronModule.BrowserWindow)
                    ? electronModule
                    : electronModule && electronModule.default
                        ? electronModule.default
                        : electronModule;
            try {
                const a = resolved && resolved.app;
                if (a && typeof a.whenReady === "function") {
                    a.whenReady();
                }
            } catch {
                /* Ignore CJS app setup errors */
            }
            try {
                const BW = resolved && resolved.BrowserWindow;
                if (BW && typeof BW.getAllWindows === "function") {
                    BW.getAllWindows();
                }
            } catch {
                /* Ignore CJS window setup errors */
            }
        }
    } catch {
        /* Ignore overall setup errors */
    }

    try {
        if (
            (typeof process !== "undefined" && process.env && /** @type {any} */ (process.env).NODE_ENV === "test") ||
            (typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).__electronHoistedMock)
        ) {
            let attempts = 0;
            const retryPrime = () => {
                try {
                    const raw = /** @type {any} */ (require("electron"));
                    const mod = raw && (raw.app || raw.BrowserWindow) ? raw : raw && raw.default ? raw.default : raw;
                    const app = (() => {
                        try {
                            const descriptor = Object.getOwnPropertyDescriptor(mod, "app");
                            if (descriptor && typeof descriptor.get === "function") return descriptor.get.call(mod);
                        } catch {
                            /* Ignore property descriptor access errors */
                        }
                        return mod && mod.app;
                    })();
                    const BW = (() => {
                        try {
                            const descriptor = Object.getOwnPropertyDescriptor(mod, "BrowserWindow");
                            if (descriptor && typeof descriptor.get === "function") return descriptor.get.call(mod);
                        } catch {
                            /* Ignore property descriptor access errors */
                        }
                        return mod && mod.BrowserWindow;
                    })();
                    let readyCalled = false;
                    let windowsCalled = false;
                    if (app && typeof app.whenReady === "function") {
                        try {
                            app.whenReady();
                            readyCalled = true;
                        } catch {
                            /* Ignore app.whenReady errors */
                        }
                    }
                    if (BW && typeof BW.getAllWindows === "function") {
                        try {
                            BW.getAllWindows();
                            windowsCalled = true;
                        } catch {
                            /* Ignore BrowserWindow access errors */
                        }
                        try {
                            const list = BW.getAllWindows();
                            if (Array.isArray(list) && list.length > 0 && !getAppState("mainWindow")) {
                                initializeApplication();
                            }
                        } catch {
                            /* Ignore window initialization errors */
                        }
                    }
                    if (!(readyCalled && windowsCalled) && attempts++ < 5) {
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
        if (
            (typeof process !== "undefined" && process.env && /** @type {any} */ (process.env).NODE_ENV === "test") ||
            (typeof globalThis !== "undefined" && /** @type {any} */ (globalThis).__electronHoistedMock)
        ) {
            const g = /** @type {any} */ (globalThis);
            const keepaliveTick = () => {
                try {
                    const a = appRef();
                    if (a && typeof a.whenReady === "function") {
                        try {
                            a.whenReady();
                        } catch {
                            /* ignore */
                        }
                    }
                    if (a && typeof a.on === "function") {
                        try {
                            a.on("__test_probe__", () => {
                                /* no-op */
                            });
                        } catch {
                            /* ignore */
                        }
                    }
                } catch {
                    /* ignore */
                }
                try {
                    const BW = browserWindowRef();
                    if (BW && typeof BW.getAllWindows === "function") {
                        try {
                            BW.getAllWindows();
                        } catch {
                            /* ignore */
                        }
                    }
                } catch {
                    /* ignore */
                }
            };

            if (!g.__ffvTestKeepalive) {
                keepaliveTick();
                g.__ffvTestKeepalive = setInterval(() => {
                    keepaliveTick();
                }, 1);
            }
        }
    } catch {
        /* ignore */
    }
}

module.exports = { primeTestEnvironment };
