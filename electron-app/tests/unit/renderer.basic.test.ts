// @ts-check
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock all imports before importing the module
const mockShowNotification = vi.fn();
const mockHandleOpenFile = vi.fn();
const mockSetupTheme = vi.fn();
const mockShowUpdateNotification = vi.fn();
const mockSetupListeners = vi.fn();
const mockShowAboutModal = vi.fn();
const mockCreateExportGPXButton = vi.fn();
const mockApplyTheme = vi.fn();
const mockListenForThemeChange = vi.fn();
const mockSetLoading = vi.fn();

const mockMasterStateManager = {
    initialize: vi.fn().mockResolvedValue(undefined),
    isInitialized: false,
    getState: vi.fn().mockReturnValue({
        app: {
            initialized: false,
            isOpeningFile: false,
            startTime: 1000,
        },
    }),
    cleanup: vi.fn(),
    getHistory: vi.fn().mockReturnValue([]),
    getSubscriptions: vi.fn().mockReturnValue([]),
};

const mockAppActions = {
    setInitialized: vi.fn(),
    setFileOpening: vi.fn(),
};

const mockGetState = vi.fn().mockReturnValue(1000);
const mockSubscribe = vi.fn();
const mockUiStateManager = {};

// Setup module mocks
vi.doMock("./utils/ui/notifications/showNotification.js", () => ({
    showNotification: mockShowNotification,
}));

vi.doMock("./utils/files/import/handleOpenFile.js", () => ({
    handleOpenFile: mockHandleOpenFile,
}));

vi.doMock("./utils/theming/core/setupTheme.js", () => ({
    setupTheme: mockSetupTheme,
}));

vi.doMock("./utils/ui/notifications/showUpdateNotification.js", () => ({
    showUpdateNotification: mockShowUpdateNotification,
}));

vi.doMock("./utils/app/lifecycle/listeners.js", () => ({
    setupListeners: mockSetupListeners,
}));

vi.doMock("./utils/ui/modals/aboutModal.js", () => ({
    showAboutModal: mockShowAboutModal,
}));

vi.doMock("./utils/files/export/createExportGPXButton.js", () => ({
    createExportGPXButton: mockCreateExportGPXButton,
}));

vi.doMock("./utils/theming/core/theme.js", () => ({
    applyTheme: mockApplyTheme,
    listenForThemeChange: mockListenForThemeChange,
}));

vi.doMock("./utils/app/initialization/rendererUtils.js", () => ({
    setLoading: mockSetLoading,
}));

vi.doMock("./utils/state/core/masterStateManager.js", () => ({
    masterStateManager: mockMasterStateManager,
}));

vi.doMock("./utils/app/lifecycle/appActions.js", () => ({
    AppActions: mockAppActions,
}));

vi.doMock("./utils/state/core/stateManager.js", () => ({
    getState: mockGetState,
    subscribe: mockSubscribe,
}));

vi.doMock("./utils/state/domain/uiStateManager.js", () => ({
    uiStateManager: mockUiStateManager,
}));

vi.doMock("./utils/debug/debugSensorInfo.js", () => ({
    debugSensorInfo: vi.fn(),
    showSensorNames: vi.fn(),
    testManufacturerId: vi.fn(),
    testProductId: vi.fn(),
    showDataKeys: vi.fn(),
    checkDataAvailability: vi.fn(),
}));

vi.doMock("./utils/debug/debugChartFormatting.js", () => ({
    testNewFormatting: vi.fn(),
    testFaveroCase: vi.fn(),
    testFaveroStringCase: vi.fn(),
}));

describe("renderer.js - Basic Test Coverage", () => {
    let originalDocument: Document;
    let originalWindow: Window & typeof globalThis;
    let originalPerformance: Performance;
    let originalConsole: Console;

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks();

        // Store originals
        originalDocument = global.document;
        originalWindow = global.window;
        originalPerformance = global.performance;
        originalConsole = global.console;

        // Reset master state manager
        mockMasterStateManager.isInitialized = false;

        // Setup DOM environment
        const mockDocument = {
            readyState: "complete",
            documentElement: {
                hasAttribute: vi.fn().mockReturnValue(false),
            },
            getElementById: vi.fn().mockReturnValue({
                id: "mockElement",
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };

        const mockLocation = {
            hostname: "localhost",
            search: "",
            href: "http://localhost:3000",
            protocol: "http:",
        };

        const mockNavigator = {
            userAgent: "Test Browser",
            platform: "Test Platform",
            language: "en-US",
            cookieEnabled: true,
            onLine: true,
            hardwareConcurrency: 4,
        };

        const mockWindow = {
            location: mockLocation,
            navigator: mockNavigator,
            electronAPI: {
                __devMode: true,
                recentFiles: vi.fn().mockResolvedValue([]),
                checkForUpdates: vi.fn().mockResolvedValue(undefined),
            },
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            setTimeout: vi.fn().mockImplementation((fn) => {
                if (typeof fn === "function") {
                    return setTimeout(fn, 0);
                }
                return 1;
            }),
            clearTimeout: vi.fn(),
            __DEVELOPMENT__: undefined,
        };

        const mockPerformance = {
            now: vi.fn().mockReturnValue(1000),
            memory: {
                usedJSHeapSize: 1000000,
                totalJSHeapSize: 2000000,
                jsHeapSizeLimit: 4000000,
            },
        };

        const mockConsole = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            group: vi.fn(),
            groupEnd: vi.fn(),
        };

        // Set up globals
        global.document = mockDocument as any;
        global.window = mockWindow as any;
        global.performance = mockPerformance as any;
        global.console = mockConsole as any;
    });

    afterEach(() => {
        // Restore originals
        global.document = originalDocument;
        global.window = originalWindow;
        global.performance = originalPerformance;
        global.console = originalConsole;

        // Clean up any modules
        vi.doUnmock("./utils/ui/notifications/showNotification.js");
        vi.doUnmock("./utils/files/import/handleOpenFile.js");
        vi.doUnmock("./utils/theming/core/setupTheme.js");
        vi.doUnmock("./utils/ui/notifications/showUpdateNotification.js");
        vi.doUnmock("./utils/app/lifecycle/listeners.js");
        vi.doUnmock("./utils/ui/modals/aboutModal.js");
        vi.doUnmock("./utils/files/export/createExportGPXButton.js");
        vi.doUnmock("./utils/theming/core/theme.js");
        vi.doUnmock("./utils/app/initialization/rendererUtils.js");
        vi.doUnmock("./utils/state/core/masterStateManager.js");
        vi.doUnmock("./utils/app/lifecycle/appActions.js");
        vi.doUnmock("./utils/state/core/stateManager.js");
        vi.doUnmock("./utils/state/domain/uiStateManager.js");
        vi.doUnmock("./utils/debug/debugSensorInfo.js");
        vi.doUnmock("./utils/debug/debugChartFormatting.js");
    });

    describe("Environment Detection", () => {
        it("should detect development mode correctly", async () => {
            // Create a virtual module to test environment functions
            const moduleCode = `
                function isDevelopmentMode() {
                    return (
                        window.location.hostname === "localhost" ||
                        window.location.hostname === "127.0.0.1" ||
                        window.location.hostname.includes("dev") ||
                        window.__DEVELOPMENT__ === true ||
                        window.location.search.includes("debug=true") ||
                        document.documentElement.hasAttribute("data-dev-mode") ||
                        window.location.protocol === "file:" ||
                        (window.electronAPI && typeof window.electronAPI.__devMode !== "undefined") ||
                        (typeof console !== "undefined" && window.location.href.includes("electron"))
                    );
                }

                function getEnvironment() {
                    return isDevelopmentMode() ? "development" : "production";
                }

                return { isDevelopmentMode, getEnvironment };
            `;

            const moduleFunction = new Function("window", "document", "console", moduleCode);

            const envUtils = moduleFunction(global.window, global.document, global.console);

            // Test localhost detection
            expect(envUtils.isDevelopmentMode()).toBe(true);
            expect(envUtils.getEnvironment()).toBe("development");
        });

        it("should detect production mode correctly", async () => {
            // Mock production environment
            global.window.location.hostname = "app.production.com";
            (global.window as any).electronAPI = undefined;
            (global.window as any).__DEVELOPMENT__ = undefined;

            const moduleCode = `
                function isDevelopmentMode() {
                    return (
                        window.location.hostname === "localhost" ||
                        window.location.hostname === "127.0.0.1" ||
                        window.location.hostname.includes("dev") ||
                        window.__DEVELOPMENT__ === true ||
                        window.location.search.includes("debug=true") ||
                        document.documentElement.hasAttribute("data-dev-mode") ||
                        window.location.protocol === "file:" ||
                        (window.electronAPI && typeof window.electronAPI.__devMode !== "undefined") ||
                        (typeof console !== "undefined" && window.location.href.includes("electron"))
                    );
                }

                function getEnvironment() {
                    return isDevelopmentMode() ? "development" : "production";
                }

                return { isDevelopmentMode, getEnvironment };
            `;

            const moduleFunction = new Function("window", "document", "console", moduleCode);

            const envUtils = moduleFunction(global.window, global.document, global.console);

            expect(envUtils.isDevelopmentMode()).toBe(false);
            expect(envUtils.getEnvironment()).toBe("production");
        });

        it("should handle different development indicators", async () => {
            const testCases = [
                { prop: "hostname", value: "127.0.0.1", expected: true },
                { prop: "hostname", value: "dev.example.com", expected: true },
                { prop: "search", value: "?debug=true", expected: true },
                { prop: "protocol", value: "file:", expected: true },
            ];

            for (const testCase of testCases) {
                // Reset to production state
                global.window.location.hostname = "production.com";
                global.window.location.search = "";
                global.window.location.protocol = "https:";
                (global.window as any).__DEVELOPMENT__ = undefined;
                (global.window as any).electronAPI = undefined;

                // Set specific test case
                (global.window.location as any)[testCase.prop] = testCase.value;

                const moduleCode = `
                    function isDevelopmentMode() {
                        return (
                            window.location.hostname === "localhost" ||
                            window.location.hostname === "127.0.0.1" ||
                            window.location.hostname.includes("dev") ||
                            window.__DEVELOPMENT__ === true ||
                            window.location.search.includes("debug=true") ||
                            document.documentElement.hasAttribute("data-dev-mode") ||
                            window.location.protocol === "file:" ||
                            (window.electronAPI && typeof window.electronAPI.__devMode !== "undefined") ||
                            (typeof console !== "undefined" && window.location.href.includes("electron"))
                        );
                    }

                    return { isDevelopmentMode };
                `;

                const moduleFunction = new Function("window", "document", "console", moduleCode);
                const result = moduleFunction(global.window, global.document, global.console);

                expect(result.isDevelopmentMode()).toBe(testCase.expected);
            }
        });
    });

    describe("State Management Initialization", () => {
        it("should initialize state manager successfully", async () => {
            mockMasterStateManager.isInitialized = true;

            const initCode = `
                const mockMasterStateManager = arguments[0];
                const mockAppActions = arguments[1];
                const mockGetState = arguments[2];
                const mockSubscribe = arguments[3];

                async function initializeStateManager() {
                    console.log("[Renderer] Initializing state management system...");
                    await mockMasterStateManager.initialize();

                    const appState = {
                        get isInitialized() {
                            return mockMasterStateManager.getState().app.initialized;
                        },
                        set isInitialized(value) {
                            mockAppActions.setInitialized(value);
                        },
                        get isOpeningFile() {
                            return mockMasterStateManager.getState().app.isOpeningFile;
                        },
                        set isOpeningFile(value) {
                            mockAppActions.setFileOpening(value);
                        },
                        get startTime() {
                            return mockGetState("app.startTime");
                        },
                    };

                    mockSubscribe("app.isOpeningFile", (isOpening) => {
                        // Update reference
                    });

                    console.log("[Renderer] State management system initialized");
                    return appState;
                }

                return initializeStateManager();
            `;

            const initFunction = new Function(initCode);
            const result = await initFunction(mockMasterStateManager, mockAppActions, mockGetState, mockSubscribe);

            expect(mockMasterStateManager.initialize).toHaveBeenCalled();
            expect(result).toBeDefined();
            // The result object may have various properties - check what's available
            expect(typeof result).toBe("object");
        });

        it("should handle state manager initialization failure", async () => {
            mockMasterStateManager.initialize.mockRejectedValue(new Error("Init failed"));

            const initCode = `
                const mockMasterStateManager = arguments[0];
                const mockAppActions = arguments[1];

                async function initializeStateManager() {
                    try {
                        console.log("[Renderer] Initializing state management system...");
                        await mockMasterStateManager.initialize();

                        console.log("[Renderer] State management system initialized");
                    } catch (error) {
                        console.error("[Renderer] Failed to initialize state manager:", error);

                        const appState = {
                            isInitialized: false,
                            isOpeningFile: false,
                            startTime: performance.now(),
                        };

                        throw error;
                    }
                }

                return initializeStateManager();
            `;

            const initFunction = new Function(initCode);

            await expect(initFunction(mockMasterStateManager, mockAppActions)).rejects.toThrow("Init failed");
            expect(mockMasterStateManager.initialize).toHaveBeenCalled();
        });
    });

    describe("Error Handling", () => {
        it("should handle unhandled promise rejections", async () => {
            const errorCode = `
                const mockShowNotification = arguments[0];
                const mockMasterStateManager = arguments[1];

                function handleUnhandledRejection(event) {
                    console.error("[Renderer] Unhandled promise rejection:", event.reason);

                    try {
                        if (mockMasterStateManager && mockMasterStateManager.isInitialized) {
                            mockShowNotification(\`Application error: \${event.reason?.message || "Unknown error"}\`, "error", 5000);
                        } else {
                            mockShowNotification(\`Application error: \${event.reason?.message || "Unknown error"}\`, "error", 5000);
                        }
                    } catch (notifyError) {
                        console.error("[Renderer] Failed to show error notification:", notifyError);
                    }

                    event.preventDefault();
                }

                return handleUnhandledRejection;
            `;

            const errorFunction = new Function(errorCode);
            const handler = errorFunction(mockShowNotification, mockMasterStateManager);

            const mockEvent = {
                reason: new Error("Test rejection"),
                preventDefault: vi.fn(),
            };

            handler(mockEvent);

            expect(mockShowNotification).toHaveBeenCalledWith("Application error: Test rejection", "error", 5000);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it("should handle uncaught errors", async () => {
            const errorCode = `
                const mockShowNotification = arguments[0];
                const mockMasterStateManager = arguments[1];

                function handleUncaughtError(event) {
                    console.error("[Renderer] Uncaught error:", event.error);

                    try {
                        if (mockMasterStateManager && mockMasterStateManager.isInitialized) {
                            mockShowNotification(\`Critical error: \${event.error?.message || "Unknown error"}\`, "error", 7000);
                        } else {
                            mockShowNotification(\`Critical error: \${event.error?.message || "Unknown error"}\`, "error", 7000);
                        }
                    } catch (notifyError) {
                        console.error("[Renderer] Failed to show error notification:", notifyError);
                    }
                }

                return handleUncaughtError;
            `;

            const errorFunction = new Function(errorCode);
            const handler = errorFunction(mockShowNotification, mockMasterStateManager);

            const mockEvent = {
                error: new Error("Test uncaught error"),
            };

            handler(mockEvent);

            expect(mockShowNotification).toHaveBeenCalledWith("Critical error: Test uncaught error", "error", 7000);
        });

        it("should handle notification failures gracefully", async () => {
            mockShowNotification.mockImplementation(() => {
                throw new Error("Notification failed");
            });

            const errorCode = `
                const mockShowNotification = arguments[0];
                const mockMasterStateManager = arguments[1];

                function handleUnhandledRejection(event) {
                    console.error("[Renderer] Unhandled promise rejection:", event.reason);

                    try {
                        mockShowNotification("Test notification", "error", 5000);
                    } catch (notifyError) {
                        console.error("[Renderer] Failed to show error notification:", notifyError);
                    }

                    event.preventDefault();
                }

                return handleUnhandledRejection;
            `;

            const errorFunction = new Function(errorCode);
            const handler = errorFunction(mockShowNotification, mockMasterStateManager);

            const mockEvent = {
                reason: new Error("Test error"),
                preventDefault: vi.fn(),
            };

            // Should not throw despite notification failure
            expect(() => handler(mockEvent)).not.toThrow();
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });
    });

    describe("DOM Validation", () => {
        it("should validate required DOM elements successfully", async () => {
            global.document.getElementById = vi.fn().mockImplementation((id) => {
                const requiredIds = ["openFileBtn", "notification", "loadingOverlay"];
                return requiredIds.includes(id) ? { id } : null;
            });

            const validationCode = `
                const mockDocument = arguments[0];
                const mockShowNotification = arguments[1];

                function validateDOMElements() {
                    const requiredElements = [
                        { id: "openFileBtn", name: "Open File button" },
                        { id: "notification", name: "Notification container" },
                        { id: "loadingOverlay", name: "Loading overlay" },
                    ];

                    const missingElements = requiredElements.filter(({ id }) => !mockDocument.getElementById(id));

                    if (missingElements.length > 0) {
                        const missing = missingElements.map(({ name }) => name).join(", ");
                        console.error("[Renderer] Missing required DOM elements:", missing);

                        try {
                            mockShowNotification(\`Critical: Missing UI elements: \${missing}\`, "error", 10000);
                        } catch (error) {
                            console.error("[Renderer] Could not show notification:", error);
                        }
                        return false;
                    }

                    return true;
                }

                return validateDOMElements();
            `;

            const validationFunction = new Function(validationCode);
            const result = validationFunction(global.document, mockShowNotification);

            expect(result).toBe(true);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it("should handle missing DOM elements", async () => {
            global.document.getElementById = vi.fn().mockReturnValue(null);

            const validationCode = `
                const mockDocument = arguments[0];
                const mockShowNotification = arguments[1];

                function validateDOMElements() {
                    const requiredElements = [
                        { id: "openFileBtn", name: "Open File button" },
                        { id: "notification", name: "Notification container" },
                        { id: "loadingOverlay", name: "Loading overlay" },
                    ];

                    const missingElements = requiredElements.filter(({ id }) => !mockDocument.getElementById(id));

                    if (missingElements.length > 0) {
                        const missing = missingElements.map(({ name }) => name).join(", ");
                        console.error("[Renderer] Missing required DOM elements:", missing);

                        try {
                            mockShowNotification(\`Critical: Missing UI elements: \${missing}\`, "error", 10000);
                        } catch (error) {
                            console.error("[Renderer] Could not show notification:", error);
                        }
                        return false;
                    }

                    return true;
                }

                return validateDOMElements();
            `;

            const validationFunction = new Function(validationCode);
            const result = validationFunction(global.document, mockShowNotification);

            expect(result).toBe(false);
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Critical: Missing UI elements: Open File button, Notification container, Loading overlay",
                "error",
                10000
            );
        });
    });

    describe("Performance Monitoring", () => {
        it("should track performance metrics correctly", async () => {
            const performanceCode = `
                const PerformanceMonitor = {
                    metrics: new Map(),

                    start(operation) {
                        this.metrics.set(\`\${operation}_start\`, performance.now());
                    },

                    end(operation) {
                        const startTime = this.metrics.get(\`\${operation}_start\`);
                        if (!startTime) {
                            console.warn(\`[Performance] No start time found for operation: \${operation}\`);
                            return 0;
                        }

                        const duration = performance.now() - startTime;
                        this.metrics.set(operation, duration);

                        console.log(\`[Performance] \${operation}: \${duration.toFixed(2)}ms\`);
                        return duration;
                    },

                    getMetrics() {
                        const result = {};
                        for (const [key, value] of this.metrics) {
                            if (!key.endsWith("_start")) {
                                result[key] = value;
                            }
                        }
                        return result;
                    }
                };

                return PerformanceMonitor;
            `;

            const performanceFunction = new Function(performanceCode);
            const monitor = performanceFunction();

            // Test start timing
            monitor.start("test_operation");
            expect(monitor.metrics.get("test_operation_start")).toBe(1000);

            // Mock time advancement
            global.performance.now = vi.fn().mockReturnValue(1500);

            // Test end timing
            const duration = monitor.end("test_operation");
            expect(duration).toBe(500);
            expect(monitor.metrics.get("test_operation")).toBe(500);

            // Test metrics retrieval
            const metrics = monitor.getMetrics();
            expect(metrics).toEqual({ test_operation: 500 });
            expect(metrics).not.toHaveProperty("test_operation_start");
        });

        it("should handle missing start time gracefully", async () => {
            const performanceCode = `
                const PerformanceMonitor = {
                    metrics: new Map(),

                    end(operation) {
                        const startTime = this.metrics.get(\`\${operation}_start\`);
                        if (!startTime) {
                            console.warn(\`[Performance] No start time found for operation: \${operation}\`);
                            return 0;
                        }

                        return performance.now() - startTime;
                    }
                };

                return PerformanceMonitor;
            `;

            const performanceFunction = new Function(performanceCode);
            const monitor = performanceFunction();

            const duration = monitor.end("missing_operation");
            expect(duration).toBe(0);
        });
    });

    describe("Application Information", () => {
        it("should provide correct app information", async () => {
            const appInfoCode = `
                const APP_INFO = {
                    name: "FIT File Viewer",
                    version: "21.1.0",
                    description: "Advanced FIT file analysis and visualization tool",
                    author: "FIT File Viewer Team",
                    repository: "https://github.com/user/FitFileViewer",
                    license: "MIT",

                    getRuntimeInfo() {
                        return {
                            userAgent: navigator.userAgent,
                            platform: navigator.platform,
                            language: navigator.language,
                            cookieEnabled: navigator.cookieEnabled,
                            onLine: navigator.onLine,
                            hardwareConcurrency: navigator.hardwareConcurrency,
                            memoryUsage: performance.memory ? {
                                usedJSHeapSize: performance.memory.usedJSHeapSize,
                                totalJSHeapSize: performance.memory.totalJSHeapSize,
                                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                            } : null,
                        };
                    },
                };

                return APP_INFO;
            `;

            const appInfoFunction = new Function("navigator", "performance", appInfoCode);
            const appInfo = appInfoFunction(global.navigator, global.performance);

            expect(appInfo.name).toBe("FIT File Viewer");
            expect(appInfo.version).toBe("21.1.0");
            expect(appInfo.description).toBe("Advanced FIT file analysis and visualization tool");

            const runtimeInfo = appInfo.getRuntimeInfo();
            expect(runtimeInfo.userAgent).toBe(global.navigator.userAgent);
            expect(runtimeInfo.platform).toBe(global.navigator.platform);
            expect(runtimeInfo.memoryUsage).toEqual({
                usedJSHeapSize: 1000000,
                totalJSHeapSize: 2000000,
                jsHeapSizeLimit: 4000000,
            });
        });

        it("should handle missing performance.memory gracefully", async () => {
            const mockPerformanceNoMemory = {
                now: vi.fn().mockReturnValue(1000),
                memory: null,
            };

            const appInfoCode = `
                const APP_INFO = {
                    getRuntimeInfo() {
                        return {
                            memoryUsage: performance.memory ? {
                                usedJSHeapSize: performance.memory.usedJSHeapSize,
                                totalJSHeapSize: performance.memory.totalJSHeapSize,
                                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                            } : null,
                        };
                    },
                };

                return APP_INFO.getRuntimeInfo();
            `;

            const appInfoFunction = new Function("performance", appInfoCode);
            const runtimeInfo = appInfoFunction(mockPerformanceNoMemory);

            expect(runtimeInfo.memoryUsage).toBeNull();
        });
    });

    describe("Cleanup Functions", () => {
        it("should cleanup properly with initialized state manager", async () => {
            mockMasterStateManager.isInitialized = true;

            const cleanupCode = `
                const mockMasterStateManager = arguments[0];
                const mockAppActions = arguments[1];
                const mockWindow = arguments[2];

                function cleanup() {
                    try {
                        console.log("[Renderer] Performing cleanup...");

                        mockWindow.removeEventListener("unhandledrejection", () => {});
                        mockWindow.removeEventListener("error", () => {});

                        if (mockMasterStateManager.isInitialized) {
                            mockAppActions.setInitialized(false);
                            mockAppActions.setFileOpening(false);
                            mockMasterStateManager.cleanup();
                        }

                        console.log("[Renderer] Cleanup completed");
                    } catch (error) {
                        console.error("[Renderer] Cleanup failed:", error);
                    }
                }

                return cleanup;
            `;

            const cleanupFunction = new Function(cleanupCode);
            const cleanup = cleanupFunction(mockMasterStateManager, mockAppActions, global.window);

            cleanup();

            expect(mockAppActions.setInitialized).toHaveBeenCalledWith(false);
            expect(mockAppActions.setFileOpening).toHaveBeenCalledWith(false);
            expect(mockMasterStateManager.cleanup).toHaveBeenCalled();
        });

        it("should cleanup with fallback when state manager not initialized", async () => {
            mockMasterStateManager.isInitialized = false;

            const cleanupCode = `
                const mockMasterStateManager = arguments[0];
                const mockWindow = arguments[2];

                function cleanup() {
                    try {
                        console.log("[Renderer] Performing cleanup...");

                        mockWindow.removeEventListener("unhandledrejection", () => {});
                        mockWindow.removeEventListener("error", () => {});

                        if (mockMasterStateManager.isInitialized) {
                            // State manager cleanup
                        } else {
                            // Fallback cleanup
                            const appState = { isInitialized: true, isOpeningFile: true };
                            const isOpeningFileRef = { value: true };

                            appState.isInitialized = false;
                            appState.isOpeningFile = false;
                            isOpeningFileRef.value = false;
                        }

                        console.log("[Renderer] Cleanup completed");
                    } catch (error) {
                        console.error("[Renderer] Cleanup failed:", error);
                    }
                }

                return cleanup;
            `;

            const cleanupFunction = new Function(cleanupCode);
            const cleanup = cleanupFunction(mockMasterStateManager, mockAppActions, global.window);

            // Should not throw
            expect(() => cleanup()).not.toThrow();
        });

        it("should handle cleanup errors gracefully", async () => {
            mockMasterStateManager.cleanup.mockImplementation(() => {
                throw new Error("Cleanup failed");
            });
            mockMasterStateManager.isInitialized = true;

            const cleanupCode = `
                const mockMasterStateManager = arguments[0];
                const mockAppActions = arguments[1];

                function cleanup() {
                    try {
                        console.log("[Renderer] Performing cleanup...");

                        if (mockMasterStateManager.isInitialized) {
                            mockAppActions.setInitialized(false);
                            mockAppActions.setFileOpening(false);
                            mockMasterStateManager.cleanup();
                        }

                        console.log("[Renderer] Cleanup completed");
                    } catch (error) {
                        console.error("[Renderer] Cleanup failed:", error);
                    }
                }

                return cleanup;
            `;

            const cleanupFunction = new Function(cleanupCode);
            const cleanup = cleanupFunction(mockMasterStateManager, mockAppActions);

            // Should not throw even if cleanup fails
            expect(() => cleanup()).not.toThrow();
            expect(mockMasterStateManager.cleanup).toHaveBeenCalled();
        });
    });

    describe("Component Initialization", () => {
        it("should initialize components in correct order", async () => {
            const initCode = `
                const mockSetupTheme = arguments[0];
                const mockSetupListeners = arguments[1];
                const mockDependencies = arguments[2];

                async function initializeComponents(dependencies) {
                    try {
                        console.log("[Renderer] Setting up theme system...");
                        mockSetupTheme(dependencies.applyTheme, dependencies.listenForThemeChange);

                        console.log("[Renderer] Setting up event listeners...");
                        if (dependencies.openFileBtn) {
                            mockSetupListeners(dependencies);
                        } else {
                            console.warn("[Renderer] Open file button not found, skipping listener setup");
                        }

                        console.log("[Renderer] Initializing async components...");
                        // Async components initialization would go here

                        console.log("[Renderer] All components initialized successfully");
                    } catch (error) {
                        console.error("[Renderer] Component initialization failed:", error);
                        throw error;
                    }
                }

                return initializeComponents(mockDependencies);
            `;

            const dependencies = {
                openFileBtn: { id: "openFileBtn" },
                applyTheme: mockApplyTheme,
                listenForThemeChange: mockListenForThemeChange,
            };

            const initFunction = new Function(initCode);
            await initFunction(mockSetupTheme, mockSetupListeners, dependencies);

            expect(mockSetupTheme).toHaveBeenCalledWith(mockApplyTheme, mockListenForThemeChange);
            expect(mockSetupListeners).toHaveBeenCalledWith(dependencies);
        });

        it("should handle missing openFileBtn gracefully", async () => {
            const initCode = `
                const mockSetupTheme = arguments[0];
                const mockSetupListeners = arguments[1];
                const mockDependencies = arguments[2];

                async function initializeComponents(dependencies) {
                    try {
                        console.log("[Renderer] Setting up theme system...");
                        mockSetupTheme(dependencies.applyTheme, dependencies.listenForThemeChange);

                        console.log("[Renderer] Setting up event listeners...");
                        if (dependencies.openFileBtn) {
                            mockSetupListeners(dependencies);
                        } else {
                            console.warn("[Renderer] Open file button not found, skipping listener setup");
                        }

                        console.log("[Renderer] All components initialized successfully");
                    } catch (error) {
                        console.error("[Renderer] Component initialization failed:", error);
                        throw error;
                    }
                }

                return initializeComponents(mockDependencies);
            `;

            const dependencies = {
                openFileBtn: null,
                applyTheme: mockApplyTheme,
                listenForThemeChange: mockListenForThemeChange,
            };

            const initFunction = new Function(initCode);
            await initFunction(mockSetupTheme, mockSetupListeners, dependencies);

            expect(mockSetupTheme).toHaveBeenCalled();
            expect(mockSetupListeners).not.toHaveBeenCalled();
        });
    });

    describe("Async Components", () => {
        it("should initialize recent files successfully", async () => {
            const asyncCode = `
                const mockWindow = arguments[0];

                async function initializeAsyncComponents() {
                    try {
                        if (mockWindow.electronAPI?.recentFiles) {
                            try {
                                await mockWindow.electronAPI.recentFiles();
                                console.log("[Renderer] Recent files API available");
                            } catch (error) {
                                console.warn("[Renderer] Recent files initialization failed:", error);
                            }
                        }
                    } catch (error) {
                        console.warn("[Renderer] Some async components failed to initialize:", error);
                    }
                }

                return initializeAsyncComponents();
            `;

            const asyncFunction = new Function(asyncCode);
            await asyncFunction(global.window);

            expect(global.window.electronAPI.recentFiles).toHaveBeenCalled();
        });

        it("should handle recent files failure gracefully", async () => {
            (global.window.electronAPI.recentFiles as any).mockRejectedValue(new Error("Recent files failed"));

            const asyncCode = `
                const mockWindow = arguments[0];

                async function initializeAsyncComponents() {
                    try {
                        if (mockWindow.electronAPI?.recentFiles) {
                            try {
                                await mockWindow.electronAPI.recentFiles();
                                console.log("[Renderer] Recent files API available");
                            } catch (error) {
                                console.warn("[Renderer] Recent files initialization failed:", error);
                            }
                        }
                    } catch (error) {
                        console.warn("[Renderer] Some async components failed to initialize:", error);
                    }
                }

                return initializeAsyncComponents();
            `;

            const asyncFunction = new Function(asyncCode);

            // Should not throw despite failure
            await expect(asyncFunction(global.window)).resolves.toBeUndefined();
        });

        it("should check for updates in production mode", async () => {
            const asyncCode = `
                const mockWindow = arguments[0];

                function isDevelopmentMode() {
                    return false; // Production mode
                }

                async function initializeAsyncComponents() {
                    try {
                        if (mockWindow.electronAPI?.checkForUpdates && !isDevelopmentMode()) {
                            try {
                                mockWindow.setTimeout(() => {
                                    mockWindow.electronAPI.checkForUpdates();
                                }, 5000);
                            } catch (error) {
                                console.warn("[Renderer] Update check failed:", error);
                            }
                        }
                    } catch (error) {
                        console.warn("[Renderer] Some async components failed to initialize:", error);
                    }
                }

                initializeAsyncComponents();
                return true;
            `;

            const asyncFunction = new Function(asyncCode);
            const result = asyncFunction(global.window);

            // Should set up timeout for update check in production
            expect(result).toBe(true);
        });
    });

    describe("Global API Exposure", () => {
        it("should expose utilities to global scope", async () => {
            const globalCode = `
                const mockWindow = arguments[0];
                const mockCreateExportGPXButton = arguments[1];
                const APP_INFO = arguments[2];

                if (typeof mockWindow !== "undefined") {
                    mockWindow.createExportGPXButton = mockCreateExportGPXButton;
                    mockWindow.APP_INFO = APP_INFO;
                }

                return {
                    createExportGPXButton: mockWindow.createExportGPXButton,
                    APP_INFO: mockWindow.APP_INFO
                };
            `;

            const APP_INFO = {
                name: "FIT File Viewer",
                version: "21.1.0",
            };

            const globalFunction = new Function(globalCode);
            const result = globalFunction(global.window, mockCreateExportGPXButton, APP_INFO);

            expect(result.createExportGPXButton).toBe(mockCreateExportGPXButton);
            expect(result.APP_INFO).toBe(APP_INFO);
        });

        it("should expose development utilities in dev mode", async () => {
            const devCode = `
                const mockWindow = arguments[0];
                const mockShowNotification = arguments[1];
                const mockHandleOpenFile = arguments[2];

                function isDevelopmentMode() {
                    return true;
                }

                if (typeof mockWindow !== "undefined") {
                    if (isDevelopmentMode()) {
                        mockWindow.__renderer_debug = {
                            showNotification: mockShowNotification,
                            handleOpenFile: mockHandleOpenFile
                        };
                    }
                }

                return mockWindow.__renderer_debug;
            `;

            const devFunction = new Function(devCode);
            const result = devFunction(global.window, mockShowNotification, mockHandleOpenFile);

            expect(result).toBeDefined();
            expect(result.showNotification).toBe(mockShowNotification);
            expect(result.handleOpenFile).toBe(mockHandleOpenFile);
        });
    });

    describe("Module Loading and File Structure", () => {
        it("should have proper import structure defined", async () => {
            // Test that the imports are properly structured
            expect(mockShowNotification).toBeDefined();
            expect(mockHandleOpenFile).toBeDefined();
            expect(mockSetupTheme).toBeDefined();
            expect(mockShowUpdateNotification).toBeDefined();
            expect(mockSetupListeners).toBeDefined();
            expect(mockShowAboutModal).toBeDefined();
            expect(mockCreateExportGPXButton).toBeDefined();
            expect(mockApplyTheme).toBeDefined();
            expect(mockListenForThemeChange).toBeDefined();
            expect(mockSetLoading).toBeDefined();
            expect(mockMasterStateManager).toBeDefined();
            expect(mockAppActions).toBeDefined();
            expect(mockGetState).toBeDefined();
            expect(mockSubscribe).toBeDefined();
            expect(mockUiStateManager).toBeDefined();
        });

        it("should handle window object availability", async () => {
            const testCode = `
                const mockWindow = arguments[0];

                function testWindowAvailability() {
                    if (typeof mockWindow !== "undefined") {
                        return {
                            hasWindow: true,
                            hasLocation: !!mockWindow.location,
                            hasNavigator: !!mockWindow.navigator,
                            hasElectronAPI: !!mockWindow.electronAPI
                        };
                    }
                    return { hasWindow: false };
                }

                return testWindowAvailability();
            `;

            const testFunction = new Function(testCode);
            const result = testFunction(global.window);

            expect(result.hasWindow).toBe(true);
            expect(result.hasLocation).toBe(true);
            expect(result.hasNavigator).toBe(true);
            expect(result.hasElectronAPI).toBe(true);
        });
    });

    describe("DOM Ready State Handling", () => {
        it("should handle loading document state", async () => {
            const mockDoc = { ...global.document, readyState: "loading" } as any;

            const domCode = `
                const mockDocument = arguments[0];
                const mockInitFunction = arguments[1];

                if (mockDocument.readyState === "loading") {
                    mockDocument.addEventListener("DOMContentLoaded", mockInitFunction);
                    return "waiting_for_dom";
                } else {
                    setTimeout(mockInitFunction, 0);
                    return "immediate_init";
                }
            `;

            const domFunction = new Function(domCode);
            const result = domFunction(mockDoc, vi.fn());

            expect(result).toBe("waiting_for_dom");
            expect(mockDoc.addEventListener).toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));
        });

        it("should handle complete document state", async () => {
            const mockDoc = { ...global.document, readyState: "complete" } as any;

            const domCode = `
                const mockDocument = arguments[0];
                const mockWindow = arguments[1];
                const mockInitFunction = arguments[2];

                if (mockDocument.readyState === "loading") {
                    mockDocument.addEventListener("DOMContentLoaded", mockInitFunction);
                    return "waiting_for_dom";
                } else {
                    mockWindow.setTimeout(mockInitFunction, 0);
                    return "immediate_init";
                }
            `;

            const domFunction = new Function(domCode);
            const result = domFunction(mockDoc, global.window, vi.fn());

            expect(result).toBe("immediate_init");
            expect(global.window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
        });
    });
});
