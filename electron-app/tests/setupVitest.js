// Mock Leaflet global L for all Vitest tests
import { vi, afterEach as vitestAfterEach } from "vitest";
// Import the enhanced JSDOM setup to fix DOM-related test failures
// Import the enhanced JSDOM setup directly inside setupVitest.js
// directly include the JSDOM setup code instead of importing

// Enhanced JSDOM environment setup (with guards for non-DOM environments)
if (typeof document !== 'undefined') {
    if (!document.body) {
        const body = document.createElement('body');
        document.appendChild(body);
    }
}

// Lock Buffer early to a callable native reference to prevent instanceof crashes in Vitest serializers
(() => {
    try {
        const originalBuffer = globalThis.Buffer;
        if (originalBuffer && typeof originalBuffer === 'function') {
            let current = originalBuffer;
            Object.defineProperty(globalThis, 'Buffer', {
                configurable: true,
                get() { return current; },
                set(v) { if (typeof v === 'function') current = v; }
            });
            if (typeof window !== 'undefined') {
                let wCurrent = originalBuffer;
                Object.defineProperty(window, 'Buffer', {
                    configurable: true,
                    get() { return wCurrent; },
                    set(v) { if (typeof v === 'function') wCurrent = v; }
                });
            }
        }
    } catch {}
})();

// Rely on JSDOM's native HTMLElement/Element implementations for id/className/classList

// Global console mock setup - ensure console is available for all tests
if (!globalThis.console || typeof globalThis.console.log !== 'function') {
    // Create a comprehensive console implementation for testing
    const mockConsole = {
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
        profileEnd: vi.fn()
    };
    globalThis.console = mockConsole;
}

// Also ensure window.console exists for browser-like environments
if (typeof window !== "undefined" && (!window.console || typeof window.console.log !== 'function')) {
    window.console = globalThis.console;
}

// Global localStorage mock setup (handles opaque origin throwing on access)
function ensureSafeLocalStorage() {
    if (typeof window === 'undefined') return;
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
            clear: vi.fn(() => { localStorageMock.store = {}; }),
            key: vi.fn((/** @type {number} */ index) => Object.keys(localStorageMock.store)[index] || null),
            get length() { return Object.keys(localStorageMock.store).length; }
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
            Object.defineProperty(w, 'localStorage', {
                value: mock,
                configurable: true,
                writable: true
            });
        } catch {
            // Fallback assignment
            w.localStorage = /** @type {any} */ (mock);
        }
        // Mirror on globalThis for code accessing it directly
        try {
            Object.defineProperty(globalThis, 'localStorage', {
                value: mock,
                configurable: true,
                writable: true
            });
        } catch {
            /** @type {any} */ (globalThis).localStorage = /** @type {any} */ (mock);
        }
    }
}

ensureSafeLocalStorage();

// Global sessionStorage mock setup (handles opaque origin throwing on access)
function ensureSafeSessionStorage() {
    if (typeof window === 'undefined') return;
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
            clear: vi.fn(() => { sessionStorageMock.store = {}; }),
            key: vi.fn((/** @type {number} */ index) => Object.keys(sessionStorageMock.store)[index] || null),
            get length() { return Object.keys(sessionStorageMock.store).length; }
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
            Object.defineProperty(w, 'sessionStorage', {
                value: mock,
                configurable: true,
                writable: true
            });
        } catch {
            // Fallback assignment
            w.sessionStorage = /** @type {any} */ (mock);
        }
        // Mirror on globalThis for code accessing it directly
        try {
            Object.defineProperty(globalThis, 'sessionStorage', {
                value: mock,
                configurable: true,
                writable: true
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
            if (name === 'userData') return '/mock/path/userData';
            if (name === 'appData') return '/mock/path/appData';
            if (name === 'temp') return '/mock/path/temp';
            if (name === 'desktop') return '/mock/path/desktop';
            if (name === 'documents') return '/mock/path/documents';
            if (name === 'downloads') return '/mock/path/downloads';
            if (name === 'music') return '/mock/path/music';
            if (name === 'pictures') return '/mock/path/pictures';
            if (name === 'videos') return '/mock/path/videos';
            if (name === 'home') return '/mock/path/home';
            return `/mock/path/${String(name)}`;
        }),
        isPackaged: false,
        getVersion: vi.fn(() => '1.0.0'),
        getName: vi.fn(() => 'FitFileViewer'),
        on: vi.fn(),
        whenReady: vi.fn(() => Promise.resolve()),
        quit: vi.fn()
    };

    const mockIpcRenderer = {
        invoke: vi.fn().mockResolvedValue('mock-result'),
        send: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        removeListener: vi.fn(),
        removeAllListeners: vi.fn()
    };

    const mockContextBridge = {
        exposeInMainWorld: vi.fn()
    };

    return {
        app: mockApp,
        ipcRenderer: mockIpcRenderer,
        contextBridge: mockContextBridge
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
        store: {}
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
        __mockOnDidAnyChange: mockOnDidAnyChange
    };

    // Return for both ES6 default and named exports
    return {
        ...mockModule,
        default: mockModule
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
if (typeof window !== "undefined") {
    window.L = leafletMock;
    // Ensure window.addEventListener is mocked
    if (!window.addEventListener) {
        window.addEventListener = vi.fn();
        window.removeEventListener = vi.fn();
    }
    // Ensure window.dispatchEvent exists for jsdom-like environments
    if (typeof window.dispatchEvent !== 'function') {
        try {
            // Bind to EventTarget prototype if available
            // @ts-ignore
            const et = typeof EventTarget !== 'undefined' ? EventTarget.prototype.dispatchEvent : undefined;
            if (typeof et === 'function') {
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
 * @param {Document} doc
 */
function installDocumentGuards(doc) {
    // No-op guard: avoid overriding core DOM APIs to keep JSDOM behavior intact.
    if (!doc) return;
    if (!doc.body) {
        try {
            const body = doc.createElement('body');
            doc.appendChild(body);
        } catch {}
    }
}

// Make sure JSDOM is properly initialized for tests and guards are installed
if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (!document.body) {
        const body = document.createElement('body');
        document.appendChild(body);
    }
    if (typeof window.alert !== 'function') {
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
            if (typeof nativeRef !== 'function') return; // nothing to do
            let current = nativeRef;
            Object.defineProperty(globalThis, name, {
                configurable: true,
                get() { return current; },
                set(v) { current = (typeof v === 'function') ? v : nativeRef; }
            });
        } catch {
            // ignore
        }
    }

    // Guard most commonly used constructors in test runners
    installSafeConstructor('Error');
    installSafeConstructor('RegExp');
    installSafeConstructor('Date');
    installSafeConstructor('Promise');
    installSafeConstructor('Map');
    installSafeConstructor('Set');
    installSafeConstructor('WeakMap');
    installSafeConstructor('WeakSet');
    // Guard Buffer to avoid instanceof crashes in Vitest error serializer
    // @ts-ignore
    if (typeof globalThis.Buffer !== 'undefined') installSafeConstructor('Buffer');

    // Also guard on window if present (some suites use window.Error etc.)
    if (typeof window !== 'undefined') {
        const names = ['Error','RegExp','Date','Promise','Map','Set','WeakMap','WeakSet'];
        for (const n of names) {
            try {
                // @ts-ignore
                const nativeRef = window[n];
                if (typeof nativeRef !== 'function') continue;
                let current = nativeRef;
                Object.defineProperty(window, n, {
                    configurable: true,
                    get() { return current; },
                    set(v) { current = (typeof v === 'function') ? v : nativeRef; }
                });
            } catch {}
        }
        // Also guard window.Buffer if present
        try {
            // @ts-ignore
            const nativeBuf = window.Buffer;
            if (typeof nativeBuf === 'function') {
                let current = nativeBuf;
                Object.defineProperty(window, 'Buffer', {
                    configurable: true,
                    get() { return current; },
                    set(v) { current = (typeof v === 'function') ? v : nativeBuf; }
                });
            }
        } catch {}
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
        if (typeof merged.listeners !== 'function') merged.listeners = () => [];
        if (typeof merged.on !== 'function') merged.on = () => merged;
        if (typeof merged.off !== 'function') merged.off = () => merged;
        if (typeof merged.once !== 'function') merged.once = () => merged;
        if (!merged.env) merged.env = {};
        if (!Array.isArray(merged.argv)) merged.argv = [];
        return merged;
    }

    // Wrap vi.stubGlobal to merge process overrides safely
    const originalStubGlobal = vi.stubGlobal.bind(vi);
    vi.stubGlobal = (key, value) => {
        if (key === 'process') {
            try {
                const safe = mergeProcess(globalThis.process, value);
                return originalStubGlobal(key, safe);
            } catch {
                // Fallback if something goes wrong
                return originalStubGlobal(key, value);
            }
        } else if (key === 'Buffer') {
            try {
                const nativeBuf = globalThis.Buffer;
                const safe = (typeof value === 'function') ? value : nativeBuf;
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
        Object.defineProperty(globalThis, 'process', {
            configurable: true,
            get() { return current; },
            set(v) { current = mergeProcess(originalProcess, v); }
        });
    } catch {
        // If defining an accessor fails (environment dependent), do nothing
    }

    // Finally, ensure at least the current process has the required methods
    try {
        const p = globalThis.process;
        if (p && typeof p.listeners !== 'function') p.listeners = () => [];
        if (p && typeof p.on !== 'function') p.on = () => p;
        if (p && typeof p.off !== 'function') p.off = () => p;
        if (p && typeof p.once !== 'function') p.once = () => p;
    } catch {
        // ignore
    }
})();

// Ensure that after each test (and after vi.resetAllMocks) we reinstall guards on the current document
try {
    const originalResetAllMocks = vi.resetAllMocks.bind(vi);
    vi.resetAllMocks = (...args) => {
        const result = originalResetAllMocks(...args);
        try { if (typeof document !== 'undefined') installDocumentGuards(document); } catch {}
        return result;
    };
    const originalRestoreAllMocks = vi.restoreAllMocks.bind(vi);
    vi.restoreAllMocks = (...args) => {
        const result = originalRestoreAllMocks(...args);
        try { if (typeof document !== 'undefined') installDocumentGuards(document); } catch {}
        return result;
    };
} catch {}

// Global afterEach to reinstall guards in case tests mutated DOM APIs
vitestAfterEach(() => {
    try {
        if (typeof document !== 'undefined') installDocumentGuards(document);
    } catch {}
});

// Intentionally avoid overriding vi.doMock or vi.fn to preserve Vitest internals and snapshot stability

// ------------------------------------------------------------
// Manual mock registry to support custom module factories that
// use CommonJS-style `require()` inside dynamically created
// functions (new Function('require', 'module', 'exports', ...)).
// We capture vi.doMock factories and expose a global synchronous
// require shim so those dynamic modules can resolve the same
// mocked modules used by Vitest.
// ------------------------------------------------------------
(() => {
    /** @type {Map<string, any>} */
    const manualMockRegistry = new Map();
    const originalDoMock = vi.doMock ? vi.doMock.bind(vi) : undefined;
    if (originalDoMock) {
        // Wrap vi.doMock to record factory results for direct lookup
        // We still call through to Vitest so normal mocking works.
        // Note: The factory is executed here to capture references to
        // test-local mock objects.
        // Override with a looser-typed function; cast to any to satisfy TS
        /**
         * @param {string} id
         * @param {(() => any)=} factory
         * @param {any=} options
         */
        /** @type {any} */
    /** @type {(id: any, factory?: any, options?: any) => any} */
    (vi).doMock = (id, factory, options) => {
            try {
                if (typeof factory === 'function') {
                    const result = /** @type {any} */ (factory());
                    // Prefer default export if present, else the object itself
                    manualMockRegistry.set(String(id), result && result.default ? result.default : result);
                }
            } catch {
                // Ignore factory execution errors here; Vitest will execute it later as well
            }
            // Call through to original doMock using appropriate arity
            try {
                if (typeof options !== 'undefined') {
                    // @ts-ignore - allow 3rd arg by casting
                    return /** @type {any} */ (originalDoMock)(id, factory, options);
                }
                return /** @type {any} */ (originalDoMock)(id, factory);
            } catch {
                return /** @type {any} */ (originalDoMock)(id, factory);
            }
        };
    }

    // Expose a minimal synchronous require that fetches from the registry
    // This is used by patched dynamic modules created via new Function
    // in certain tests (e.g., main.basic.test.ts).
    /**
     * @param {string} id
     */
    const syncRequire = (id) => {
        return manualMockRegistry.get(String(id));
    };
    // Make available globally
    // @ts-ignore
    globalThis.__vitest_manual_mocks__ = manualMockRegistry;
    // @ts-ignore
    globalThis.__vitest_require__ = syncRequire;

    // Patch global Function constructor to rewrite specific dynamic module
    // sources so that `require('electron')` and similar calls map to our
    // synchronous mock require above. Keep this surgical to avoid side effects
    // and only rewrite when there is an actual manual mock registered. This
    // prevents hijacking tests that pass a custom require implementation.
    // eslint-disable-next-line no-new-func
    const NativeFunction = Function;
    // @ts-ignore
    globalThis.Function = function (...args) {
        try {
            const src = /** @type {unknown} */ (args[args.length - 1]);
            const params = args.slice(0, -1).map(String);
            if (typeof src === 'string' && params.length >= 1 && params[0] === 'require') {
                // Only patch if there is a corresponding manual mock registered
                /** @type {Map<string, any> | undefined} */
                const reg = /** @type {any} */ (globalThis).__vitest_manual_mocks__;
                let didPatch = false;
                let patched = src;
                if (reg && typeof reg.has === 'function') {
                    if ((src.includes("require('electron')") || src.includes('require("electron")')) && reg.has('electron')) {
                        patched = patched.replace(/require\(["']electron["']\)/g, "globalThis.__vitest_require__('electron')");
                        didPatch = true;
                    }
                    if ((src.includes("require('./windowStateUtils')") || src.includes('require("./windowStateUtils")')) && reg.has('./windowStateUtils')) {
                        patched = patched.replace(/require\(["']\.\/windowStateUtils["']\)/g, "globalThis.__vitest_require__('./windowStateUtils')");
                        didPatch = true;
                    }
                }
                if (didPatch) {
                    const f = /** @type {any} */ (NativeFunction.apply(null, [...params, patched]));
                    return f;
                }
            }
        } catch {
            // Fall through to native behavior on any unexpected error
        }
        // Default native construction
        // @ts-ignore
        return NativeFunction.apply(null, args);
    };
})();
