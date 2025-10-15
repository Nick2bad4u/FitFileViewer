/**
 * @file masterStateManager.comprehensive.test.ts
 * Comprehensive test suite for masterStateManager.js using Module cache injection technique
 *
 * This test uses the proven Module cache injection approach to achieve real code execution
 * and meaningful coverage measurement, building on the breakthrough success from preload.final.test.ts
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

describe("masterStateManager.js - Comprehensive Coverage with Module Cache Injection", () => {
    let originalRequireCache: typeof require.cache;
    let mockDependencies: any;

    // Helper function to inject mocked dependencies into Node.js module cache
    function injectMasterStateManagerMocks() {
        // Create comprehensive mocks for all dependencies
        const mockRendererUtils = {
            initializeRendererUtils: vi.fn(),
            showNotification: vi.fn(),
        };

        const mockAppActions = {
            AppActions: {
                switchTab: vi.fn(),
            },
            AppSelectors: {
                hasData: vi.fn().mockReturnValue(true),
            },
        };

        const mockStateDevTools = {
            cleanupStateDevTools: vi.fn(),
            initializeStateDevTools: vi.fn(),
        };

        const mockUpdateControlsState = {
            initializeControlsState: vi.fn(),
        };

        const mockEnableTabButtons = {
            initializeTabButtonState: vi.fn(),
        };

        const mockUpdateActiveTab = {
            initializeActiveTabState: vi.fn(),
        };

        const mockUpdateTabVisibility = {
            initializeTabVisibilityState: vi.fn(),
        };

        const mockFitFileState = {
            fitFileStateManager: {
                initialize: vi.fn(),
                cleanup: vi.fn(),
            },
        };

        const mockSettingsStateManager = {
            settingsStateManager: {
                initialize: vi.fn(),
                cleanup: vi.fn(),
            },
        };

        const mockUIStateManager = {
            UIActions: {
                setTheme: vi.fn(),
                showTab: vi.fn(),
                updateWindowState: vi.fn(),
            },
        };

        const mockStateIntegration = {
            initializeCompleteStateSystem: vi.fn(),
        };

        const mockComputedStateManager = {
            computedStateManager: {
                cleanup: vi.fn(),
            },
            initializeCommonComputedValues: vi.fn(),
        };

        const mockStateManager = {
            getState: vi.fn(),
            getStateHistory: vi.fn().mockReturnValue([]),
            getSubscriptions: vi.fn().mockReturnValue({}),
            setState: vi.fn(),
            subscribe: vi.fn(),
        };

        const mockStateMiddleware = {
            cleanupMiddleware: vi.fn(),
            initializeDefaultMiddleware: vi.fn(),
        };

        // Inject mocks into require cache with absolute paths
        const basePath = "c:\\Users\\Nick\\Dropbox\\PC (2)\\Documents\\GitHub\\FitFileViewer\\electron-app\\utils";
        const modules = {
            [`${basePath}\\app\\initialization\\rendererUtils.js`]: mockRendererUtils,
            [`${basePath}\\app\\lifecycle\\appActions.js`]: mockAppActions,
            [`${basePath}\\debug\\stateDevTools.js`]: mockStateDevTools,
            [`${basePath}\\rendering\\helpers\\updateControlsState.js`]: mockUpdateControlsState,
            [`${basePath}\\ui\\controls\\enableTabButtons.js`]: mockEnableTabButtons,
            [`${basePath}\\ui\\tabs\\updateActiveTab.js`]: mockUpdateActiveTab,
            [`${basePath}\\ui\\tabs\\updateTabVisibility.js`]: mockUpdateTabVisibility,
            [`${basePath}\\state\\domain\\fitFileState.js`]: mockFitFileState,
            [`${basePath}\\state\\domain\\settingsStateManager.js`]: mockSettingsStateManager,
            [`${basePath}\\state\\domain\\uiStateManager.js`]: mockUIStateManager,
            [`${basePath}\\state\\integration\\stateIntegration.js`]: mockStateIntegration,
            [`${basePath}\\state\\core\\computedStateManager.js`]: mockComputedStateManager,
            [`${basePath}\\state\\core\\stateManager.js`]: mockStateManager,
            [`${basePath}\\state\\core\\stateMiddleware.js`]: mockStateMiddleware,
        };

        // Store original cache
        originalRequireCache = { ...require.cache };

        // Inject each mock into the cache
        for (const [modulePath, mock] of Object.entries(modules)) {
            require.cache[modulePath] = {
                exports: mock,
                loaded: true,
                id: modulePath,
                filename: modulePath,
                children: [],
                parent: null,
                paths: [],
            } as any;
        }

        // Also expose a predictable global mocks registry for ESM dynamic resolvers
        (globalThis as any).__FFV_MOCKS__ = modules;

        // Store for test access
        mockDependencies = {
            rendererUtils: mockRendererUtils,
            appActions: mockAppActions,
            stateDevTools: mockStateDevTools,
            updateControlsState: mockUpdateControlsState,
            enableTabButtons: mockEnableTabButtons,
            updateActiveTab: mockUpdateActiveTab,
            updateTabVisibility: mockUpdateTabVisibility,
            fitFileState: mockFitFileState,
            settingsStateManager: mockSettingsStateManager,
            uiStateManager: mockUIStateManager,
            stateIntegration: mockStateIntegration,
            computedStateManager: mockComputedStateManager,
            stateManager: mockStateManager,
            stateMiddleware: mockStateMiddleware,
        };

        // Provide a direct reference for the core state API for dynamic resolution fallback
        (globalThis as any).__STATE_MANAGER_API__ = mockStateManager;

        console.log("[TEST] Module cache injection completed for masterStateManager dependencies");
        return mockDependencies;
    }

    // Helper function to clean up module cache
    function cleanupModuleCache() {
        if (originalRequireCache) {
            require.cache = originalRequireCache;
        }
        delete (globalThis as any).__FFV_MOCKS__;
        delete (globalThis as any).__STATE_MANAGER_API__;
    }

    beforeEach(() => {
        // Set up DOM environment
        Object.defineProperty(globalThis, "document", {
            value: {
                documentElement: {
                    dataset: {},
                    hasAttribute: vi.fn().mockReturnValue(false),
                },
                addEventListener: vi.fn(),
                querySelector: vi.fn().mockReturnValue({
                    style: { display: "block" },
                    classList: { add: vi.fn(), remove: vi.fn() },
                    offsetParent: {}, // Not null, so element is visible
                    setAttribute: vi.fn(),
                    textContent: "Test",
                }),
                querySelectorAll: vi.fn().mockReturnValue([]),
                body: {
                    classList: {
                        add: vi.fn(),
                        remove: vi.fn(),
                    },
                },
            },
            configurable: true,
        });

        Object.defineProperty(globalThis, "window", {
            value: {
                addEventListener: vi.fn(),
                getComputedStyle: vi.fn().mockReturnValue({
                    display: "block",
                    visibility: "visible",
                }),
                location: {
                    hostname: "localhost",
                    search: "",
                    hash: "",
                    protocol: "http:",
                    href: "http://localhost",
                },
            },
            configurable: true,
        });

        // Mock global addEventListener
        Object.defineProperty(globalThis, "addEventListener", {
            value: vi.fn(),
            configurable: true,
        });

        // Mock timer functions
        Object.defineProperty(globalThis, "setInterval", {
            value: vi.fn().mockReturnValue(12345),
            configurable: true,
        });

        // Mock getComputedStyle
        Object.defineProperty(globalThis, "getComputedStyle", {
            value: vi.fn().mockReturnValue({
                display: "block",
                visibility: "visible",
            }),
            configurable: true,
        });

        Object.defineProperty(globalThis, "localStorage", {
            value: {
                getItem: vi.fn().mockReturnValue("auto"),
                setItem: vi.fn(),
            },
            configurable: true,
        });

        Object.defineProperty(globalThis, "performance", {
            value: {
                memory: {
                    usedJSHeapSize: 50000000,
                    totalJSHeapSize: 100000000,
                },
            },
            configurable: true,
        });

        Object.defineProperty(globalThis, "console", {
            value: {
                log: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            },
            configurable: true,
        });

        Object.defineProperty(globalThis, "electronAPI", {
            value: {
                getAppVersion: vi.fn().mockResolvedValue("26.5.0"),
                openFileDialog: vi.fn(),
                __devMode: true,
            },
            configurable: true,
        });

        // Set up timing functions
        Object.defineProperty(globalThis, "setInterval", {
            value: vi.fn().mockImplementation((fn, delay) => {
                // Immediately call the function for testing
                fn();
                return 1;
            }),
            configurable: true,
        });

        Object.defineProperty(globalThis, "Date", {
            value: {
                now: vi.fn().mockReturnValue(1640995200000), // Fixed timestamp
            },
            configurable: true,
        });
    });

    afterEach(() => {
        cleanupModuleCache();
        vi.restoreAllMocks();
    });

    describe("MasterStateManager Class Instantiation and Basic Methods", () => {
        test("should create MasterStateManager instance and expose expected API", async () => {
            const mocks = injectMasterStateManagerMocks();

            // Import the module after cache injection
            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");

            // Create instance
            const manager = new MasterStateManager();

            // Verify instance creation
            expect(manager).toBeDefined();
            expect(manager.isInitialized).toBe(false);
            expect(manager.components).toBeInstanceOf(Map);
            expect(manager.initializationOrder).toEqual([
                "core",
                "middleware",
                "computed",
                "settings",
                "renderer",
                "tabs",
                "fitFile",
                "ui",
                "devTools",
                "integration",
            ]);

            console.log("[TEST] MasterStateManager instance created successfully");
        });

        test("should provide getState method that forwards to core state manager", async () => {
            const mocks = injectMasterStateManagerMocks();
            mocks.stateManager.getState.mockReturnValue("test-value");

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            const result = manager.getState("test.path");

            expect(mocks.stateManager.getState).toHaveBeenCalledWith("test.path");
            expect(result).toBe("test-value");
        });

        test("should provide getHistory method that forwards to core state manager", async () => {
            const mocks = injectMasterStateManagerMocks();
            const mockHistory = [{ path: "test", value: "value", timestamp: 123 }];
            mocks.stateManager.getStateHistory.mockReturnValue(mockHistory);

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            const result = manager.getHistory();

            expect(mocks.stateManager.getStateHistory).toHaveBeenCalled();
            expect(result).toBe(mockHistory);
        });

        test("should provide getSubscriptions method that forwards to core state manager", async () => {
            const mocks = injectMasterStateManagerMocks();
            const mockSubscriptions = { "test.path": ["listener1"] };
            mocks.stateManager.getSubscriptions.mockReturnValue(mockSubscriptions);

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            const result = manager.getSubscriptions();

            expect(mocks.stateManager.getSubscriptions).toHaveBeenCalled();
            expect(result).toBe(mockSubscriptions);
        });
    });

    describe("Development Mode Detection", () => {
        test("should detect development mode based on localhost hostname", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            const isDev = manager.isDevelopmentMode();

            expect(isDev).toBe(true);
        });

        test("should detect development mode with electronAPI.__devMode", async () => {
            const mocks = injectMasterStateManagerMocks();

            // Set up test environment
            Object.defineProperty(globalThis, "window", {
                value: {
                    location: { hostname: "production.com" },
                },
                configurable: true,
            });

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            const isDev = manager.isDevelopmentMode();

            expect(isDev).toBe(true); // Because electronAPI.__devMode is set
        });

        test("should handle development mode detection errors gracefully", async () => {
            const mocks = injectMasterStateManagerMocks();

            // Remove window to trigger error condition
            delete (globalThis as any).window;

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            const isDev = manager.isDevelopmentMode();

            expect(isDev).toBe(false);
        });
    });

    describe("Initialization Status and Component Management", () => {
        test("should provide detailed initialization status", async () => {
            const mocks = injectMasterStateManagerMocks();
            mocks.stateManager.getState
                .mockReturnValueOnce(true) // system.initialized
                .mockReturnValueOnce("development") // system.mode
                .mockReturnValueOnce(1640995200000) // system.startupTime
                .mockReturnValueOnce("26.5.0"); // system.version

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            // Add some test components
            manager.components.set("core", { initialized: true, timestamp: 123 });
            manager.components.set("middleware", { initialized: false, error: "Test error" });
            manager.isInitialized = true;

            const status = manager.getInitializationStatus();

            expect(status).toEqual({
                components: {
                    core: { initialized: true, timestamp: 123 },
                    middleware: { initialized: false, error: "Test error" },
                },
                isInitialized: true,
                systemState: {
                    initialized: true,
                    mode: "development",
                    startupTime: 1640995200000,
                    version: "26.5.0",
                },
            });
        });

        test("should handle component reinitialization", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            // Add a component
            manager.components.set("settings", { initialized: true, timestamp: 123 });

            // Reinitialize it
            await manager.reinitializeComponent("settings");

            expect(mocks.settingsStateManager.settingsStateManager.initialize).toHaveBeenCalled();
            expect(manager.components.get("settings")).toEqual({
                initialized: true,
                timestamp: expect.any(Number),
            });
        });
    });

    describe("Complete Initialization Process", () => {
        test("should initialize all components in correct order", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            await manager.initialize();

            // Verify initialization calls
            expect(mocks.stateIntegration.initializeCompleteStateSystem).toHaveBeenCalled();
            expect(mocks.stateMiddleware.initializeDefaultMiddleware).toHaveBeenCalled();
            expect(mocks.computedStateManager.initializeCommonComputedValues).toHaveBeenCalled();
            expect(mocks.settingsStateManager.settingsStateManager.initialize).toHaveBeenCalled();
            expect(mocks.rendererUtils.initializeRendererUtils).toHaveBeenCalled();
            expect(mocks.enableTabButtons.initializeTabButtonState).toHaveBeenCalled();
            expect(mocks.updateActiveTab.initializeActiveTabState).toHaveBeenCalled();
            expect(mocks.updateTabVisibility.initializeTabVisibilityState).toHaveBeenCalled();
            expect(mocks.updateControlsState.initializeControlsState).toHaveBeenCalled();
            expect(mocks.uiStateManager.UIActions.setTheme).toHaveBeenCalledWith("auto");

            // Verify state updates
            expect(mocks.stateManager.setState).toHaveBeenCalledWith("system.initialized", true, {
                source: "MasterStateManager",
            });

            expect(manager.isInitialized).toBe(true);
        });

        test("should skip initialization if already initialized", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            manager.isInitialized = true;

            await manager.initialize();

            expect(console.warn).toHaveBeenCalledWith("[MasterState] Already initialized");
            expect(mocks.stateIntegration.initializeCompleteStateSystem).not.toHaveBeenCalled();
        });

        test("should handle initialization errors gracefully", async () => {
            const mocks = injectMasterStateManagerMocks();
            mocks.stateIntegration.initializeCompleteStateSystem.mockRejectedValue(new Error("Test error"));

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            await expect(manager.initialize()).rejects.toThrow("Test error");
            expect(console.error).toHaveBeenCalledWith("[MasterState] Initialization failed:", expect.any(Error));
        });
    });

    describe("Individual Component Initialization", () => {
        test("should initialize core state with version detection", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            await manager.initializeCoreState();

            expect(mocks.stateIntegration.initializeCompleteStateSystem).toHaveBeenCalled();
            expect(mocks.stateManager.setState).toHaveBeenCalledWith("system.version", "26.5.0", {
                source: "MasterStateManager",
            });
            expect(mocks.stateManager.setState).toHaveBeenCalledWith("system.startupTime", expect.any(Number), {
                source: "MasterStateManager",
            });
            expect(mocks.stateManager.setState).toHaveBeenCalledWith("system.mode", "development", {
                source: "MasterStateManager",
            });
        });

        test("should initialize dev tools only in development mode", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            await manager.initializeDevTools();

            expect(mocks.stateDevTools.initializeStateDevTools).toHaveBeenCalled();
            expect(manager.components.get("devTools")).toBe(true);
        });

        test("should handle unknown component initialization", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            await manager.initializeComponent("unknown");

            expect(console.warn).toHaveBeenCalledWith("[MasterState] Unknown component: unknown");
        });

        test("should handle component initialization errors", async () => {
            const mocks = injectMasterStateManagerMocks();
            mocks.settingsStateManager.settingsStateManager.initialize.mockRejectedValue(new Error("Settings error"));

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            await expect(manager.initializeComponent("settings")).rejects.toThrow("Settings error");

            expect(manager.components.get("settings")).toEqual({
                error: "Settings error",
                initialized: false,
            });
        });
    });

    describe("Event Handling and Integration Setup", () => {
        test("should set up drag and drop functionality", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            manager.setupDragAndDrop();

            // Verify event listeners were added
            expect(document.addEventListener).toHaveBeenCalledWith("dragenter", expect.any(Function), false);
            expect(document.addEventListener).toHaveBeenCalledWith("dragover", expect.any(Function), false);
            expect(document.addEventListener).toHaveBeenCalledWith("dragleave", expect.any(Function), false);
            expect(document.addEventListener).toHaveBeenCalledWith("drop", expect.any(Function), false);
        });

        test("should set up keyboard shortcuts", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            manager.setupKeyboardShortcuts();

            expect(document.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
        });

        test("should set up window event listeners", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            manager.setupWindowEventListeners();

            expect(window.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
            expect(window.addEventListener).toHaveBeenCalledWith("focus", expect.any(Function));
            expect(window.addEventListener).toHaveBeenCalledWith("blur", expect.any(Function));
            expect(window.addEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));
        });

        test("should set up error handling", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            manager.setupErrorHandling();

            expect(globalThis.addEventListener).toHaveBeenCalledWith("error", expect.any(Function));
            expect(globalThis.addEventListener).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
        });

        test("should set up performance monitoring", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            manager.setupPerformanceMonitoring();

            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "system.performance",
                {
                    memoryUsage: { total: 95, used: 48 },
                    stateChangesPerMinute: 0,
                    timestamp: expect.any(Number),
                },
                { source: "performanceMonitor" }
            );
        });
    });

    describe("Cleanup Operations", () => {
        test("should clean up all components properly", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            // Set up some components
            manager.components.set("settings", {});
            manager.components.set("computed", {});
            manager.components.set("middleware", {});
            manager.components.set("devTools", {});
            manager.isInitialized = true;

            manager.cleanup();

            expect(mocks.settingsStateManager.settingsStateManager.cleanup).toHaveBeenCalled();
            expect(mocks.computedStateManager.computedStateManager.cleanup).toHaveBeenCalled();
            expect(mocks.stateMiddleware.cleanupMiddleware).toHaveBeenCalled();
            expect(mocks.stateDevTools.cleanupStateDevTools).toHaveBeenCalled();

            expect(manager.components.size).toBe(0);
            expect(manager.isInitialized).toBe(false);

            expect(mocks.stateManager.setState).toHaveBeenCalledWith("system.initialized", false, {
                source: "MasterStateManager.cleanup",
            });
        });
    });

    describe("Global Exports and Convenience Functions", () => {
        test("should export masterStateManager instance", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { masterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");

            expect(masterStateManager).toBeDefined();
            expect(masterStateManager.isInitialized).toBe(false);
        });

        test("should export getMasterStateManager function", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { getMasterStateManager, masterStateManager } = await import(
                "../../../../../utils/state/core/masterStateManager.js"
            );

            const manager = getMasterStateManager();
            expect(manager).toBe(masterStateManager);
        });

        test("should export initializeFitFileViewerState function", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { initializeFitFileViewerState, masterStateManager } = await import(
                "../../../../../utils/state/core/masterStateManager.js"
            );

            const spy = vi.spyOn(masterStateManager, "initialize");

            await initializeFitFileViewerState();

            expect(spy).toHaveBeenCalled();
        });

        test("should export convenience exports", async () => {
            const mocks = injectMasterStateManagerMocks();

            const module = await import("../../../../../utils/state/core/masterStateManager.js");

            expect(module.AppActions).toBeDefined();
            expect(module.AppSelectors).toBeDefined();
            expect(module.UIActions).toBeDefined();
        });
    });

    describe("Edge Cases and Error Scenarios", () => {
        test("should handle FIT file component initialization when manager not available", async () => {
            const mocks = injectMasterStateManagerMocks();
            mocks.fitFileState.fitFileStateManager = null;

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            await expect(manager.initializeFitFileComponents()).rejects.toThrow("FIT file state manager not available");
        });

        test("should handle version detection fallback when electronAPI fails", async () => {
            const mocks = injectMasterStateManagerMocks();
            delete (globalThis as any).electronAPI;

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            await manager.initializeCoreState();

            expect(mocks.stateManager.setState).toHaveBeenCalledWith(
                "system.version",
                "26.5.0", // Should use fallback version
                { source: "MasterStateManager" }
            );
        });

        test("should handle integration setup with state subscriptions", async () => {
            const mocks = injectMasterStateManagerMocks();

            const { MasterStateManager } = await import("../../../../../utils/state/core/masterStateManager.js");
            const manager = new MasterStateManager();

            manager.setupIntegrations();

            expect(mocks.stateManager.subscribe).toHaveBeenCalledWith("globalData", expect.any(Function));
            expect(mocks.stateManager.subscribe).toHaveBeenCalledWith("isLoading", expect.any(Function));
            expect(mocks.stateManager.subscribe).toHaveBeenCalledWith("ui.theme", expect.any(Function));
        });
    });
});
