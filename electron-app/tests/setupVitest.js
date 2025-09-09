// Mock Leaflet global L for all Vitest tests
import { vi } from "vitest";

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

// Global localStorage mock setup
if (typeof window !== "undefined" && !window.localStorage) {
    const localStorageMock = {
        store: {},
        getItem: vi.fn((key) => {
            return localStorageMock.store[key] || null;
        }),
        setItem: vi.fn((key, value) => {
            localStorageMock.store[key] = String(value);
        }),
        removeItem: vi.fn((key) => {
            delete localStorageMock.store[key];
        }),
        clear: vi.fn(() => { localStorageMock.store = {}; }),
        key: vi.fn((index) => Object.keys(localStorageMock.store)[index] || null),
        get length() { return Object.keys(localStorageMock.store).length; }
    };
    window.localStorage = localStorageMock;
}

// Global mocks for Electron application testing
// These mocks provide comprehensive testing infrastructure for the Electron app

// Mock console to prevent test output pollution and enable verification
globalThis.console = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
};

// Mock localStorage for persistent data testing
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0
};
Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    configurable: true,
    writable: true
});

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
}
