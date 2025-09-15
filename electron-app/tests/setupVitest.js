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
}

// Helper to install guards on a specific Document instance (handles reassignments)
/**
 * @param {Document} doc
 */
function installDocumentGuards(doc) {
    if (!doc) return;
    // Ensure body exists
    if (!doc.body) {
        try {
            const body = doc.createElement('body');
            doc.appendChild(body);
        } catch {}
    }

    // Resilient and mockable querySelectorAll wrapper for this document
    try {
        // Reuse previously installed wrappers to avoid creating new vi.fn per test
        const originalQSA = doc.querySelectorAll.bind(doc);
    const gkey = '__ffvGuards__';
    /** @type {{ safeQSA?: any, assignedOverrideQSA?: any, safeCreate?: any, assignedOverrideCreate?: any }} */
    const state = (/** @type {any} */(doc))[gkey] ||= {};
        if (!state.safeQSA) {
            /** @type {((selector: string) => any) | null} */
            state.assignedOverrideQSA = null;
            /**
             * @param {string} selector
             */
            state.safeQSA = function safeQuerySelectorAll(selector) {
                const assignedOverrideQSA = state.assignedOverrideQSA;
                if (typeof assignedOverrideQSA === 'function') {
                    try {
                        const res = assignedOverrideQSA(selector);
                        if (res && typeof res.length === 'number') return res;
                        if (res && typeof res[Symbol.iterator] === 'function') return res;
                        if (res && typeof res.forEach === 'function') return res; // NodeList-like
                    } catch {}
                }
                return originalQSA(selector);
            };
            // minimal vi.fn-like helpers so tests can do document.querySelectorAll.mockReturnValue([...])
            Object.defineProperties(state.safeQSA, {
                mockReturnValue: {
                    /** @param {any} val */
                    value: (val) => { state.assignedOverrideQSA = () => val; return state.safeQSA; }, configurable: true
                },
                mockImplementation: {
                    /** @param {any} fn */
                    value: (fn) => { state.assignedOverrideQSA = (typeof fn === 'function') ? fn.bind(doc) : null; return state.safeQSA; }, configurable: true
                },
                mockClear: {
                    value: () => { state.assignedOverrideQSA = null; return state.safeQSA; }, configurable: true
                }
            });
        }
        // Assign a setter-friendly wrapper that keeps vi.fn for tests that call .mockReturnValue
        Object.defineProperty(doc, 'querySelectorAll', {
            configurable: true,
            get() { return state.safeQSA; },
            set(fn) {
                if (typeof fn === 'function') state.assignedOverrideQSA = fn.bind(doc);
                else state.assignedOverrideQSA = null;
            }
        });
    } catch {}

    // Simplified, robust createElement wrapper for this document.
    // Always prefer the native Document.prototype implementation and provide safe fallbacks.
    try {
        const nativeCreate = /** @type {any} */ ((Document && Document.prototype && typeof Document.prototype.createElement === 'function')
            ? Document.prototype.createElement
            : null);
        /**
         * @param {any} tagName
         * @param {any} [options]
         */
        const safeCreate = function(tagName, options) {
            // 1) Try the native prototype method bound to this document
            if (nativeCreate) {
                try {
                    // @ts-ignore - DOM lib typings vary under Electron/JSDOM
                    const el = nativeCreate.call(doc, tagName, options);
                    if (el) return el;
                } catch {}
            }
            // 2) Try the current document's own method (in case prototype is unavailable)
            try {
                // @ts-ignore - call with possible options
                const el2 = doc.createElement(tagName, options);
                if (el2) return el2;
            } catch {}
            // 3) Namespace fallback
            try { return doc.createElementNS('http://www.w3.org/1999/xhtml', String(tagName || 'div')); } catch {}
            // 4) Temporary document fallback
            try {
                const tmpDoc = (doc.implementation && typeof doc.implementation.createHTMLDocument === 'function')
                    ? doc.implementation.createHTMLDocument('ffv-temp')
                    : (typeof document !== 'undefined' && document.implementation && typeof document.implementation.createHTMLDocument === 'function')
                        ? document.implementation.createHTMLDocument('ffv-temp')
                        : null;
                if (tmpDoc) {
                    const tmpEl = tmpDoc.createElement(String(tagName || 'div'));
                    try { if (typeof doc.adoptNode === 'function') return doc.adoptNode(tmpEl); } catch {}
                    try { if (typeof doc.importNode === 'function') return doc.importNode(tmpEl, true); } catch {}
                    return tmpEl;
                }
            } catch {}
            // 5) Final absolute fallback
            try {
                // @ts-ignore - typings for createElement can be overly specific in Electron
                return nativeCreate ? nativeCreate.call(doc, 'div') : document.createElement('div');
            } catch {}
            return /** @type {any} */ ({}); // never undefined to avoid crashes; treated as non-HTMLElement by helpers
        };
        // Assign directly; keep configurable so tests can stub if needed
        Object.defineProperty(doc, 'createElement', {
            value: /** @type {any} */ (safeCreate),
            writable: true,
            configurable: true
        });
    } catch {}
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

// --- Make virtual module tests that pass a bare vi.fn as `require` work ---
// Some tests evaluate strings with new Function('require', ...) and pass `vi.fn` instead of a real require.
// We capture vi.doMock calls and store their factories' return values in a registry, then return those
// modules when such a bare vi.fn is invoked with a module ID (e.g., 'electron').
try {
    /** @type {Map<string, any>} */
    const __ffvMockRegistry = new Map();

    const originalDoMock = vi.doMock.bind(vi);
    /**
     * Override doMock while keeping Vitest's call signatures compatible.
     * @param {string|Promise<any>} idOrPromise
     * @param {any} [factoryOrOptions]
     */
    // @ts-ignore - widen signature slightly but delegate to original to preserve behavior
    vi.doMock = (idOrPromise, factoryOrOptions) => {
        // Record the mock module eagerly so a later bare vi.fn('moduleId') can return it
        try {
            if (typeof idOrPromise === 'string' && typeof factoryOrOptions === 'function') {
                const mod = factoryOrOptions();
                __ffvMockRegistry.set(idOrPromise, mod);
            }
        } catch {}
        // Call through to original (supports both (string, factory?) and (Promise, factory?))
        // @ts-ignore - widen signature for runtime compatibility
        return originalDoMock(idOrPromise, factoryOrOptions);
    };

    // Wrap vi.fn so returned mocks can act as a simple `require` if called with a module id string.
    // IMPORTANT: Preserve the original mock function object so Vitest still recognizes it as a spy.
    const originalViFn = vi.fn.bind(vi);
    vi.fn = /** @type {typeof vi.fn} */ ((...args) => {
        // Create the native mock function first (this is a real Vitest spy)
        const nativeMock = originalViFn(...args);
        try {
            // Only set a default implementation if none was provided
            // The default impl maps string ids to modules from our registry; otherwise returns undefined
            if (!nativeMock.getMockImplementation || !nativeMock.getMockImplementation()) {
                // Some Vitest versions don't expose getMockImplementation; defensively set impl anyway
                nativeMock.mockImplementation((/** @type {any[]} */ ...callArgs) => {
                    try {
                        const first = callArgs && callArgs[0];
                        if (typeof first === 'string' && __ffvMockRegistry.has(first)) {
                            return __ffvMockRegistry.get(first);
                        }
                    } catch {}
                    return undefined;
                });
            }
        } catch {}
        return nativeMock;
    });
} catch {}
