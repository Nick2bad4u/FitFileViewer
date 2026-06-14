// eslint-disable-next-line import-x/no-unassigned-import -- ensure web storage shim registers before Storybook config executes
import "./shims/nodeWebStorage";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import {
    vi,
    afterEach as vitestAfterEach,
    beforeEach as vitestBeforeEach,
    afterAll as vitestAfterAll,
} from "vitest";

import { appSourcePath } from "../../scripts/lib/workspaces.mjs";

const electronAppRoot = appSourcePath;
const electronAppDist = path.join(electronAppRoot, "dist");
const generatedRuntimeDirs = new Set([
    "main",
    "preload",
    "shared",
    "ui",
    "utils",
]);
const generatedRuntimeRootFiles = new Set([
    "fitParser.js",
    "main-ui.js",
    "main.js",
    "preload.js",
    "renderer.js",
    "windowStateUtils.js",
]);
let fitFileViewerVitestDistResolverInstalled = false;

function isGeneratedRuntimePath(relativePath) {
    const normalized = relativePath.replaceAll(path.sep, "/");
    if (
        normalized.startsWith("../") ||
        normalized.startsWith("tests/") ||
        normalized.startsWith("ffv/")
    ) {
        return false;
    }

    const [firstSegment] = normalized.split("/");
    return (
        generatedRuntimeRootFiles.has(normalized) ||
        generatedRuntimeDirs.has(firstSegment)
    );
}

function resolveDistRuntimeRequest(request, parentFilename) {
    if (
        typeof request !== "string" ||
        !request.startsWith(".") ||
        typeof parentFilename !== "string"
    ) {
        return;
    }

    const requestedPath = path.resolve(path.dirname(parentFilename), request);
    const sourceCandidates = path.extname(requestedPath)
        ? [requestedPath]
        : [`${requestedPath}.js`];

    for (const sourceCandidate of sourceCandidates) {
        const relativeSourcePath = path.relative(
            electronAppRoot,
            sourceCandidate
        );
        if (
            path.isAbsolute(relativeSourcePath) ||
            !isGeneratedRuntimePath(relativeSourcePath)
        ) {
            continue;
        }

        if (fs.existsSync(sourceCandidate)) {
            return sourceCandidate;
        }

        const sourceExtension = path.extname(sourceCandidate);
        const sourceWithoutExtension = sourceExtension
            ? sourceCandidate.slice(0, -sourceExtension.length)
            : sourceCandidate;
        for (const extension of [
            ".ts",
            ".tsx",
            ".mts",
            ".cts",
        ]) {
            const sourceTypeScriptCandidate = `${sourceWithoutExtension}${extension}`;
            if (fs.existsSync(sourceTypeScriptCandidate)) {
                return sourceTypeScriptCandidate;
            }
        }

        const distCandidate = path.join(electronAppDist, relativeSourcePath);
        if (fs.existsSync(distCandidate)) {
            return distCandidate;
        }
    }
}

if (!fitFileViewerVitestDistResolverInstalled) {
    const originalResolveFilename = Module._resolveFilename;
    Module._resolveFilename = function resolveFilename(
        request,
        parent,
        isMain,
        options
    ) {
        const distRuntimeFile = resolveDistRuntimeRequest(
            request,
            parent?.filename
        );
        if (distRuntimeFile) {
            return distRuntimeFile;
        }
        return originalResolveFilename.call(
            this,
            request,
            parent,
            isMain,
            options
        );
    };
    fitFileViewerVitestDistResolverInstalled = true;
}

// Soft import of state manager test-only resets; guarded to avoid module init cost when not present
/** @type {undefined | (() => void)} */
let __resetStateMgr;
/** @type {undefined | (() => void)} */
let __clearListeners;
// Defer loading the state manager using dynamic import to avoid ESM/CJS warning
// and to keep setup lightweight if tests don't touch state.
(async () => {
    try {
        const sm =
            await import("../../electron-app/utils/state/core/stateManager.js");
        __resetStateMgr = /** @type {any} */ (sm).__resetStateManagerForTests;
        __clearListeners = /** @type {any} */ (sm).__clearAllListenersForTests;
    } catch {
        // ignore - not all suites need state manager helpers
    }
})();

// Reinstall a safe console before/after each test phase to prevent teardown from leaving it undefined
/**
 * @param {typeof globalThis | Window} target
 * @param {Console} consoleRef
 */
function setConsoleObject(target, consoleRef) {
    Object.defineProperty(target, "console", {
        configurable: true,
        enumerable: true,
        value: consoleRef,
        writable: true,
    });
}

function ensureConsoleAlive() {
    try {
        const noop = () => {};
        /** @type {any} */
        const current = /** @type {any} */ (globalThis.console);
        if (!current) {
            // No console at all – install a full base one
            /** @type {any} */
            const base = {
                log: vi.fn() || noop,
                warn: vi.fn() || noop,
                error: vi.fn() || noop,
                info: vi.fn() || noop,
                debug: vi.fn() || noop,
                assert: vi.fn() || noop,
                clear: vi.fn() || noop,
                count: vi.fn() || noop,
                countReset: vi.fn() || noop,
                dir: vi.fn() || noop,
                dirxml: vi.fn() || noop,
                group: vi.fn() || noop,
                groupCollapsed: vi.fn() || noop,
                groupEnd: vi.fn() || noop,
                table: vi.fn() || noop,
                time: vi.fn() || noop,
                timeEnd: vi.fn() || noop,
                timeLog: vi.fn() || noop,
                timeStamp: vi.fn() || noop,
                trace: vi.fn() || noop,
                profile: vi.fn() || noop,
                profileEnd: vi.fn() || noop,
            };
            try {
                setConsoleObject(globalThis, base);
            } catch {
                /* ignore */
            }
            if (typeof window !== "undefined") {
                try {
                    setConsoleObject(window, base);
                } catch {
                    /* ignore */
                }
            }
            return;
        }
        // Console exists – only polyfill missing methods to avoid clobbering test spies
        if (typeof current.log !== "function") {
            try {
                current.log = noop;
            } catch {
                /* ignore */
            }
        }
        const ensure = (name) => {
            if (typeof current[name] !== "function") {
                try {
                    current[name] = noop;
                } catch {
                    /* ignore */
                }
            }
        };
        [
            "warn",
            "error",
            "info",
            "debug",
            "assert",
            "clear",
            "count",
            "countReset",
            "dir",
            "dirxml",
            "group",
            "groupCollapsed",
            "groupEnd",
            "table",
            "time",
            "timeEnd",
            "timeLog",
            "timeStamp",
            "trace",
            "profile",
            "profileEnd",
        ].forEach(ensure);
        if (
            typeof window !== "undefined" &&
            window.console &&
            window.console !== current
        ) {
            try {
                setConsoleObject(window, current);
            } catch {
                /* ignore */
            }
        }
    } catch {
        /* ignore */
    }
}

/**
 * @param {Record<string, unknown>} processRef
 */
function setRuntimeProcessObject(processRef) {
    Object.defineProperty(globalThis, "process", {
        configurable: true,
        enumerable: true,
        value: processRef,
        writable: true,
    });
}

/**
 * @param {Record<string, unknown>} processRef
 * @param {(
 *     callback: (...args: unknown[]) => void,
 *     ...args: unknown[]
 * ) => void} nextTick
 */
function setProcessNextTick(processRef, nextTick) {
    Object.defineProperty(processRef, "nextTick", {
        configurable: true,
        value: nextTick,
        writable: true,
    });
}

function ensureProcessNextTick() {
    try {
        const currentProcess = globalThis.process;
        const processRef =
            currentProcess && typeof currentProcess === "object"
                ? currentProcess
                : {};
        if (processRef !== currentProcess) {
            setRuntimeProcessObject(processRef);
        }
        if (typeof processRef.nextTick !== "function") {
            setProcessNextTick(processRef, (cb, ...args) =>
                Promise.resolve().then(() => {
                    try {
                        cb(...args);
                    } catch {
                        /* ignore */
                    }
                })
            );
        }
    } catch {
        /* ignore */
    }
}

// Register hooks defensively: in some execution modes (e.g., forks pool or
// early setup evaluation), the Vitest runner might not yet be ready, causing
// "Vitest failed to find the runner". Swallow those cases and proceed; tests
// will still run, and other suites can register hooks when the runner is ready.
try {
    vitestBeforeEach(() => {
        ensureConsoleAlive();
        ensureProcessNextTick();
    });
} catch {
    /* ignore: runner not yet available */
}
try {
    vitestAfterEach(() => {
        ensureConsoleAlive();
        ensureProcessNextTick();
    });
} catch {
    /* ignore: runner not yet available */
}
try {
    vitestAfterAll(() => ensureConsoleAlive());
} catch {
    /* ignore: runner not yet available */
}
// Import the enhanced JSDOM setup to fix DOM-related test failures
// Import the enhanced JSDOM setup directly inside setupVitest.mjs
// directly include the JSDOM setup code instead of importing

// Enhanced JSDOM environment setup (with guards for non-DOM environments)
if (typeof document !== "undefined") {
    if (!document.body) {
        const body = document.createElement("body");
        document.appendChild(body);
    }
}

// Ensure a stable global process object for libraries/tests that expect Node-like globals
ensureProcessNextTick();

// Capture native references to the initial jsdom window/document so we can restore
// them between tests if a suite replaces global.document with a plain object.
/** @type {Document | undefined} */
const __nativeDocument = typeof document !== "undefined" ? document : undefined;
/** @type {any} */
const __nativeDocProto = (() => {
    try {
        return __nativeDocument
            ? Object.getPrototypeOf(__nativeDocument)
            : undefined;
    } catch {
        return undefined;
    }
})();
/** @type {(Window & typeof globalThis) | undefined} */
const __nativeWindow = typeof window !== "undefined" ? window : undefined;

// Intentionally avoid capturing canonical Document methods across realms.
// Always derive methods from each document's own realm (doc.defaultView.Document.prototype).

/**
 * Best-effort cleanup of globals that can leak memory or state across tests.
 * Clears dev helpers and storage contents on a given window.
 *
 * @param {any} win
 */
function cleanupWindowGlobals(win) {
    if (!win) return;
    // Clear storage to avoid unit selection bleed (seconds/minutes/hours) between tests
    try {
        if (win.localStorage && typeof win.localStorage.clear === "function") {
            win.localStorage.clear();
        }
    } catch {
        /* Ignore errors */
    }
    try {
        if (
            win.sessionStorage &&
            typeof win.sessionStorage.clear === "function"
        ) {
            win.sessionStorage.clear();
        }
    } catch {
        /* Ignore errors */
    }
    // Best-effort DOM cleanup to avoid accumulating detached nodes between tests
    // Note: do not remove document.body children here; it can interfere with running tests
    // and some suites expect DOM to remain intact through specific phases.
    try {
        // no-op body cleanup to avoid cross-test interference
        const _d = win.document; // access to ensure document exists
        void _d;
    } catch {
        /* Ignore errors */
    }
}

/**
 * @param {object | undefined} target
 * @param {Document} documentValue
 */
function setRuntimeDocument(target, documentValue) {
    if (!target || typeof target !== "object") {
        return;
    }

    try {
        Object.defineProperty(target, "document", {
            configurable: true,
            value: documentValue,
            writable: true,
        });
    } catch {
        /* Ignore errors */
    }
}

/**
 * Restore the global window/document to the original jsdom instances captured
 * at setup time. Also performs cleanup on both the current and native windows
 * to avoid leaks between tests.
 */
function restoreNativeDom() {
    /** @type {any} */
    const curWin = typeof window !== "undefined" ? window : undefined;
    /** @type {any} */
    const curDoc = typeof document !== "undefined" ? document : undefined;

    // Helper to detect a truly valid jsdom-like Document (not a plain object)
    const isValidDoc = (d) => {
        try {
            if (!d || typeof d !== "object") return false;
            // Accept documents from any realm; check structural/document invariants
            const apiOk =
                typeof d.createElement === "function" &&
                typeof d.querySelectorAll === "function" &&
                typeof d.getElementById === "function";
            const implOk =
                typeof d.implementation === "object" &&
                typeof d.implementation.createHTMLDocument === "function";
            const nodeOk = /** @type {any} */ (d).nodeType === 9;
            const viewOk =
                typeof (/** @type {any} */ (d).defaultView) === "object";
            return !!(apiOk && implOk && nodeOk && viewOk);
        } catch {
            return false;
        }
    };

    // Clean current environment (Chart.js caches, storages, observers)
    try {
        if (curWin) cleanupWindowGlobals(curWin);
    } catch {
        /* Ignore errors */
    }
    try {
        // Also clear any globalThis storages if distinct from window
        if (globalThis && globalThis !== curWin) {
            try {
                if (
                    globalThis.localStorage &&
                    typeof globalThis.localStorage.clear === "function"
                ) {
                    globalThis.localStorage.clear();
                }
            } catch {
                /* Ignore errors */
            }
            try {
                if (
                    globalThis.sessionStorage &&
                    typeof globalThis.sessionStorage.clear === "function"
                ) {
                    globalThis.sessionStorage.clear();
                }
            } catch {
                /* Ignore errors */
            }
        }
    } catch {
        /* Ignore errors */
    }

    // If the current document is invalid (or missing), restore the native jsdom document
    try {
        if (!isValidDoc(curDoc) && __nativeDocument) {
            try {
                // Restore global document reference
                setRuntimeDocument(globalThis, __nativeDocument);
                if (curWin && typeof curWin === "object") {
                    // Keep the same window object but ensure it points to the restored document
                    setRuntimeDocument(curWin, __nativeDocument);
                }
            } catch {
                /* Ignore errors */
            }
        }
    } catch {
        /* Ignore errors */
    }

    // Reinstall guards on the effective document and ensure body exists
    try {
        /** @type {any} */
        const effDoc = /** @type {any} */ (
            typeof document !== "undefined" ? document : __nativeDocument
        );
        if (effDoc) {
            // Always realign global and window document references to the same instance
            try {
                setRuntimeDocument(globalThis, effDoc);
            } catch {
                /* Ignore errors */
            }
            try {
                if (curWin && typeof curWin === "object") {
                    setRuntimeDocument(curWin, effDoc);
                }
            } catch {
                /* Ignore errors */
            }
            installDocumentGuards(effDoc);
            if (!effDoc.body) {
                try {
                    const b = effDoc.createElement
                        ? effDoc.createElement("body")
                        : undefined;
                    if (b) effDoc.appendChild(b);
                } catch {
                    /* Ignore errors */
                }
            }
        }
    } catch {
        /* Ignore errors */
    }
}

// Lock Buffer early to a callable native reference to prevent instanceof crashes in Vitest serializers
(() => {
    try {
        const originalBuffer = globalThis.Buffer;
        if (originalBuffer && typeof originalBuffer === "function") {
            let current = originalBuffer;
            Object.defineProperty(globalThis, "Buffer", {
                configurable: true,
                get() {
                    return current;
                },
                set(v) {
                    if (typeof v === "function") current = v;
                },
            });
            if (typeof window !== "undefined") {
                let wCurrent = originalBuffer;
                Object.defineProperty(window, "Buffer", {
                    configurable: true,
                    get() {
                        return wCurrent;
                    },
                    set(v) {
                        if (typeof v === "function") wCurrent = v;
                    },
                });
            }
        }
    } catch {
        /* Ignore errors */
    }
})();

// Rely on JSDOM's native HTMLElement/Element implementations for id/className/classList

// Global console mock setup - ensure console is available for all tests and cannot be unset to undefined
(() => {
    // Create a comprehensive console implementation for testing
    const baseConsole = {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        assert: vi.fn(),
        clear: vi.fn(),
        count: vi.fn(),
        countReset: vi.fn(),
        dir: vi.fn(),
        dirxml: vi.fn(),
        group: vi.fn(),
        groupCollapsed: vi.fn(),
        groupEnd: vi.fn(),
        table: vi.fn(),
        time: vi.fn(),
        timeEnd: vi.fn(),
        timeLog: vi.fn(),
        timeStamp: vi.fn(),
        trace: vi.fn(),
        Console: vi.fn(),
        profile: vi.fn(),
        profileEnd: vi.fn(),
    };
    /** @type {any} */
    let currentConsole =
        globalThis.console && typeof globalThis.console.log === "function"
            ? globalThis.console
            : baseConsole;
    try {
        Object.defineProperty(globalThis, "console", {
            configurable: true,
            enumerable: true,
            get() {
                return currentConsole;
            },
            set(v) {
                if (v && typeof v === "object" && typeof v.log === "function") {
                    currentConsole = /** @type {any} */ (v);
                }
                // Ignore attempts to set undefined/null which break worker stdout hooks
            },
        });
    } catch {
        /* Ignore errors */
    }
    // Also ensure window.console exists for browser-like environments and is guarded similarly
    if (typeof window !== "undefined") {
        try {
            Object.defineProperty(window, "console", {
                configurable: true,
                enumerable: true,
                get() {
                    return currentConsole;
                },
                set(v) {
                    if (
                        v &&
                        typeof v === "object" &&
                        typeof v.log === "function"
                    ) {
                        currentConsole = /** @type {any} */ (v);
                    }
                },
            });
        } catch {
            /* Ignore errors */
        }
    }
})();

ensureConsoleAlive();

const spyFactory =
    typeof vi !== "undefined" && typeof vi.fn === "function"
        ? (fn) => vi.fn(fn)
        : (fn) => fn;

/**
 * Resolve a URL-like input against a fallback href, mirroring the browser's
 * navigation resolution rules. Throws when the candidate cannot be parsed so
 * that tests still exercise invalid-navigation paths.
 *
 * @param {unknown} value
 * @param {string} fallbackHref
 *
 * @returns {URL}
 */
function resolveUrlValue(value, fallbackHref) {
    const base =
        typeof fallbackHref === "string" && fallbackHref.length > 0
            ? fallbackHref
            : "http://localhost/";
    if (value instanceof URL) {
        return new URL(value.href);
    }
    if (
        value &&
        typeof value === "object" &&
        typeof (/** @type {any} */ (value).href) === "string"
    ) {
        return new URL(/** @type {any} */ (value).href, base);
    }
    const raw = value == null ? base : String(value);
    // Allow relative URLs by providing the fallback as the base parameter
    return raw.includes("://") || raw.startsWith("about:")
        ? new URL(raw)
        : new URL(raw, base);
}

/**
 * Build a lightweight Location-like object for secondary windows or fallbacks.
 *
 * @param {string | undefined} initialHref
 */
function createLocationSnapshot(initialHref) {
    const fallback =
        typeof initialHref === "string" && initialHref.length > 0
            ? initialHref
            : "http://localhost/";
    /** @type {URL} */
    let current;
    try {
        current = resolveUrlValue(initialHref ?? fallback, fallback);
    } catch {
        current = new URL("http://localhost/");
    }

    const update = (value) => {
        current = resolveUrlValue(value ?? current.href, current.href);
        return current.href;
    };

    const snapshot = {
        get href() {
            return current.href;
        },
        set href(value) {
            update(value);
        },
        assign: spyFactory((value) => update(value)),
        replace: spyFactory((value) => update(value)),
        reload: spyFactory(() => {}),
        toString: () => current.href,
        valueOf: () => current.href,
    };

    [
        "protocol",
        "host",
        "hostname",
        "port",
        "pathname",
        "search",
        "hash",
        "origin",
    ].forEach((prop) => {
        Object.defineProperty(snapshot, prop, {
            configurable: true,
            enumerable: true,
            get() {
                return /** @type {any} */ (current)[prop];
            },
            set(value) {
                try {
                    /** @type {any} */ (current)[prop] = value;
                    update(current.href);
                } catch {
                    /* ignore */
                }
            },
        });
    });

    return snapshot;
}

/**
 * Install navigation shims directly onto the native Location object to prevent
 * jsdom from attempting real navigations.
 *
 * @param {Window & typeof globalThis} win
 */
function installWindowNavigationShim(win) {
    if (!win || typeof win !== "object") return undefined;
    /** @type {Location | undefined} */
    const nativeLocation = (() => {
        try {
            return win.location;
        } catch {
            return undefined;
        }
    })();
    if (!nativeLocation || typeof nativeLocation !== "object") return undefined;

    const initialHref = (() => {
        try {
            return nativeLocation.href;
        } catch {
            return "http://localhost/";
        }
    })();

    /** @type {URL} */
    let currentUrl;
    try {
        currentUrl = resolveUrlValue(initialHref, initialHref);
    } catch {
        currentUrl = new URL("http://localhost/");
    }

    const update = (value, reason = "direct") => {
        try {
            currentUrl = resolveUrlValue(
                value ?? currentUrl.href,
                currentUrl.href
            );
        } catch (error) {
            throw error;
        }
        try {
            let history = vitestNavigationHistory.get(nativeLocation);
            if (!history) {
                history = [];
                vitestNavigationHistory.set(nativeLocation, history);
            }
            history.push({
                href: currentUrl.href,
                reason,
                timestamp: Date.now(),
            });
        } catch {
            /* ignore */
        }
        return currentUrl.href;
    };

    const defineLocationProp = (prop, descriptor) => {
        try {
            Object.defineProperty(nativeLocation, prop, {
                configurable: true,
                enumerable: true,
                ...descriptor,
            });
        } catch {
            /* ignore */
        }
    };

    defineLocationProp("href", {
        get() {
            return currentUrl.href;
        },
        set(value) {
            update(value, "set-href");
        },
    });

    [
        "protocol",
        "host",
        "hostname",
        "port",
        "pathname",
        "search",
        "hash",
        "origin",
    ].forEach((prop) => {
        defineLocationProp(prop, {
            get() {
                return /** @type {any} */ (currentUrl)[prop];
            },
            set(value) {
                try {
                    /** @type {any} */ (currentUrl)[prop] = value;
                    update(currentUrl.href, `set-${String(prop)}`);
                } catch {
                    /* ignore */
                }
            },
        });
    });

    defineLocationProp("assign", {
        value: spyFactory((value) => update(value, "assign")),
        writable: true,
    });
    defineLocationProp("replace", {
        value: spyFactory((value) => update(value, "replace")),
        writable: true,
    });
    defineLocationProp("reload", {
        value: spyFactory(() => undefined),
        writable: true,
    });
    defineLocationProp("toString", {
        value: () => currentUrl.href,
    });
    defineLocationProp(Symbol.toPrimitive, {
        value: () => currentUrl.href,
    });

    const ensureAccessor = (target, reason) => {
        if (!target || typeof target !== "object") return;
        try {
            Object.defineProperty(target, "location", {
                configurable: true,
                enumerable: true,
                get() {
                    return nativeLocation;
                },
                set(value) {
                    update(value, reason);
                },
            });
        } catch {
            try {
                target.location = /** @type {any} */ (nativeLocation);
            } catch {
                /* ignore */
            }
        }
    };

    ensureAccessor(win, "set-window-location");
    ensureAccessor(win.document, "set-document-location");
    ensureAccessor(globalThis, "set-global-location");

    return nativeLocation;
}

/**
 * Provide jsdom-friendly implementations for browser APIs that commonly emit
 * "Not implemented" warnings.
 *
 * @param {Window & typeof globalThis} win
 */
function ensureWindowWarningFreeAPIs(win) {
    if (!win || typeof win !== "object") return;
    const navigationShim = installWindowNavigationShim(win);
    const baseHref = (() => {
        try {
            return win.location?.href || "http://localhost/";
        } catch {
            return "http://localhost/";
        }
    })();

    const assignOrSet = (target, key, value) => {
        try {
            Object.defineProperty(target, key, {
                configurable: true,
                writable: true,
                value,
            });
        } catch {
            target[key] = /** @type {any} */ (value);
        }
    };

    const mirrorToGlobal = (key, value) => {
        assignOrSet(win, key, value);
        assignOrSet(globalThis, key, value);
    };

    const alertImpl = spyFactory((message) => {
        const text = message == null ? "" : String(message);
        try {
            win.console?.warn?.(`[window.alert] ${text}`);
        } catch {
            /* ignore */
        }
        return undefined;
    });
    mirrorToGlobal("alert", alertImpl);

    const confirmImpl = spyFactory(() => true);
    mirrorToGlobal("confirm", confirmImpl);

    const promptImpl = spyFactory(() => "");
    mirrorToGlobal("prompt", promptImpl);

    const scrollImpl = spyFactory(() => undefined);
    mirrorToGlobal("scrollTo", scrollImpl);
    mirrorToGlobal("scroll", scrollImpl);

    const openImpl = spyFactory((url, target = "_blank", features = "") => {
        let href = baseHref;
        try {
            const rel =
                navigationShim && typeof navigationShim.href === "string"
                    ? navigationShim.href
                    : href;
            href = resolveUrlValue(url ?? rel, rel).href;
        } catch {
            href = typeof url === "string" && url.length > 0 ? url : href;
        }
        const childLocation = createLocationSnapshot(href);
        const childWindow = {
            closed: false,
            close: spyFactory(() => {
                childWindow.closed = true;
            }),
            focus: spyFactory(() => {}),
            blur: spyFactory(() => {}),
            print: spyFactory(() => {}),
            location: childLocation,
            document: win.document,
            opener: win,
            parent: win,
            name: target,
            features,
        };
        return /** @type {any} */ (childWindow);
    });
    mirrorToGlobal("open", openImpl);
}

// Mock electron-conf to avoid Electron dependency issues in tests
// Use default export to ensure it's compatible with both import and require
vi.mock("electron-conf", () => {
    // Create shared mock functions that tests can access
    const mockGet = vi.fn().mockReturnValue(undefined);
    const mockSet = vi.fn();
    const mockHas = vi.fn().mockReturnValue(false);
    const mockDelete = vi.fn();
    const mockClear = vi.fn();
    const mockOnDidChange = vi.fn();
    const mockOnDidAnyChange = vi.fn();

    const ConfMock = vi.fn().mockImplementation(() => ({
        get: mockGet,
        set: mockSet,
        has: mockHas,
        delete: mockDelete,
        clear: mockClear,
        onDidChange: mockOnDidChange,
        onDidAnyChange: mockOnDidAnyChange,
        path: "/mock/path/settings.json",
        size: 0,
        store: {},
    }));

    // Support both CommonJS and ES6 module systems
    const mockModule = {
        Conf: ConfMock,
        __mockGet: mockGet,
        __mockSet: mockSet,
        __mockHas: mockHas,
        __mockDelete: mockDelete,
        __mockClear: mockClear,
        __mockOnDidChange: mockOnDidChange,
        __mockOnDidAnyChange: mockOnDidAnyChange,
    };

    // Return for both ES6 default and named exports
    return {
        ...mockModule,
        default: mockModule,
    };
});

/** @type {WeakMap<Document, any>} */
const vitestDocumentNativeMethods = new WeakMap();
const vitestTrackedTimeouts = new Set();
const vitestTrackedIntervals = new Set();
/** @type {any[]} */
const vitestTrackedDomListeners = [];
const vitestWrappedEventListenerMethods = new WeakSet();
let vitestTimerAndListenerTrackingInstalled = false;
/**
 * @type {WeakMap<
 *     Location,
 *     { href: string; reason: string; timestamp: number }[]
 * >}
 */
const vitestNavigationHistory = new WeakMap();

// Helper to install guards on a specific Document instance (handles reassignments)
/**
 * Restore critical Document methods if tests replaced them and ensure body
 * exists. Always rebind to the current document's prototype implementations to
 * avoid leaked mocks.
 *
 * @param {Document} doc
 */
function installDocumentGuards(doc) {
    if (!doc) return;
    // Derive natives from the document's own realm to prevent cross-realm brand check failures
    /**
     * @type {{
     *           createElement?: (
     *               this: Document,
     *               tag: string,
     *               options?: any
     *           ) => any;
     *           createTextNode?: (this: Document, data: string) => any;
     *           createDocumentFragment?: (this: Document) => any;
     *           querySelector?: (this: Document, sel: string) => any;
     *           querySelectorAll?: (this: Document, sel: string) => any;
     *           getElementById?: (this: Document, id: string) => any;
     *           getElementsByClassName?: (this: Document, cls: string) => any;
     *           getElementsByTagName?: (this: Document, tag: string) => any;
     *           appendChild?: (this: Document, node: any) => any;
     *       }
     *     | undefined}
     */
    let canon;
    try {
        const realmDocProto = /** @type {any} */ (
            doc?.defaultView?.Document?.prototype
        );
        if (
            realmDocProto &&
            typeof realmDocProto.createElement === "function"
        ) {
            canon = {
                createElement: realmDocProto.createElement,
                createTextNode: realmDocProto.createTextNode,
                createDocumentFragment: realmDocProto.createDocumentFragment,
                querySelector: realmDocProto.querySelector,
                querySelectorAll: realmDocProto.querySelectorAll,
                getElementById: realmDocProto.getElementById,
                getElementsByClassName: realmDocProto.getElementsByClassName,
                getElementsByTagName: realmDocProto.getElementsByTagName,
                appendChild: realmDocProto.appendChild,
            };
        }
    } catch {
        /* Ignore errors */
    }
    // Cache native methods per Document instance to survive prototype tampering.
    const nativeMap = vitestDocumentNativeMethods;
    try {
        let natives = nativeMap.get(doc);
        if (!natives) {
            // Start from same-realm canonical snapshot if available; else derive from current prototype
            if (canon) {
                natives = { ...canon };
            } else {
                const Proto = /** @type {any} */ (Object.getPrototypeOf(doc));
                natives = {
                    createElement:
                        typeof Proto?.createElement === "function"
                            ? Proto.createElement
                            : undefined,
                    createTextNode:
                        typeof Proto?.createTextNode === "function"
                            ? Proto.createTextNode
                            : undefined,
                    createDocumentFragment:
                        typeof Proto?.createDocumentFragment === "function"
                            ? Proto.createDocumentFragment
                            : undefined,
                    querySelector:
                        typeof Proto?.querySelector === "function"
                            ? Proto.querySelector
                            : undefined,
                    querySelectorAll:
                        typeof Proto?.querySelectorAll === "function"
                            ? Proto.querySelectorAll
                            : undefined,
                    getElementById:
                        typeof Proto?.getElementById === "function"
                            ? Proto.getElementById
                            : undefined,
                    getElementsByClassName:
                        typeof Proto?.getElementsByClassName === "function"
                            ? Proto.getElementsByClassName
                            : undefined,
                    getElementsByTagName:
                        typeof Proto?.getElementsByTagName === "function"
                            ? Proto.getElementsByTagName
                            : undefined,
                    appendChild:
                        typeof Proto?.appendChild === "function"
                            ? Proto.appendChild
                            : undefined,
                };
            }
            nativeMap.set(doc, natives);
        }
        // Rebind document methods from cached natives
        try {
            if (typeof natives.createElement === "function")
                doc.createElement = natives.createElement.bind(doc);
        } catch {
            /* Ignore errors */
        }
        try {
            if (typeof natives.createTextNode === "function")
                doc.createTextNode = natives.createTextNode.bind(doc);
        } catch {
            /* Ignore errors */
        }
        try {
            if (typeof natives.createDocumentFragment === "function")
                doc.createDocumentFragment =
                    natives.createDocumentFragment.bind(doc);
        } catch {
            /* Ignore errors */
        }
        try {
            if (typeof natives.querySelector === "function")
                doc.querySelector = natives.querySelector.bind(doc);
        } catch {
            /* Ignore errors */
        }
        try {
            if (typeof natives.querySelectorAll === "function")
                doc.querySelectorAll = natives.querySelectorAll.bind(doc);
        } catch {
            /* Ignore errors */
        }
        try {
            if (typeof natives.getElementById === "function")
                doc.getElementById = natives.getElementById.bind(doc);
        } catch {
            /* Ignore errors */
        }
        try {
            if (typeof natives.getElementsByClassName === "function")
                doc.getElementsByClassName =
                    natives.getElementsByClassName.bind(doc);
        } catch {
            /* Ignore errors */
        }
        try {
            if (typeof natives.getElementsByTagName === "function")
                doc.getElementsByTagName =
                    natives.getElementsByTagName.bind(doc);
        } catch {
            /* Ignore errors */
        }
        try {
            if (typeof natives.appendChild === "function")
                doc.appendChild = natives.appendChild.bind(doc);
        } catch {
            /* Ignore errors */
        }
    } catch {
        /* Ignore errors */
    }
    // Ensure document has a body element
    if (!doc.body) {
        try {
            const body = doc.createElement("body");
            doc.appendChild(body);
        } catch {
            /* Ignore errors */
        }
    }
    // Validate createElement returns a node; if not, attempt a last-resort recovery using same-realm natives
    try {
        const testEl = /** @type {any} */ (doc.createElement?.("div"));
        if (!testEl || typeof testEl !== "object") {
            // Fallback to same-realm snapshot if available
            if (canon && typeof canon.createElement === "function") {
                try {
                    doc.createElement = canon.createElement.bind(doc);
                } catch {
                    /* Ignore errors */
                }
            } else {
                // Attempt to reconstruct doc methods via current prototype again
                const Proto = /** @type {any} */ (Object.getPrototypeOf(doc));
                try {
                    if (typeof Proto?.createElement === "function")
                        doc.createElement = Proto.createElement.bind(doc);
                } catch {
                    /* Ignore errors */
                }
            }
        }
    } catch {
        /* Ignore errors */
    }
}

// Make sure JSDOM is properly initialized for tests and guards are installed
function applyBrowserGuardsIfReady() {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return false;
    }
    if (!document.body) {
        const body = document.createElement("body");
        document.appendChild(body);
    }
    ensureWindowWarningFreeAPIs(window);
    // Install guards on current document only. Some tests replace global document
    // and rely on direct mocking of its methods; intercepting assignments here
    // can break JSDOM invariants. If a test replaces document, it can call
    // installDocumentGuards(document) manually if needed.
    installDocumentGuards(document);
    return true;
}

if (!applyBrowserGuardsIfReady()) {
    let attempts = 0;
    const maxAttempts = 20;
    const retryInstall = () => {
        if (applyBrowserGuardsIfReady()) return;
        attempts += 1;
        if (attempts >= maxAttempts) return;
        if (typeof setTimeout === "function") {
            setTimeout(retryInstall, 5);
        }
    };
    if (typeof setTimeout === "function") {
        setTimeout(retryInstall, 0);
    }
}

// Prevent replacing core constructors with non-functions which breaks instanceof checks in Vitest
(() => {
    /**
     * Install a safe accessor for a global constructor-like symbol. If someone
     * assigns a non-function, keep the native reference instead.
     *
     * @param {keyof typeof globalThis} name
     */
    function installSafeConstructor(name) {
        try {
            const nativeRef = globalThis[name];
            if (typeof nativeRef !== "function") return; // nothing to do
            let current = nativeRef;
            Object.defineProperty(globalThis, name, {
                configurable: true,
                get() {
                    return current;
                },
                set(v) {
                    current = typeof v === "function" ? v : nativeRef;
                },
            });
        } catch {
            // ignore
        }
    }

    // Guard most commonly used constructors in test runners
    installSafeConstructor("Error");
    installSafeConstructor("RegExp");
    installSafeConstructor("Date");
    installSafeConstructor("Promise");
    installSafeConstructor("Map");
    installSafeConstructor("Set");
    installSafeConstructor("WeakMap");
    installSafeConstructor("WeakSet");
    // Guard Buffer to avoid instanceof crashes in Vitest error serializer
    if (typeof globalThis.Buffer !== "undefined")
        installSafeConstructor("Buffer");

    // Also guard on window if present (some suites use window.Error etc.)
    if (typeof window !== "undefined") {
        const names = [
            "Error",
            "RegExp",
            "Date",
            "Promise",
            "Map",
            "Set",
            "WeakMap",
            "WeakSet",
        ];
        for (const n of names) {
            try {
                const nativeRef = window[n];
                if (typeof nativeRef !== "function") continue;
                let current = nativeRef;
                Object.defineProperty(window, n, {
                    configurable: true,
                    get() {
                        return current;
                    },
                    set(v) {
                        current = typeof v === "function" ? v : nativeRef;
                    },
                });
            } catch {
                /* Ignore errors */
            }
        }
        // Also guard window.Buffer if present
        try {
            const nativeBuf = window.Buffer;
            if (typeof nativeBuf === "function") {
                let current = nativeBuf;
                Object.defineProperty(window, "Buffer", {
                    configurable: true,
                    get() {
                        return current;
                    },
                    set(v) {
                        current = typeof v === "function" ? v : nativeBuf;
                    },
                });
            }
        } catch {
            /* Ignore errors */
        }
    }
})();

// --- Safety guards for global process stubbing in tests ---
// Some tests replace or stub the global `process` object which can break Vitest internals
// that rely on EventEmitter methods like `process.listeners`. We defensively ensure that
// replacing `process` keeps required methods available.
(function installSafeProcessGuards() {
    /**
     * Merge a provided partial process-like object with the original Node
     * `process`, ensuring EventEmitter-style methods exist to keep Vitest
     * stable.
     *
     * @param {any} base
     * @param {any} override
     */
    function mergeProcess(base, override) {
        const merged = Object.assign({}, base, override);
        // Ensure vitest-required methods exist
        if (typeof merged.listeners !== "function") merged.listeners = () => [];
        if (typeof merged.on !== "function") merged.on = () => merged;
        if (typeof merged.off !== "function") merged.off = () => merged;
        if (typeof merged.once !== "function") merged.once = () => merged;
        if (!merged.env) merged.env = {};
        if (!Array.isArray(merged.argv)) merged.argv = [];
        return merged;
    }

    // Wrap vi.stubGlobal to merge process overrides safely
    const originalStubGlobal = vi.stubGlobal.bind(vi);
    vi.stubGlobal = (key, value) => {
        if (key === "process") {
            try {
                const safe = mergeProcess(globalThis.process, value);
                return originalStubGlobal(key, safe);
            } catch {
                // Fallback if something goes wrong
                return originalStubGlobal(key, value);
            }
        } else if (key === "Buffer") {
            try {
                const nativeBuf = globalThis.Buffer;
                const safe = typeof value === "function" ? value : nativeBuf;
                return originalStubGlobal(key, safe);
            } catch {
                return originalStubGlobal(key, value);
            }
        }
        return originalStubGlobal(key, value);
    };

    // Attempt to install an accessor on globalThis.process to catch direct assignments
    try {
        const originalProcess = globalThis.process;
        let current = originalProcess;
        Object.defineProperty(globalThis, "process", {
            configurable: true,
            get() {
                return current;
            },
            set(v) {
                current = mergeProcess(originalProcess, v);
            },
        });
    } catch {
        // If defining an accessor fails (environment dependent), do nothing
    }

    // Finally, ensure at least the current process has the required methods
    try {
        const p = globalThis.process;
        if (p && typeof p.listeners !== "function") p.listeners = () => [];
        if (p && typeof p.on !== "function") p.on = () => p;
        if (p && typeof p.off !== "function") p.off = () => p;
        if (p && typeof p.once !== "function") p.once = () => p;
    } catch {
        // ignore
    }
})();

// Ensure that after each test (and after vi.resetAllMocks) we reinstall guards on the current document
try {
    const originalResetAllMocks = vi.resetAllMocks.bind(vi);
    vi.resetAllMocks = (...args) => {
        const result = originalResetAllMocks(...args);
        try {
            if (typeof document !== "undefined")
                installDocumentGuards(document);
        } catch {
            /* Ignore errors */
        }
        return result;
    };
    const originalRestoreAllMocks = vi.restoreAllMocks.bind(vi);
    vi.restoreAllMocks = (...args) => {
        const result = originalRestoreAllMocks(...args);
        try {
            if (typeof document !== "undefined")
                installDocumentGuards(document);
        } catch {
            /* Ignore errors */
        }
        return result;
    };
} catch {
    /* Ignore errors */
}

// Global afterEach to reinstall guards in case tests mutated DOM APIs
try {
    vitestAfterEach(() => {
        try {
            // Restore DOM to native jsdom and reinstall guards after each test
            restoreNativeDom();
        } catch {
            /* Ignore errors */
        }
        // Ensure no DOM from a previous test leaks into the next one
        try {
            if (typeof document !== "undefined" && document.body) {
                document.body.innerHTML = "";
            }
        } catch {
            /* Ignore errors */
        }
        // Clear tracked timers
        try {
            const timeouts = vitestTrackedTimeouts;
            const intervals = vitestTrackedIntervals;
            if (timeouts && typeof clearTimeout === "function") {
                for (const id of Array.from(timeouts)) {
                    try {
                        clearTimeout(id);
                    } catch {
                        /* Ignore errors */
                    }
                }
                timeouts.clear?.();
            }
            if (intervals && typeof clearInterval === "function") {
                for (const id of Array.from(intervals)) {
                    try {
                        clearInterval(id);
                    } catch {
                        /* Ignore errors */
                    }
                }
                intervals.clear?.();
            }
        } catch {
            /* Ignore errors */
        }
        // Remove tracked DOM event listeners
        try {
            /**
             * @type {{
             *     target: EventTarget;
             *     type: string;
             *     listener: EventListenerOrEventListenerObject;
             *     options?: any;
             * }[]}
             */
            const listeners = vitestTrackedDomListeners;
            if (Array.isArray(listeners)) {
                for (const rec of listeners.splice(0, listeners.length)) {
                    try {
                        rec.target.removeEventListener(
                            rec.type,
                            rec.listener,
                            rec.options
                        );
                    } catch {
                        /* Ignore errors */
                    }
                }
            }
        } catch {
            /* Ignore errors */
        }
        // Reset state manager to avoid cross-test subscriptions/history
        try {
            if (typeof __resetStateMgr === "function") __resetStateMgr();
        } catch {
            /* Ignore errors */
        }
        // Note: do NOT reset Vitest module mocks here.
        // We rely on vi.mock hoisting once per test file; resetting per-test breaks
        // identity linking between test-imported spies and modules under test.
    });
} catch {
    /* ignore: runner not yet available */
}

// Also ensure guards are installed before each test, so leaked mocks from a previous test
// don't affect the next test's setup (particularly document.createElement overrides).
try {
    vitestBeforeEach(() => {
        try {
            // Ensure we start each test from a clean native jsdom window/document
            restoreNativeDom();
        } catch {
            /* Ignore errors */
        }
        // Clear any leftover DOM just in case a previous test in the same file
        // left nodes behind. Individual tests should build their own fixtures.
        try {
            if (typeof document !== "undefined" && document.body) {
                document.body.innerHTML = "";
            }
        } catch {
            /* Ignore errors */
        }
        // Also clear any lingering state listeners/history before starting a test
        try {
            if (typeof __clearListeners === "function") __clearListeners();
        } catch {
            /* Ignore errors */
        }
    });
} catch {
    /* ignore: runner not yet available */
}

// Note: We previously overrode vi.mock/vi.doMock and patched Function to capture
// dynamic requires for a few modules. This interfered with Vitest's hoisting
// and caused mocks not to be recognized as spies in many suites. We now rely on
// Vitest's native mocking behavior to ensure proper hoisting and spy identities.

// --- Guard Object.keys so tests that intentionally mock it to throw won't crash Vitest's pretty-format ---
// We still want logWithLevel tests to observe the thrown error path, so rethrow only when called from that file.
(function installSafeObjectKeysGuard() {
    try {
        const nativeKeys = Object.keys.bind(Object);
        /** @type {(o: any) => string[]} */
        let current = nativeKeys;
        const objectKeysWrappers = new WeakSet();

        const isLogWithLevelCall = () => {
            try {
                return /\blogWithLevel\.(?:ts|js)\b/u.test(
                    String(new Error("Capture stack").stack ?? "")
                );
            } catch {
                return false;
            }
        };

        /**
         * Create a stable wrapper function that delegates to the current
         * implementation and falls back to native when errors occur, unless the
         * call came from the logWithLevel failure-path tests.
         */
        const wrapped = (/** @type {any} */ o) => {
            try {
                return /** @type {any} */ (current)(o);
            } catch (err) {
                if (isLogWithLevelCall()) {
                    throw err;
                }
                try {
                    return nativeKeys(o);
                } catch {
                    return [];
                }
            }
        };
        objectKeysWrappers.add(wrapped);

        Object.defineProperty(Object, "keys", {
            configurable: true,
            get() {
                return /** @type {any} */ (wrapped);
            },
            set(v) {
                if (typeof v === "function") {
                    if (objectKeysWrappers.has(v)) {
                        current = nativeKeys; // reset to native to avoid recursion
                    } else {
                        current = /** @type {(o: any) => string[]} */ (v);
                    }
                } else {
                    current = nativeKeys;
                }
            },
        });
    } catch {
        // ignore if environment forbids redefining Object.keys
    }
})();

/**
 * @param {"clearInterval" | "clearTimeout" | "setInterval" | "setTimeout"} name
 * @param {unknown} value
 */
function installTrackedTimerFunction(name, value) {
    try {
        Object.defineProperty(globalThis, name, {
            configurable: true,
            value,
            writable: true,
        });
    } catch {
        /* Ignore errors */
    }
}

// --- Track and clean up timers and DOM event listeners to prevent leaks across tests ---
(function installTimerAndListenerTracking() {
    try {
        if (!vitestTimerAndListenerTrackingInstalled) {
            // Timer tracking
            const timeouts = vitestTrackedTimeouts;
            const intervals = vitestTrackedIntervals;

            const nativeSetTimeout = globalThis.setTimeout?.bind(globalThis);
            const nativeSetInterval = globalThis.setInterval?.bind(globalThis);
            const nativeClearTimeout =
                globalThis.clearTimeout?.bind(globalThis);
            const nativeClearInterval =
                globalThis.clearInterval?.bind(globalThis);

            if (typeof nativeSetTimeout === "function") {
                installTrackedTimerFunction(
                    "setTimeout",
                    (fn, delay, ...args) => {
                        const id = nativeSetTimeout(fn, delay, ...args);
                        try {
                            timeouts.add(id);
                        } catch {
                            /* Ignore errors */
                        }
                        return id;
                    }
                );
            }
            if (typeof nativeSetInterval === "function") {
                installTrackedTimerFunction(
                    "setInterval",
                    (fn, delay, ...args) => {
                        const id = nativeSetInterval(fn, delay, ...args);
                        try {
                            intervals.add(id);
                        } catch {
                            /* Ignore errors */
                        }
                        return id;
                    }
                );
            }
            if (typeof nativeClearTimeout === "function") {
                installTrackedTimerFunction("clearTimeout", (id) => {
                    try {
                        timeouts.delete(id);
                    } catch {
                        /* Ignore errors */
                    }
                    return nativeClearTimeout(id);
                });
            }
            if (typeof nativeClearInterval === "function") {
                installTrackedTimerFunction("clearInterval", (id) => {
                    try {
                        intervals.delete(id);
                    } catch {
                        /* Ignore errors */
                    }
                    return nativeClearInterval(id);
                });
            }

            // DOM event listener tracking for window and document
            const domListeners = vitestTrackedDomListeners;

            function wrapAddRemove(target) {
                try {
                    const rawAdd = target.addEventListener;
                    const rawRemove = target.removeEventListener;
                    const add = rawAdd?.bind(target);
                    const remove = rawRemove?.bind(target);
                    if (
                        typeof add === "function" &&
                        typeof rawAdd === "function" &&
                        !vitestWrappedEventListenerMethods.has(rawAdd)
                    ) {
                        const wrappedAdd = function (type, listener, options) {
                            try {
                                domListeners.push({
                                    target,
                                    type,
                                    listener,
                                    options,
                                });
                            } catch {
                                /* Ignore errors */
                            }
                            return add(type, listener, options);
                        };
                        vitestWrappedEventListenerMethods.add(wrappedAdd);
                        target.addEventListener = /** @type {any} */ (
                            wrappedAdd
                        );
                    }
                    if (
                        typeof remove === "function" &&
                        typeof rawRemove === "function" &&
                        !vitestWrappedEventListenerMethods.has(rawRemove)
                    ) {
                        const wrappedRemove = function (
                            type,
                            listener,
                            options
                        ) {
                            try {
                                const idx = domListeners.findIndex(
                                    (r) =>
                                        r.target === target &&
                                        r.type === type &&
                                        r.listener === listener
                                );
                                if (idx !== -1) domListeners.splice(idx, 1);
                            } catch {
                                /* Ignore errors */
                            }
                            return remove(type, listener, options);
                        };
                        vitestWrappedEventListenerMethods.add(wrappedRemove);
                        target.removeEventListener = /** @type {any} */ (
                            wrappedRemove
                        );
                    }
                } catch {
                    /* Ignore errors */
                }
            }

            if (typeof window !== "undefined") {
                wrapAddRemove(window);
            }
            if (typeof document !== "undefined") {
                wrapAddRemove(document);
            }

            vitestTimerAndListenerTrackingInstalled = true;
        }
    } catch {
        // ignore
    }
})();
