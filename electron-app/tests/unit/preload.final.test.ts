/**
 * @file preload.final.test.ts
 * @description Comprehensive test file for preload.js using module cache injection
 * Based on the successful module cache injection technique that achieved 74.55% coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Module } from "module";

// Create comprehensive mocks for all electron modules
const mockContextBridge = {
    exposeInMainWorld: vi.fn(),
};

const mockIpcRenderer = {
    invoke: vi.fn().mockResolvedValue("mock-result"),
    send: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
};

const mockApp = {
    getPath: vi.fn((name) => `/mock/path/${name}`),
    isPackaged: false,
    getVersion: vi.fn(() => "1.0.0"),
    getName: vi.fn(() => "FitFileViewer"),
    on: vi.fn(),
    whenReady: vi.fn(() => Promise.resolve()),
    quit: vi.fn(),
};

const mockShell = {
    openExternal: vi.fn().mockResolvedValue(undefined),
};

const mockDialog = {
    showOpenDialog: vi.fn().mockResolvedValue({
        canceled: false,
        filePaths: ["/mock/path/test.fit"],
    }),
};

// Helper function to inject electron mock into module cache
function injectElectronMock() {
    const mockElectron = {
        contextBridge: mockContextBridge,
        ipcRenderer: mockIpcRenderer,
        app: mockApp,
        shell: mockShell,
        dialog: mockDialog,
    };

    const mockModule = {
        exports: mockElectron,
        loaded: true,
        children: [],
        parent: null,
        filename: "electron",
        id: "electron",
        paths: [],
    };

    // Clear any existing electron from cache
    delete require.cache["electron"];

    // Inject the mock directly into the require cache
    require.cache["electron"] = mockModule as any;

    // Also try the full path approach (in case it's needed)
    try {
        const electronPath = require.resolve("electron");
        require.cache[electronPath] = mockModule as any;
    } catch (e) {
        // Ignore if electron path can't be resolved
    }

    return mockElectron;
}

// Helper function to clean up module cache
function cleanupModuleCache() {
    delete require.cache["electron"];
    delete require.cache[require.resolve("../../preload.js")];

    try {
        const electronPath = require.resolve("electron");
        delete require.cache[electronPath];
    } catch (e) {
        // Ignore if electron path can't be resolved
    }
}

describe("preload.js - Comprehensive Coverage Tests", () => {
    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Clean up module cache
        cleanupModuleCache();
    });

    afterEach(() => {
        // Clean up after each test
        cleanupModuleCache();
    });

    describe("Development Mode", () => {
        it("should execute preload.js and expose electronAPI in development mode", () => {
            // Set development mode
            process.env.NODE_ENV = "development";

            // Inject electron mock
            injectElectronMock();

            // Require preload.js to execute it
            require("../../preload.js");

            // Verify contextBridge.exposeInMainWorld was called for electronAPI
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "electronAPI",
                expect.objectContaining({
                    getAppVersion: expect.any(Function),
                    validateAPI: expect.any(Function),
                    openFileDialog: expect.any(Function),
                    parseFitFile: expect.any(Function),
                })
            );

            // Verify devTools was also exposed in development mode
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
                "devTools",
                expect.objectContaining({
                    getPreloadInfo: expect.any(Function),
                    logAPIState: expect.any(Function),
                    testIPC: expect.any(Function),
                })
            );

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledTimes(2);
        });

        it("should expose complete electronAPI structure", () => {
            process.env.NODE_ENV = "development";
            injectElectronMock();

            require("../../preload.js");

            const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
                (call) => call[0] === "electronAPI"
            );

            expect(electronAPICall).toBeDefined();
            const electronAPI = electronAPICall![1];

            // Test key API methods exist
            expect(electronAPI).toHaveProperty("getAppVersion");
            expect(electronAPI).toHaveProperty("openFileDialog");
            expect(electronAPI).toHaveProperty("parseFitFile");
            expect(electronAPI).toHaveProperty("validateAPI");
            expect(electronAPI).toHaveProperty("invoke");
            expect(electronAPI).toHaveProperty("send");
            expect(electronAPI).toHaveProperty("onIpc");
            expect(electronAPI).toHaveProperty("getTheme");
            expect(electronAPI).toHaveProperty("addRecentFile");
            expect(electronAPI).toHaveProperty("recentFiles");
            expect(electronAPI).toHaveProperty("injectMenu");

            // Verify they are functions
            expect(typeof electronAPI.getAppVersion).toBe("function");
            expect(typeof electronAPI.openFileDialog).toBe("function");
            expect(typeof electronAPI.parseFitFile).toBe("function");
            expect(typeof electronAPI.validateAPI).toBe("function");
        });

        it("should test API validation function", () => {
            process.env.NODE_ENV = "development";
            injectElectronMock();

            require("../../preload.js");

            const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
                (call) => call[0] === "electronAPI"
            );
            const electronAPI = electronAPICall![1];

            // Test validateAPI function
            const isValid = electronAPI.validateAPI();
            expect(isValid).toBe(true);
        });

        it("should test IPC invoke methods", () => {
            process.env.NODE_ENV = "development";
            injectElectronMock();

            // Set up mock return values
            mockIpcRenderer.invoke.mockResolvedValueOnce("1.0.0");

            require("../../preload.js");

            const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
                (call) => call[0] === "electronAPI"
            );
            const electronAPI = electronAPICall![1];

            // Test getAppVersion method
            electronAPI.getAppVersion();
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("getAppVersion");
        });

        it("should test event handling methods", () => {
            process.env.NODE_ENV = "development";
            injectElectronMock();

            require("../../preload.js");

            const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
                (call) => call[0] === "electronAPI"
            );
            const electronAPI = electronAPICall![1];

            // Test event registration
            const mockCallback = vi.fn();
            electronAPI.onMenuOpenFile(mockCallback);

            expect(mockIpcRenderer.on).toHaveBeenCalledWith("menu-open-file", expect.any(Function));

            const overlayCallback = vi.fn();
            electronAPI.onMenuOpenOverlay(overlayCallback);
            expect(mockIpcRenderer.on).toHaveBeenCalledWith("menu-open-overlay", expect.any(Function));
        });

        it("should test development tools API", () => {
            process.env.NODE_ENV = "development";
            injectElectronMock();

            require("../../preload.js");

            const devToolsCall = mockContextBridge.exposeInMainWorld.mock.calls.find((call) => call[0] === "devTools");

            expect(devToolsCall).toBeDefined();
            const devTools = devToolsCall![1];

            // Test devTools methods
            expect(devTools).toHaveProperty("getPreloadInfo");
            expect(devTools).toHaveProperty("logAPIState");
            expect(devTools).toHaveProperty("testIPC");
            expect(typeof devTools.getPreloadInfo).toBe("function");

            // Test getPreloadInfo
            const info = devTools.getPreloadInfo();
            expect(info).toHaveProperty("apiMethods");
            expect(info).toHaveProperty("constants");
            expect(info).toHaveProperty("timestamp");
            expect(Array.isArray(info.apiMethods)).toBe(true);
        });
    });

    describe("Production Mode", () => {
        it("should execute preload.js in production mode without devTools", () => {
            // Set production mode
            process.env.NODE_ENV = "production";

            injectElectronMock();

            require("../../preload.js");

            // Verify electronAPI was exposed
            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith("electronAPI", expect.any(Object));

            // Verify devTools was NOT exposed in production mode
            const devToolsCall = mockContextBridge.exposeInMainWorld.mock.calls.find((call) => call[0] === "devTools");
            expect(devToolsCall).toBeUndefined();

            expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledTimes(1);
        });

        it("should have consistent API in production mode", () => {
            process.env.NODE_ENV = "production";
            injectElectronMock();

            require("../../preload.js");

            const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
                (call) => call[0] === "electronAPI"
            );

            expect(electronAPICall).toBeDefined();
            const electronAPI = electronAPICall![1];

            // Core API should still be available in production
            expect(electronAPI).toHaveProperty("getAppVersion");
            expect(electronAPI).toHaveProperty("openFileDialog");
            expect(electronAPI).toHaveProperty("parseFitFile");
            expect(electronAPI).toHaveProperty("validateAPI");
        });
    });

    describe("Error Handling", () => {
        it("should handle missing contextBridge gracefully", () => {
            process.env.NODE_ENV = "development";

            // Create electron mock without contextBridge
            const mockElectron = {
                ipcRenderer: mockIpcRenderer,
                app: mockApp,
                // intentionally missing contextBridge
            };

            const mockModule = {
                exports: mockElectron,
                loaded: true,
                children: [],
                parent: null,
                filename: "electron",
                id: "electron",
                paths: [],
            };

            require.cache["electron"] = mockModule as any;

            // This should not crash but should fail validation
            expect(() => require("../../preload.js")).not.toThrow();
        });

        it("should handle missing ipcRenderer gracefully", () => {
            process.env.NODE_ENV = "development";

            // Create electron mock without ipcRenderer
            const mockElectron = {
                contextBridge: mockContextBridge,
                app: mockApp,
                // intentionally missing ipcRenderer
            };

            const mockModule = {
                exports: mockElectron,
                loaded: true,
                children: [],
                parent: null,
                filename: "electron",
                id: "electron",
                paths: [],
            };

            require.cache["electron"] = mockModule as any;

            // This should not crash but should fail validation
            expect(() => require("../../preload.js")).not.toThrow();
        });
    });

    describe("Advanced API Features", () => {
        it("should test Gyazo server methods", () => {
            process.env.NODE_ENV = "development";
            injectElectronMock();

            // Mock return values for Gyazo server
            mockIpcRenderer.invoke
                .mockResolvedValueOnce({ success: true, port: 3000 })
                .mockResolvedValueOnce({ success: true });

            require("../../preload.js");

            const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
                (call) => call[0] === "electronAPI"
            );
            const electronAPI = electronAPICall![1];

            // Test Gyazo server methods
            expect(electronAPI).toHaveProperty("startGyazoServer");
            expect(electronAPI).toHaveProperty("stopGyazoServer");
            expect(electronAPI).toHaveProperty("exchangeGyazoToken");
            expect(typeof electronAPI.startGyazoServer).toBe("function");
            expect(typeof electronAPI.stopGyazoServer).toBe("function");
            expect(typeof electronAPI.exchangeGyazoToken).toBe("function");
        });

        it("should test file operations", () => {
            process.env.NODE_ENV = "development";
            injectElectronMock();

            require("../../preload.js");

            const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
                (call) => call[0] === "electronAPI"
            );
            const electronAPI = electronAPICall![1];

            // Test file operation methods
            expect(electronAPI).toHaveProperty("openFileDialog");
            expect(electronAPI).toHaveProperty("readFile");
            expect(electronAPI).toHaveProperty("parseFitFile");
            expect(electronAPI).toHaveProperty("decodeFitFile");

            // Test file dialog
            electronAPI.openFileDialog();
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("dialog:openFile");
        });

        it("should test theme management", () => {
            process.env.NODE_ENV = "development";
            injectElectronMock();

            require("../../preload.js");

            const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
                (call) => call[0] === "electronAPI"
            );
            const electronAPI = electronAPICall![1];

            // Test theme methods
            expect(electronAPI).toHaveProperty("getTheme");
            expect(electronAPI).toHaveProperty("onSetTheme");
            expect(electronAPI).toHaveProperty("sendThemeChanged");

            // Test theme operations
            electronAPI.getTheme();
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("theme:get");
        });

        it("should test recent files management", () => {
            process.env.NODE_ENV = "development";
            injectElectronMock();

            require("../../preload.js");

            const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
                (call) => call[0] === "electronAPI"
            );
            const electronAPI = electronAPICall![1];

            // Test recent files methods
            expect(electronAPI).toHaveProperty("addRecentFile");
            expect(electronAPI).toHaveProperty("recentFiles");

            // Test recent files operations
            electronAPI.addRecentFile("/test/path.fit");
            expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("recentFiles:add", "/test/path.fit");
        });
    });
});
