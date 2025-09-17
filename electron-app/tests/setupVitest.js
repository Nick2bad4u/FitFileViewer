// @ts-nocheck
// Mock Leaflet global L for all Vitest tests
import { vi, afterEach as vitestAfterEach, beforeEach as vitestBeforeEach, afterAll as vitestAfterAll } from "vitest";
// Soft import of state manager test-only resets; guarded to avoid module init cost when not present
/** @type {undefined | (() => void)} */
let __resetStateMgr;
/** @type {undefined | (() => void)} */
let __clearListeners;
// Defer loading the state manager using dynamic import to avoid ESM/CJS warning
// and to keep setup lightweight if tests don't touch state.
(async () => {
    try {
        const sm = await import("../utils/state/core/stateManager.js");
        __resetStateMgr = /** @type {any} */ (sm).__resetStateManagerForTests;
        __clearListeners = /** @type {any} */ (sm).__clearAllListenersForTests;
    } catch {
        // ignore - not all suites need state manager helpers
    }
})();

// Reinstall a safe console before/after each test phase to prevent teardown from leaving it undefined
function ensureConsoleAlive() {
    try {
        const noop = () => { };
        /** @type {any} */
        const current = /** @type {any} */ (globalThis.console);
        if (!current) {
            // No console at all – install a full base one
            /** @type {any} */
            const base = {
                log: vi.fn() || noop, warn: vi.fn() || noop, error: vi.fn() || noop, info: vi.fn() || noop, debug: vi.fn() || noop,
                assert: vi.fn() || noop, clear: vi.fn() || noop, count: vi.fn() || noop, countReset: vi.fn() || noop, dir: vi.fn() || noop, dirxml: vi.fn() || noop,
                group: vi.fn() || noop, groupCollapsed: vi.fn() || noop, groupEnd: vi.fn() || noop, table: vi.fn() || noop, time: vi.fn() || noop, timeEnd: vi.fn() || noop,
                timeLog: vi.fn() || noop, timeStamp: vi.fn() || noop, trace: vi.fn() || noop, profile: vi.fn() || noop, profileEnd: vi.fn() || noop,
            };
            try { Object.defineProperty(globalThis, "console", { configurable: true, writable: true, enumerable: true, value: base }); } catch { /* ignore */ }
            if (typeof window !== "undefined") {
                try { Object.defineProperty(window, "console", { configurable: true, writable: true, enumerable: true, value: base }); } catch { /* ignore */ }
            }
            return;
        }
        // Console exists – only polyfill missing methods to avoid clobbering test spies
        if (typeof current.log !== "function") {
            try { current.log = noop; } catch { /* ignore */ }
        }
        const ensure = (name) => { if (typeof current[name] !== "function") { try { current[name] = noop; } catch { /* ignore */ } } };
        [
            "warn", "error", "info", "debug", "assert", "clear", "count", "countReset", "dir", "dirxml",
            "group", "groupCollapsed", "groupEnd", "table", "time", "timeEnd", "timeLog", "timeStamp", "trace", "profile", "profileEnd",
        ].forEach(ensure);
        if (typeof window !== "undefined" && window.console && window.console !== current) {
            try { window.console = current; } catch { /* ignore */ }
        }
    } catch { /* ignore */ }
}

vitestBeforeEach(() => ensureConsoleAlive());
vitestAfterEach(() => ensureConsoleAlive());
vitestAfterAll(() => ensureConsoleAlive());
// Import the enhanced JSDOM setup to fix DOM-related test failures
// Import the enhanced JSDOM setup directly inside setupVitest.js
// directly include the JSDOM setup code instead of importing

// Enhanced JSDOM environment setup (with guards for non-DOM environments)
if (typeof document !== "undefined") {
    if (!document.body) {
        const body = document.createElement("body");
        document.appendChild(body);
    }
}

// Capture native references to the initial jsdom window/document so we can restore
// them between tests if a suite replaces global.document with a plain object.
/** @type {Document | undefined} */
const __nativeDocument = typeof document !== "undefined" ? document : undefined;
/** @type {any} */
const __nativeDocProto = (() => {
    try {
        return __nativeDocument ? Object.getPrototypeOf(__nativeDocument) : undefined;
    } catch {
        return undefined;
    }
})();
/** @type {Window & typeof globalThis | undefined} */
const __nativeWindow = typeof window !== "undefined" ? window : undefined;

// Intentionally avoid capturing canonical Document methods across realms.
// Always derive methods from each document's own realm (doc.defaultView.Document.prototype).

/**
 * Best-effort cleanup of globals that can leak memory or state across tests.
 * Clears Chart.js instance arrays, dev helpers, and storage contents on a given window.
 * @param {any} win
 */
function cleanupWindowGlobals(win) {
    if (!win) return;
    try {
        if (Array.isArray(win._chartjsInstances)) {
            win._chartjsInstances.length = 0;
        }
    } catch { }
    try {
        if (win.__chartjs_dev) {
            try {
                delete win.__chartjs_dev;
            } catch {
                win.__chartjs_dev = undefined;
            }
        }
    } catch { }
    // Clear storage to avoid unit selection bleed (seconds/minutes/hours) between tests
    try {
        win.localStorage && typeof win.localStorage.clear === "function" && win.localStorage.clear();
    } catch { }
    try {
        win.sessionStorage && typeof win.sessionStorage.clear === "function" && win.sessionStorage.clear();
    } catch { }
    // Best-effort DOM cleanup to avoid accumulating detached nodes between tests
    // Note: do not remove document.body children here; it can interfere with running tests
    // and some suites expect DOM to remain intact through specific phases.
    try {
        // no-op body cleanup to avoid cross-test interference
        const _d = win.document; // access to ensure document exists
        void _d;
    } catch { }
    // Disconnect any MutationObserver we might have installed on window
    try {
        const w = /** @type {any} */ (win);
        if (w.tabButtonObserver && typeof w.tabButtonObserver.disconnect === "function") {
            w.tabButtonObserver.disconnect();
            delete w.tabButtonObserver;
        }
    } catch { }
}

/**
 * Restore the global window/document to the original jsdom instances captured at setup time.
 * Also performs cleanup on both the current and native windows to avoid leaks between tests.
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
                typeof d.implementation === "object" && typeof d.implementation.createHTMLDocument === "function";
            const nodeOk = /** @type {any} */ (d).nodeType === 9;
            const viewOk = typeof (/** @type {any} */ (d).defaultView) === "object";
            return !!(apiOk && implOk && nodeOk && viewOk);
        } catch {
            return false;
        }
    };

    // Clean current environment (Chart.js caches, storages, observers)
    try {
        if (curWin) cleanupWindowGlobals(curWin);
    } catch { }
    try {
        // Also clear any globalThis storages if distinct from window
        if (globalThis && globalThis !== curWin) {
            try {
                globalThis.localStorage &&
                    typeof globalThis.localStorage.clear === "function" &&
                    globalThis.localStorage.clear();
            } catch { }
            try {
                globalThis.sessionStorage &&
                    typeof globalThis.sessionStorage.clear === "function" &&
                    globalThis.sessionStorage.clear();
            } catch { }
        }
    } catch { }

    // If the current document is invalid (or missing), restore the native jsdom document
    try {
        if (!isValidDoc(curDoc) && __nativeDocument) {
            try {
                // Restore global document reference
                // @ts-ignore
                globalThis.document = __nativeDocument;
                if (curWin && typeof curWin === "object") {
                    // Keep the same window object but ensure it points to the restored document
                    curWin.document = __nativeDocument;
                }
            } catch { }
        }
    } catch { }

    // Reinstall guards on the effective document and ensure body exists
    try {
        /** @type {any} */
        const effDoc = /** @type {any} */ (typeof document !== "undefined" ? document : __nativeDocument);
        if (effDoc) {
            // Always realign global and window document references to the same instance
            try {
                // @ts-ignore
                globalThis.document = effDoc;
            } catch { }
            try {
                if (curWin && typeof curWin === "object") {
                    curWin.document = effDoc;
                }
            } catch { }
            // Expose a canonical reference for modules to use, avoiding cross-realm mismatches
            try {
                // @ts-ignore
                globalThis.__vitest_effective_document__ = effDoc;
            } catch { }
            installDocumentGuards(effDoc);
            if (!effDoc.body) {
                try {
                    const b = effDoc.createElement ? effDoc.createElement("body") : undefined;
                    if (b) effDoc.appendChild(b);
                } catch { }
            }
        }
    } catch { }
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
    } catch { }
})();

// Rely on JSDOM's native HTMLElement/Element implementations for id/className/classList

// Global console mock setup - ensure console is available for all tests and cannot be unset to undefined
(() => {
    // Create a comprehensive console implementation for testing
    const baseConsole = {
        log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(),
        assert: vi.fn(), clear: vi.fn(), count: vi.fn(), countReset: vi.fn(), dir: vi.fn(), dirxml: vi.fn(),
        group: vi.fn(), groupCollapsed: vi.fn(), groupEnd: vi.fn(), table: vi.fn(), time: vi.fn(), timeEnd: vi.fn(),
        timeLog: vi.fn(), timeStamp: vi.fn(), trace: vi.fn(), Console: vi.fn(), profile: vi.fn(), profileEnd: vi.fn(),
    };
    /** @type {any} */
    let currentConsole = (globalThis.console && typeof globalThis.console.log === "function") ? globalThis.console : baseConsole;
    try {
        Object.defineProperty(globalThis, "console", {
            configurable: true,
            enumerable: true,
            get() { return currentConsole; },
            set(v) {
                if (v && typeof v === "object" && typeof v.log === "function") {
                    currentConsole = /** @type {any} */ (v);
                }
                // Ignore attempts to set undefined/null which break worker stdout hooks
            },
        });
    } catch { }
    // Also ensure window.console exists for browser-like environments and is guarded similarly
    if (typeof window !== "undefined") {
        try {
            Object.defineProperty(window, "console", {
                configurable: true,
                enumerable: true,
                get() { return currentConsole; },
                set(v) {
                    if (v && typeof v === "object" && typeof v.log === "function") {
                        currentConsole = /** @type {any} */ (v);
                    }
                },
            });
        } catch { }
    }
})();

// Even if a console already exists, ensure group APIs are present to avoid TypeError
try {
    if (globalThis.console) {
        if (typeof globalThis.console.group !== "function") {
            // @ts-ignore
            globalThis.console.group = vi.fn();
        }
        if (typeof globalThis.console.groupEnd !== "function") {
            // @ts-ignore
            globalThis.console.groupEnd = vi.fn();
        }
        if (typeof globalThis.console.groupCollapsed !== "function") {
            // @ts-ignore
            globalThis.console.groupCollapsed = vi.fn();
        }
    }
    if (typeof window !== "undefined" && window.console) {
        if (typeof window.console.group !== "function") {
            // @ts-ignore
            window.console.group = /** @type {any} */ (globalThis.console.group || vi.fn());
        }
        if (typeof window.console.groupEnd !== "function") {
            // @ts-ignore
            window.console.groupEnd = /** @type {any} */ (globalThis.console.groupEnd || vi.fn());
        }
        if (typeof window.console.groupCollapsed !== "function") {
            // @ts-ignore
            window.console.groupCollapsed = /** @type {any} */ (globalThis.console.groupCollapsed || vi.fn());
        }
    }
} catch { }

// Global localStorage mock setup (handles opaque origin throwing on access)
function ensureSafeLocalStorage() {
    if (typeof window === "undefined") return;
    /** @type {any} */
    const w = window;
    const createMock = () => {
        const localStorageMock = {
            /** @type {Record<string, string>} */
            store: {},
            getItem: vi.fn((/** @type {string} */ key) => {
                return Object.prototype.hasOwnProperty.call(localStorageMock.store, key)
                    ? localStorageMock.store[key]
                    : null;
            }),
            setItem: vi.fn((/** @type {string} */ key, /** @type {unknown} */ value) => {
                localStorageMock.store[key] = String(value);
            }),
            removeItem: vi.fn((/** @type {string} */ key) => {
                delete localStorageMock.store[key];
            }),
            clear: vi.fn(() => {
                localStorageMock.store = {};
            }),
            key: vi.fn((/** @type {number} */ index) => Object.keys(localStorageMock.store)[index] || null),
            get length() {
                return Object.keys(localStorageMock.store).length;
            },
        };
        return localStorageMock;
    };
    let needsOverride = false;
    try {
        // Accessor can throw in jsdom for opaque origins
        // eslint-disable-next-line no-unused-expressions
        w.localStorage && w.localStorage.length;
    } catch {
        needsOverride = true;
    }
    if (needsOverride) {
        const mock = createMock();
        try {
            Object.defineProperty(w, "localStorage", {
                value: mock,
                configurable: true,
                writable: true,
            });
        } catch {
            // Fallback assignment
            w.localStorage = /** @type {any} */ (mock);
        }
        // Mirror on globalThis for code accessing it directly
        try {
            Object.defineProperty(globalThis, "localStorage", {
                value: mock,
                configurable: true,
                writable: true,
            });
        } catch {
            /** @type {any} */ (globalThis).localStorage = /** @type {any} */ (mock);
        }
    }
}

ensureSafeLocalStorage();

// Global sessionStorage mock setup (handles opaque origin throwing on access)
function ensureSafeSessionStorage() {
    if (typeof window === "undefined") return;
    /** @type {any} */
    const w = window;
    const createMock = () => {
        const sessionStorageMock = {
            /** @type {Record<string, string>} */
            store: {},
            getItem: vi.fn((/** @type {string} */ key) => {
                return Object.prototype.hasOwnProperty.call(sessionStorageMock.store, key)
                    ? sessionStorageMock.store[key]
                    : null;
            }),
            setItem: vi.fn((/** @type {string} */ key, /** @type {unknown} */ value) => {
                sessionStorageMock.store[key] = String(value);
            }),
            removeItem: vi.fn((/** @type {string} */ key) => {
                delete sessionStorageMock.store[key];
            }),
            clear: vi.fn(() => {
                sessionStorageMock.store = {};
            }),
            key: vi.fn((/** @type {number} */ index) => Object.keys(sessionStorageMock.store)[index] || null),
            get length() {
                return Object.keys(sessionStorageMock.store).length;
            },
        };
        return sessionStorageMock;
    };
    let needsOverride = false;
    try {
        // Accessor can throw in jsdom for opaque origins
        // eslint-disable-next-line no-unused-expressions
        w.sessionStorage && w.sessionStorage.length;
    } catch {
        needsOverride = true;
    }
    if (needsOverride) {
        const mock = createMock();
        try {
            Object.defineProperty(w, "sessionStorage", {
                value: mock,
                configurable: true,
                writable: true,
            });
        } catch {
            // Fallback assignment
            w.sessionStorage = /** @type {any} */ (mock);
        }
        // Mirror on globalThis for code accessing it directly
        try {
            Object.defineProperty(globalThis, "sessionStorage", {
                value: mock,
                configurable: true,
                writable: true,
            });
        } catch {
            /** @type {any} */ (globalThis).sessionStorage = /** @type {any} */ (mock);
        }
    }
}

ensureSafeSessionStorage();

// Global mocks for Electron application testing
// These mocks provide comprehensive testing infrastructure for the Electron app

// Create global mock objects that will be used in dynamic electron mocking
globalThis.createElectronMocks = () => {
    const mockApp = {
        getPath: vi.fn((name) => {
            // Use explicit mapping to avoid TypeScript index signature issues
            if (name === "userData") return "/mock/path/userData";
            if (name === "appData") return "/mock/path/appData";
            if (name === "temp") return "/mock/path/temp";
            if (name === "desktop") return "/mock/path/desktop";
            if (name === "documents") return "/mock/path/documents";
            if (name === "downloads") return "/mock/path/downloads";
            if (name === "music") return "/mock/path/music";
            if (name === "pictures") return "/mock/path/pictures";
            if (name === "videos") return "/mock/path/videos";
            if (name === "home") return "/mock/path/home";
            return `/mock/path/${String(name)}`;
        }),
        isPackaged: false,
        getVersion: vi.fn(() => "1.0.0"),
        getName: vi.fn(() => "FitFileViewer"),
        on: vi.fn(),
        whenReady: vi.fn(() => Promise.resolve()),
        quit: vi.fn(),
    };

    const mockIpcRenderer = {
        invoke: vi.fn().mockResolvedValue("mock-result"),
        send: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        removeListener: vi.fn(),
        removeAllListeners: vi.fn(),
    };

    const mockContextBridge = {
        exposeInMainWorld: vi.fn(),
    };

    return {
        app: mockApp,
        ipcRenderer: mockIpcRenderer,
        contextBridge: mockContextBridge,
    };
};

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

const leafletMock = {
    tileLayer: vi.fn(() => ({
        addTo: vi.fn(),
        setZIndex: vi.fn(),
        on: vi.fn(),
        remove: vi.fn(),
    })),
    map: vi.fn(() => ({
        setView: vi.fn(),
        addLayer: vi.fn(),
        on: vi.fn(),
        remove: vi.fn(),
        getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
        getZoom: vi.fn(() => 13),
        fitBounds: vi.fn(),
        invalidateSize: vi.fn(),
        addControl: vi.fn(),
        removeControl: vi.fn(),
        eachLayer: vi.fn(),
    })),
    control: {
        layers: vi.fn(() => ({ addTo: vi.fn() })),
        scale: vi.fn(() => ({ addTo: vi.fn() })),
        fullscreen: vi.fn(() => ({ addTo: vi.fn() })),
        locate: vi.fn(() => ({ addTo: vi.fn() })),
        measure: vi.fn(() => ({ addTo: vi.fn() })),
        Draw: { Event: { CREATED: "created" } },
    },
    markerClusterGroup: vi.fn(() => ({ addLayer: vi.fn() })),
    marker: vi.fn(() => ({ addTo: vi.fn(() => ({ getElement: vi.fn(() => null) })) })),
    polyline: vi.fn(() => ({ addTo: vi.fn() })),
    latLng: vi.fn((lat, lng) => ({ lat, lng })),
    divIcon: vi.fn(() => ({})),
    FeatureGroup: vi.fn(() => ({ addLayer: vi.fn() })),
    Control: { MiniMap: vi.fn(() => ({ addTo: vi.fn() })), Draw: vi.fn(() => ({ addTo: vi.fn() })) },
    maplibreGL: vi.fn(() => ({
        addTo: vi.fn(),
        setZIndex: vi.fn(),
        on: vi.fn(),
        remove: vi.fn(),
    })),
};

global.L = leafletMock;

// Ensure HTMLElement is available globally for instanceof checks
if (typeof window !== "undefined" && typeof window.HTMLElement !== "undefined") {
    global.HTMLElement = window.HTMLElement;
}

if (typeof window !== "undefined") {
    window.L = leafletMock;
    // Ensure window.addEventListener is mocked
    if (!window.addEventListener) {
        window.addEventListener = vi.fn();
        window.removeEventListener = vi.fn();
    }
    // Ensure window.dispatchEvent exists for jsdom-like environments
    if (typeof window.dispatchEvent !== "function") {
        try {
            // Bind to EventTarget prototype if available
            // @ts-ignore
            const et = typeof EventTarget !== "undefined" ? EventTarget.prototype.dispatchEvent : undefined;
            if (typeof et === "function") {
                // @ts-ignore
                window.dispatchEvent = /** @type {(event: Event) => boolean} */ (et.bind(window));
            } else {
                // Fallback no-op to avoid hard failures in tests that call dispatchEvent
                /** @type {(event: Event) => boolean} */
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const noop = (_event) => true;
                // @ts-ignore
                window.dispatchEvent = noop;
            }
        } catch {
            /** @type {(event: Event) => boolean} */
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const noop = (_event) => true;
            // @ts-ignore
            window.dispatchEvent = noop;
        }
    }
}

// Helper to install guards on a specific Document instance (handles reassignments)
/**
 * Restore critical Document methods if tests replaced them and ensure body exists.
 * Always rebind to the current document's prototype implementations to avoid leaked mocks.
 * @param {Document} doc
 */
function installDocumentGuards(doc) {
    if (!doc) return;
    // Derive natives from the document's own realm to prevent cross-realm brand check failures
    /** @type {{
     *  createElement?: (this: Document, tag: string, options?: any) => any,
     *  createTextNode?: (this: Document, data: string) => any,
     *  createDocumentFragment?: (this: Document) => any,
     *  querySelector?: (this: Document, sel: string) => any,
     *  querySelectorAll?: (this: Document, sel: string) => any,
     *  getElementById?: (this: Document, id: string) => any,
     *  getElementsByClassName?: (this: Document, cls: string) => any,
     *  getElementsByTagName?: (this: Document, tag: string) => any,
     *  appendChild?: (this: Document, node: any) => any
     * } | undefined}
     */
    let canon;
    try {
        const realmDocProto = /** @type {any} */ (doc?.defaultView?.Document?.prototype);
        if (realmDocProto && typeof realmDocProto.createElement === "function") {
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
    } catch { }
    // Cache of native methods per Document instance to survive prototype tampering (legacy fallback)
    /** @type {WeakMap<Document, any>} */
    const nativeMap = /** @type {any} */ (globalThis).__vitest_doc_native_methods || new WeakMap();
    /** @type {any} */ (globalThis).__vitest_doc_native_methods = nativeMap;
    try {
        let natives = nativeMap.get(doc);
        if (!natives) {
            // Start from same-realm canonical snapshot if available; else derive from current prototype
            if (canon) {
                natives = { ...canon };
            } else {
                const Proto = /** @type {any} */ (Object.getPrototypeOf(doc));
                natives = {
                    createElement: typeof Proto?.createElement === "function" ? Proto.createElement : undefined,
                    createTextNode: typeof Proto?.createTextNode === "function" ? Proto.createTextNode : undefined,
                    createDocumentFragment:
                        typeof Proto?.createDocumentFragment === "function" ? Proto.createDocumentFragment : undefined,
                    querySelector: typeof Proto?.querySelector === "function" ? Proto.querySelector : undefined,
                    querySelectorAll:
                        typeof Proto?.querySelectorAll === "function" ? Proto.querySelectorAll : undefined,
                    getElementById: typeof Proto?.getElementById === "function" ? Proto.getElementById : undefined,
                    getElementsByClassName:
                        typeof Proto?.getElementsByClassName === "function" ? Proto.getElementsByClassName : undefined,
                    getElementsByTagName:
                        typeof Proto?.getElementsByTagName === "function" ? Proto.getElementsByTagName : undefined,
                    appendChild: typeof Proto?.appendChild === "function" ? Proto.appendChild : undefined,
                };
            }
            nativeMap.set(doc, natives);
        }
        // Rebind document methods from cached natives
        try {
            if (typeof natives.createElement === "function") doc.createElement = natives.createElement.bind(doc);
        } catch { }
        try {
            if (typeof natives.createTextNode === "function") doc.createTextNode = natives.createTextNode.bind(doc);
        } catch { }
        try {
            if (typeof natives.createDocumentFragment === "function")
                doc.createDocumentFragment = natives.createDocumentFragment.bind(doc);
        } catch { }
        try {
            if (typeof natives.querySelector === "function") doc.querySelector = natives.querySelector.bind(doc);
        } catch { }
        try {
            if (typeof natives.querySelectorAll === "function")
                doc.querySelectorAll = natives.querySelectorAll.bind(doc);
        } catch { }
        try {
            if (typeof natives.getElementById === "function") doc.getElementById = natives.getElementById.bind(doc);
        } catch { }
        try {
            if (typeof natives.getElementsByClassName === "function")
                doc.getElementsByClassName = natives.getElementsByClassName.bind(doc);
        } catch { }
        try {
            if (typeof natives.getElementsByTagName === "function")
                doc.getElementsByTagName = natives.getElementsByTagName.bind(doc);
        } catch { }
        try {
            if (typeof natives.appendChild === "function") doc.appendChild = natives.appendChild.bind(doc);
        } catch { }
    } catch { }
    // Ensure document has a body element
    if (!doc.body) {
        try {
            const body = doc.createElement("body");
            doc.appendChild(body);
        } catch { }
    }
    // Validate createElement returns a node; if not, attempt a last-resort recovery using same-realm natives
    try {
        const testEl = /** @type {any} */ (doc.createElement?.("div"));
        if (!testEl || typeof testEl !== "object") {
            // Fallback to same-realm snapshot if available
            if (canon && typeof canon.createElement === "function") {
                try {
                    doc.createElement = canon.createElement.bind(doc);
                } catch { }
            } else {
                // Attempt to reconstruct doc methods via current prototype again
                const Proto = /** @type {any} */ (Object.getPrototypeOf(doc));
                try {
                    if (typeof Proto?.createElement === "function") doc.createElement = Proto.createElement.bind(doc);
                } catch { }
            }
        }
    } catch { }
}

// Make sure JSDOM is properly initialized for tests and guards are installed
if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (!document.body) {
        const body = document.createElement("body");
        document.appendChild(body);
    }
    if (typeof window.alert !== "function") {
        window.alert = vi.fn();
    }
    // Install guards on current document only. Some tests replace global document
    // and rely on direct mocking of its methods; intercepting assignments here
    // can break JSDOM invariants. If a test replaces document, it can call
    // installDocumentGuards(document) manually if needed.
    installDocumentGuards(document);
}

// Prevent replacing core constructors with non-functions which breaks instanceof checks in Vitest
(() => {
    /**
     * Install a safe accessor for a global constructor-like symbol.
     * If someone assigns a non-function, keep the native reference instead.
     * @param {keyof typeof globalThis} name
     */
    function installSafeConstructor(name) {
        try {
            // @ts-ignore
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
    // @ts-ignore
    if (typeof globalThis.Buffer !== "undefined") installSafeConstructor("Buffer");

    // Also guard on window if present (some suites use window.Error etc.)
    if (typeof window !== "undefined") {
        const names = ["Error", "RegExp", "Date", "Promise", "Map", "Set", "WeakMap", "WeakSet"];
        for (const n of names) {
            try {
                // @ts-ignore
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
            } catch { }
        }
        // Also guard window.Buffer if present
        try {
            // @ts-ignore
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
        } catch { }
    }
})();

// --- Safety guards for global process stubbing in tests ---
// Some tests replace or stub the global `process` object which can break Vitest internals
// that rely on EventEmitter methods like `process.listeners`. We defensively ensure that
// replacing `process` keeps required methods available.
(function installSafeProcessGuards() {
    /**
     * Merge a provided partial process-like object with the original Node `process`,
     * ensuring EventEmitter-style methods exist to keep Vitest stable.
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
            if (typeof document !== "undefined") installDocumentGuards(document);
        } catch { }
        return result;
    };
    const originalRestoreAllMocks = vi.restoreAllMocks.bind(vi);
    vi.restoreAllMocks = (...args) => {
        const result = originalRestoreAllMocks(...args);
        try {
            if (typeof document !== "undefined") installDocumentGuards(document);
        } catch { }
        return result;
    };
} catch { }

// Global afterEach to reinstall guards in case tests mutated DOM APIs
vitestAfterEach(() => {
    try {
        // Restore DOM to native jsdom and reinstall guards after each test
        restoreNativeDom();
    } catch { }
    // Ensure canonical effective document reflects the current global document
    try {
        // @ts-ignore
        globalThis.__vitest_effective_document__ = typeof document !== "undefined" ? document : undefined;
    } catch { }
    // Ensure no DOM from a previous test leaks into the next one
    try {
        if (typeof document !== "undefined" && document.body) {
            document.body.innerHTML = "";
        }
    } catch { }
    // Disconnect MutationObservers and clear timers/listeners best-effort
    try {
        if (typeof window !== "undefined") {
            const w = /** @type {any} */ (window);
            if (w.tabButtonObserver && typeof w.tabButtonObserver.disconnect === "function") {
                w.tabButtonObserver.disconnect();
                delete w.tabButtonObserver;
            }
        }
    } catch { }
    // Clear tracked timers
    try {
        /** @type {Set<number>} */
        const timeouts = /** @type {any} */ (globalThis).__vitest_tracked_timeouts;
        /** @type {Set<number>} */
        const intervals = /** @type {any} */ (globalThis).__vitest_tracked_intervals;
        if (timeouts && typeof clearTimeout === "function") {
            for (const id of Array.from(timeouts)) {
                try {
                    clearTimeout(id);
                } catch { }
            }
            timeouts.clear?.();
        }
        if (intervals && typeof clearInterval === "function") {
            for (const id of Array.from(intervals)) {
                try {
                    clearInterval(id);
                } catch { }
            }
            intervals.clear?.();
        }
    } catch { }
    // Remove tracked DOM event listeners
    try {
        /** @type {Array<{target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: any}>} */
        const listeners = /** @type {any} */ (globalThis).__vitest_tracked_dom_listeners;
        if (Array.isArray(listeners)) {
            for (const rec of listeners.splice(0, listeners.length)) {
                try {
                    rec.target.removeEventListener(rec.type, rec.listener, rec.options);
                } catch { }
            }
        }
    } catch { }
    // Reset state manager to avoid cross-test subscriptions/history
    try {
        if (typeof __resetStateMgr === "function") __resetStateMgr();
    } catch { }
    // Note: do NOT clear the manual mock registry here.
    // We rely on vi.mock hoisting once per test file; clearing per-test breaks
    // identity linking between test-imported spies and modules under test.
});

// Also ensure guards are installed before each test, so leaked mocks from a previous test
// don't affect the next test's setup (particularly document.createElement overrides).
vitestBeforeEach(() => {
    try {
        // Ensure we start each test from a clean native jsdom window/document
        restoreNativeDom();
    } catch { }
    // Ensure canonical effective document reflects the current global document
    try {
        // @ts-ignore
        globalThis.__vitest_effective_document__ = typeof document !== "undefined" ? document : undefined;
    } catch { }
    // Clear any leftover DOM just in case a previous test in the same file
    // left nodes behind. Individual tests should build their own fixtures.
    try {
        if (typeof document !== "undefined" && document.body) {
            document.body.innerHTML = "";
        }
    } catch { }
    // Also clear any lingering state listeners/history before starting a test
    try {
        if (typeof __clearListeners === "function") __clearListeners();
    } catch { }
});

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
        // Global opt-in flag to allow tests to force throw-through
        // @ts-ignore
        if (typeof globalThis.__vitest_object_keys_allow_throw !== "boolean") {
            // @ts-ignore
            globalThis.__vitest_object_keys_allow_throw = false;
        }
        /**
         * Create a stable wrapper function that delegates to the current implementation
         * and falls back to native when errors occur, unless tests opt-in to throw-through.
         */
        const wrapped = (/** @type {any} */ o) => {
            try {
                // @ts-ignore - may be a mocked implementation
                return /** @type {any} */ (current)(o);
            } catch (err) {
                // @ts-ignore
                if (globalThis.__vitest_object_keys_allow_throw) {
                    throw err;
                }
                try {
                    return nativeKeys(o);
                } catch {
                    return [];
                }
            }
        };
        // Mark the wrapper so restoring Object.keys to this function resets to native
        Object.defineProperty(wrapped, "__isObjectKeysWrapper", { value: true, enumerable: false });

        Object.defineProperty(Object, "keys", {
            configurable: true,
            get() {
                return /** @type {any} */ (wrapped);
            },
            set(v) {
                if (typeof v === "function") {
                    // @ts-ignore
                    if (v && v.__isObjectKeysWrapper) {
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

// --- Track and clean up timers and DOM event listeners to prevent leaks across tests ---
(function installTimerAndListenerTracking() {
    try {
        if (!("__vitest_timers_wrapped" in /** @type {any} */ (globalThis))) {
            // Timer tracking
            const timeouts = new Set();
            const intervals = new Set();
            /** @type {any} */ (globalThis).__vitest_tracked_timeouts = timeouts;
            /** @type {any} */ (globalThis).__vitest_tracked_intervals = intervals;

            const nativeSetTimeout = globalThis.setTimeout?.bind(globalThis);
            const nativeSetInterval = globalThis.setInterval?.bind(globalThis);
            const nativeClearTimeout = globalThis.clearTimeout?.bind(globalThis);
            const nativeClearInterval = globalThis.clearInterval?.bind(globalThis);

            if (typeof nativeSetTimeout === "function") {
                globalThis.setTimeout = /** @type {any} */ (
                    (fn, delay, ...args) => {
                        const id = nativeSetTimeout(fn, delay, ...args);
                        try {
                            timeouts.add(id);
                        } catch { }
                        return id;
                    }
                );
            }
            if (typeof nativeSetInterval === "function") {
                globalThis.setInterval = /** @type {any} */ (
                    (fn, delay, ...args) => {
                        const id = nativeSetInterval(fn, delay, ...args);
                        try {
                            intervals.add(id);
                        } catch { }
                        return id;
                    }
                );
            }
            if (typeof nativeClearTimeout === "function") {
                globalThis.clearTimeout = /** @type {any} */ (
                    (id) => {
                        try {
                            timeouts.delete(id);
                        } catch { }
                        return nativeClearTimeout(id);
                    }
                );
            }
            if (typeof nativeClearInterval === "function") {
                globalThis.clearInterval = /** @type {any} */ (
                    (id) => {
                        try {
                            intervals.delete(id);
                        } catch { }
                        return nativeClearInterval(id);
                    }
                );
            }

            // DOM event listener tracking for window and document
            /** @type {any[]} */
            const domListeners = [];
            /** @type {any} */ (globalThis).__vitest_tracked_dom_listeners = domListeners;

            function wrapAddRemove(target) {
                try {
                    const add = target.addEventListener?.bind(target);
                    const remove = target.removeEventListener?.bind(target);
                    if (typeof add === "function" && !add.__vitest_wrapped) {
                        const wrappedAdd = function (type, listener, options) {
                            try {
                                domListeners.push({ target, type, listener, options });
                            } catch { }
                            return add(type, listener, options);
                        };
                        wrappedAdd.__vitest_wrapped = true;
                        target.addEventListener = /** @type {any} */ (wrappedAdd);
                    }
                    if (typeof remove === "function" && !remove.__vitest_wrapped) {
                        const wrappedRemove = function (type, listener, options) {
                            try {
                                const idx = domListeners.findIndex(
                                    (r) => r.target === target && r.type === type && r.listener === listener
                                );
                                if (idx !== -1) domListeners.splice(idx, 1);
                            } catch { }
                            return remove(type, listener, options);
                        };
                        wrappedRemove.__vitest_wrapped = true;
                        target.removeEventListener = /** @type {any} */ (wrappedRemove);
                    }
                } catch { }
            }

            if (typeof window !== "undefined") {
                wrapAddRemove(window);
            }
            if (typeof document !== "undefined") {
                wrapAddRemove(document);
            }

            /** @type {any} */ (globalThis).__vitest_timers_wrapped = true;
        }
    } catch {
        // ignore
    }
})();
