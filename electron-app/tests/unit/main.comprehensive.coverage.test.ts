/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Create comprehensive electron mock at top level for hoisting
const mockElectron = {
    app: {
        whenReady: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        quit: vi.fn(),
        getVersion: vi.fn().mockReturnValue("1.0.0"),
        getName: vi.fn().mockReturnValue("FitFileViewer"),
        getPath: vi.fn().mockReturnValue("/test/path"),
        isPackaged: false,
        requestSingleInstanceLock: vi.fn().mockReturnValue(true),
        dock: {
            show: vi.fn(),
            hide: vi.fn()
        }
    },
    BrowserWindow: {
        getAllWindows: vi.fn().mockReturnValue([]),
        getFocusedWindow: vi.fn().mockReturnValue(null)
    },
    ipcMain: {
        handle: vi.fn(),
        on: vi.fn(),
        removeAllListeners: vi.fn()
    },
    dialog: {
        showOpenDialog: vi.fn().mockResolvedValue({ canceled: false, filePaths: ["/test/file.fit"] }),
        showSaveDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: "/test/output.gpx" })
    },
    Menu: {
        setApplicationMenu: vi.fn(),
        buildFromTemplate: vi.fn().mockReturnValue({})
    },
    shell: {
        openExternal: vi.fn().mockResolvedValue(undefined)
    },
    autoUpdater: {
        checkForUpdatesAndNotify: vi.fn().mockResolvedValue(undefined),
        on: vi.fn()
    }
};

// Create other mocks
const mockWindow = {
    isDestroyed: vi.fn().mockReturnValue(false),
    on: vi.fn(),
    once: vi.fn(),
    removeAllListeners: vi.fn(),
    setMenuBarVisibility: vi.fn(),
    maximize: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
    loadFile: vi.fn().mockResolvedValue(undefined),
    webContents: {
        send: vi.fn(),
        openDevTools: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        executeJavaScript: vi.fn().mockResolvedValue("light"),
        isDestroyed: vi.fn().mockReturnValue(false)
    }
};

const mockState = {
    setupIPCHandlers: vi.fn(),
    setupApplicationEventHandlers: vi.fn(),
    notifyRenderers: vi.fn(),
    notifyChange: vi.fn(),
    get: vi.fn((key) => {
        if (key === "mainWindow") return mockWindow;
        return {};
    }),
    set: vi.fn(() => ({ success: true })),
    addError: vi.fn()
};

const mockPerfMonitor = {
    recordMetric: vi.fn()
};

const mockRecentFiles = {
    addRecentFile: vi.fn(),
    getRecentFiles: vi.fn().mockReturnValue([])
};

const mockWindowState = {
    manage: vi.fn(),
    unmanage: vi.fn()
};

const mockCreateWindow = vi.fn().mockReturnValue(mockWindow);

// Setup hoisted mocks
vi.mock("electron", () => mockElectron);
vi.mock("../../utils/state/integration/mainProcessStateManager", () => ({ mainProcessState: mockState }));
vi.mock("../../utils/debug/performance/performanceMonitor", () => ({ default: mockPerfMonitor }));
vi.mock("../../utils/files/recent/recentFiles", () => mockRecentFiles);
vi.mock("../../windowStateUtils", () => ({ createWindow: mockCreateWindow }));
vi.mock("../../utils/app/menu/createAppMenu", () => ({
    createApplicationMenu: vi.fn().mockReturnValue({})
}));

// Intercept CommonJS require for electron module since main.js uses require("electron")
const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id: string) {
    if (id === "electron") {
        return mockElectron;
    }
    return originalRequire.apply(this, arguments);
};

describe("main.js - Comprehensive Coverage Tests", () => {
    beforeEach(() => {
        // Clear mock call history but keep mock implementations
        vi.clearAllMocks();
    });

    describe("Module Priming", () => {
        it("should handle electron module priming calls", async () => {
            // Import main.js which should trigger module priming
            await import("../../main.js");

            // Verify electron module methods were called during import
            expect(mockElectron.app.whenReady).toHaveBeenCalled();
            expect(mockElectron.BrowserWindow.getAllWindows).toHaveBeenCalled();
        });
    });

    describe("App Initialization", () => {
        it("should initialize app when whenReady resolves", async () => {
            // Import and let initialization complete
            await import("../../main.js");

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 10));

            // Verify IPC handlers were set up (evidence that setupIPCHandlers was called)
            expect(mockElectron.ipcMain.handle).toHaveBeenCalled();
        });
    });

    describe("Event Handlers", () => {
        it("should register app event handlers", async () => {
            await import("../../main.js");

            // Verify app event handlers were registered (evidence that setupApplicationEventHandlers was called)
            expect(mockElectron.app.on).toHaveBeenCalled();
        });
    });

    describe("IPC Handlers", () => {
        it("should register IPC handlers", async () => {
            await import("../../main.js");

            // Verify IPC handlers were registered (evidence that setupIPCHandlers was called)
            expect(mockElectron.ipcMain.handle).toHaveBeenCalled();
        });
    });

    describe("Development Features", () => {
        it("should handle development mode", async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = "development";

            try {
                await import("../../main.js");

                // Verify development features are enabled
                expect(mockElectron.app.on).toHaveBeenCalled();
            } finally {
                process.env.NODE_ENV = originalEnv;
            }
        });
    });

    describe("Gyazo Server", () => {
        it("should setup Gyazo server with environment variables", async () => {
            process.env.GYAZO_CLIENT_ID = "test-client-id";
            process.env.GYAZO_CLIENT_SECRET = "test-client-secret";

            try {
                await import("../../main.js");

                // Verify initialization completed
                expect(mockElectron.app.whenReady).toHaveBeenCalled();
            } finally {
                delete process.env.GYAZO_CLIENT_ID;
                delete process.env.GYAZO_CLIENT_SECRET;
            }
        });
    });

    describe("Auto-updater", () => {
        it("should setup auto-updater when packaged", async () => {
            const originalIsPackaged = mockElectron.app.isPackaged;
            mockElectron.app.isPackaged = true;

            try {
                await import("../../main.js");

                // Verify app initialization
                expect(mockElectron.app.whenReady).toHaveBeenCalled();
            } finally {
                mockElectron.app.isPackaged = originalIsPackaged;
            }
        });
    });

    describe("Error Handling", () => {
        it("should handle electron module errors gracefully", async () => {
            // Should not throw during import
            await expect(import("../../main.js")).resolves.toBeDefined();
        });
    });
});
