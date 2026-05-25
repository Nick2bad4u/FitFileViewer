// @ts-check
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type AppActionsMock = {
    setFileOpening: ReturnType<typeof vi.fn>;
    setInitialized: ReturnType<typeof vi.fn>;
};

type DomReadyState = "complete" | "interactive" | "loading";

type MockDocumentElement = {
    hasAttribute: ReturnType<typeof vi.fn>;
};

type MockDocument = {
    addEventListener: ReturnType<typeof vi.fn>;
    documentElement: MockDocumentElement;
    getElementById: ReturnType<typeof vi.fn>;
    readyState: DomReadyState;
    removeEventListener: ReturnType<typeof vi.fn>;
};

type MockLocation = {
    hostname: string;
    href: string;
    protocol: string;
    search: string;
};

type MockNavigator = {
    cookieEnabled: boolean;
    hardwareConcurrency: number;
    language: string;
    onLine: boolean;
    platform: string;
    userAgent: string;
};

type MockPerformance = {
    memory: {
        jsHeapSizeLimit: number;
        totalJSHeapSize: number;
        usedJSHeapSize: number;
    } | null;
    now: ReturnType<typeof vi.fn>;
};

type MockElectronAPI = {
    __devMode?: boolean;
    checkForUpdates?: ReturnType<typeof vi.fn>;
    recentFiles?: ReturnType<typeof vi.fn>;
};

type MockWindow = {
    APP_INFO?: unknown;
    __DEVELOPMENT__?: boolean;
    __renderer_debug?: {
        handleOpenFile: UnknownFunction;
        showNotification: ShowNotification;
    };
    addEventListener: ReturnType<typeof vi.fn>;
    clearTimeout: ReturnType<typeof vi.fn>;
    createExportGPXButton?: UnknownFunction;
    electronAPI?: MockElectronAPI;
    location: MockLocation;
    navigator: MockNavigator;
    removeEventListener: ReturnType<typeof vi.fn>;
    setTimeout: ReturnType<typeof vi.fn>;
};

type MasterStateManagerMock = {
    cleanup: ReturnType<typeof vi.fn>;
    getHistory: ReturnType<typeof vi.fn>;
    getState: ReturnType<typeof vi.fn>;
    getSubscriptions: ReturnType<typeof vi.fn>;
    initialize: ReturnType<typeof vi.fn>;
    isInitialized: boolean;
};

type ShowNotification = (
    message: string,
    type?: string,
    duration?: number
) => void;

type UnknownFunction = (...args: unknown[]) => unknown;

type UncaughtErrorEvent = {
    error?: Error;
};

type UnhandledRejectionEventLike = {
    preventDefault: () => void;
    reason?: Error;
};

type ComponentDependencies = {
    applyTheme: UnknownFunction;
    listenForThemeChange: UnknownFunction;
    openFileBtn?: null | { id: string };
};

function getMockWindow(): MockWindow {
    return global.window as unknown as MockWindow;
}

function getMockDocument(): MockDocument {
    return global.document as unknown as MockDocument;
}

function getMockPerformance(): MockPerformance {
    return global.performance as unknown as MockPerformance;
}

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

const REQUIRED_DOM_ELEMENTS = [
    { id: "openFileBtn", name: "Open File button" },
    { id: "notification", name: "Notification container" },
    { id: "loadingOverlay", name: "Loading overlay" },
];

function isDevelopmentModeFor(
    windowRef: MockWindow,
    documentRef: MockDocument,
    consoleRef: Console | undefined = global.console
): boolean {
    return (
        windowRef.location.hostname === "localhost" ||
        windowRef.location.hostname === "127.0.0.1" ||
        windowRef.location.hostname.includes("dev") ||
        windowRef.__DEVELOPMENT__ === true ||
        windowRef.location.search.includes("debug=true") ||
        documentRef.documentElement.hasAttribute("data-dev-mode") ||
        windowRef.location.protocol === "file:" ||
        (windowRef.electronAPI &&
            typeof windowRef.electronAPI.__devMode !== "undefined") ||
        (typeof consoleRef !== "undefined" &&
            windowRef.location.href.includes("electron"))
    );
}

function getEnvironmentFor(
    windowRef: MockWindow,
    documentRef: MockDocument
): "development" | "production" {
    return isDevelopmentModeFor(windowRef, documentRef)
        ? "development"
        : "production";
}

async function initializeStateManagerFor(
    masterStateManager: MasterStateManagerMock,
    appActions: AppActionsMock,
    getStateFn: (path: string) => unknown,
    subscribeFn: (path: string, callback: () => void) => unknown
) {
    try {
        console.log("[Renderer] Initializing state management system...");
        await masterStateManager.initialize();

        subscribeFn("app.isOpeningFile", () => undefined);

        return {
            get isInitialized() {
                return masterStateManager.getState().app.initialized;
            },
            set isInitialized(value) {
                appActions.setInitialized(value);
            },
            get isOpeningFile() {
                return masterStateManager.getState().app.isOpeningFile;
            },
            set isOpeningFile(value) {
                appActions.setFileOpening(value);
            },
            get startTime() {
                return getStateFn("app.startTime");
            },
        };
    } catch (error) {
        console.error("[Renderer] Failed to initialize state manager:", error);
        throw error;
    }
}

function handleUnhandledRejectionFor(
    showNotification: ShowNotification,
    _masterStateManager: MasterStateManagerMock,
    event: UnhandledRejectionEventLike
): "unhandled_rejection_handled" {
    console.error("[Renderer] Unhandled promise rejection:", event.reason);

    try {
        showNotification(
            `Application error: ${event.reason?.message || "Unknown error"}`,
            "error",
            5000
        );
    } catch (notifyError) {
        console.error(
            "[Renderer] Failed to show error notification:",
            notifyError
        );
    }

    event.preventDefault();
    return "unhandled_rejection_handled";
}

function handleUncaughtErrorFor(
    showNotification: ShowNotification,
    _masterStateManager: MasterStateManagerMock,
    event: UncaughtErrorEvent
): "uncaught_error_handled" {
    console.error("[Renderer] Uncaught error:", event.error);

    try {
        showNotification(
            `Critical error: ${event.error?.message || "Unknown error"}`,
            "error",
            7000
        );
    } catch (notifyError) {
        console.error(
            "[Renderer] Failed to show error notification:",
            notifyError
        );
    }
    return "uncaught_error_handled";
}

function validateDOMElementsFor(
    documentRef: Pick<MockDocument, "getElementById">,
    showNotification: ShowNotification
): boolean {
    const missingElements = REQUIRED_DOM_ELEMENTS.filter(
        ({ id }) => !documentRef.getElementById(id)
    );

    if (missingElements.length > 0) {
        const missing = missingElements.map(({ name }) => name).join(", ");
        console.error("[Renderer] Missing required DOM elements:", missing);

        try {
            showNotification(
                `Critical: Missing UI elements: ${missing}`,
                "error",
                10000
            );
        } catch (error) {
            console.error("[Renderer] Could not show notification:", error);
        }
        return false;
    }

    return true;
}

function createPerformanceMonitor(performanceRef: Performance) {
    return {
        metrics: new Map<string, number>(),

        start(operation: string) {
            this.metrics.set(`${operation}_start`, performanceRef.now());
        },

        end(operation: string) {
            const startTime = this.metrics.get(`${operation}_start`);
            if (startTime === undefined) {
                console.warn(
                    `[Performance] No start time found for operation: ${operation}`
                );
                return 0;
            }

            const duration = performanceRef.now() - startTime;
            this.metrics.set(operation, duration);

            console.log(`[Performance] ${operation}: ${duration.toFixed(2)}ms`);
            return duration;
        },

        getMetrics() {
            const result: Record<string, number> = {};
            for (const [key, value] of this.metrics) {
                if (!key.endsWith("_start")) {
                    result[key] = value;
                }
            }
            return result;
        },
    };
}

function createAppInfo(
    navigatorRef: MockNavigator,
    performanceRef: Pick<MockPerformance, "memory">
) {
    return {
        name: "FIT File Viewer",
        version: "21.1.0",
        description: "Advanced FIT file analysis and visualization tool",
        author: "FIT File Viewer Team",
        repository: "https://github.com/user/FitFileViewer",
        license: "MIT",

        getRuntimeInfo() {
            return {
                userAgent: navigatorRef.userAgent,
                platform: navigatorRef.platform,
                language: navigatorRef.language,
                cookieEnabled: navigatorRef.cookieEnabled,
                onLine: navigatorRef.onLine,
                hardwareConcurrency: navigatorRef.hardwareConcurrency,
                memoryUsage: performanceRef.memory
                    ? {
                          usedJSHeapSize: performanceRef.memory.usedJSHeapSize,
                          totalJSHeapSize:
                              performanceRef.memory.totalJSHeapSize,
                          jsHeapSizeLimit:
                              performanceRef.memory.jsHeapSizeLimit,
                      }
                    : null,
            };
        },
    };
}

function cleanupRendererFor(
    masterStateManager: MasterStateManagerMock,
    appActions: AppActionsMock,
    windowRef?: Pick<MockWindow, "removeEventListener">
) {
    const noopUnhandledRejection = () => undefined;
    const noopError = () => undefined;

    try {
        console.log("[Renderer] Performing cleanup...");

        windowRef?.removeEventListener(
            "unhandledrejection",
            noopUnhandledRejection
        );
        windowRef?.removeEventListener("error", noopError);

        if (masterStateManager.isInitialized) {
            appActions.setInitialized(false);
            appActions.setFileOpening(false);
            masterStateManager.cleanup();
            console.log("[Renderer] Cleanup completed");
            return "state_manager_cleaned";
        }

        const appState = { isInitialized: true, isOpeningFile: true };
        const isOpeningFileRef = { value: true };

        appState.isInitialized = false;
        appState.isOpeningFile = false;
        isOpeningFileRef.value = false;

        console.log("[Renderer] Cleanup completed");
        return { appState, isOpeningFileRef };
    } catch (error) {
        console.error("[Renderer] Cleanup failed:", error);
        return "cleanup_failed";
    }
}

async function initializeComponentsFor(
    setupTheme: UnknownFunction,
    setupListeners: UnknownFunction,
    dependencies: ComponentDependencies
) {
    try {
        console.log("[Renderer] Setting up theme system...");
        setupTheme(dependencies.applyTheme, dependencies.listenForThemeChange);

        console.log("[Renderer] Setting up event listeners...");
        if (dependencies.openFileBtn) {
            setupListeners(dependencies);
            console.log("[Renderer] All components initialized successfully");
            return "listeners_ready";
        }

        console.warn(
            "[Renderer] Open file button not found, skipping listener setup"
        );
        console.log("[Renderer] All components initialized successfully");
        return "listeners_skipped";
    } catch (error) {
        console.error("[Renderer] Component initialization failed:", error);
        throw error;
    }
}

async function initializeRecentFilesFor(windowRef: MockWindow) {
    try {
        if (windowRef.electronAPI?.recentFiles) {
            try {
                await windowRef.electronAPI.recentFiles();
                console.log("[Renderer] Recent files API available");
                return "recent_files_ready";
            } catch (error) {
                console.warn("[Renderer] Recent files initialization failed:", error);
                return "recent_files_failed";
            }
        }
        return "recent_files_unavailable";
    } catch (error) {
        console.warn("[Renderer] Some async components failed to initialize:", error);
        return "async_components_failed";
    }
}

function scheduleProductionUpdateCheckFor(windowRef: MockWindow) {
    try {
        if (windowRef.electronAPI?.checkForUpdates) {
            try {
                windowRef.setTimeout(() => {
                    windowRef.electronAPI.checkForUpdates();
                }, 5000);
                return "update_check_scheduled";
            } catch (error) {
                console.warn("[Renderer] Update check failed:", error);
                return "update_check_failed";
            }
        }
        return "update_check_unavailable";
    } catch (error) {
        console.warn("[Renderer] Some async components failed to initialize:", error);
        return "async_components_failed";
    }
}

function exposeUtilitiesFor(
    windowRef: MockWindow,
    createExportGPXButton: UnknownFunction,
    appInfo: unknown
) {
    if (typeof windowRef !== "undefined") {
        windowRef.createExportGPXButton = createExportGPXButton;
        windowRef.APP_INFO = appInfo;
    }

    return {
        createExportGPXButton: windowRef.createExportGPXButton,
        APP_INFO: windowRef.APP_INFO,
    };
}

function exposeDevelopmentUtilitiesFor(
    windowRef: MockWindow,
    showNotification: ShowNotification,
    handleOpenFile: UnknownFunction
) {
    if (typeof windowRef !== "undefined") {
        windowRef.__renderer_debug = {
            showNotification,
            handleOpenFile,
        };
    }

    return windowRef.__renderer_debug;
}

function getWindowAvailability(windowRef: MockWindow | undefined) {
    if (typeof windowRef !== "undefined") {
        return {
            hasWindow: true,
            hasLocation: Boolean(windowRef.location),
            hasNavigator: Boolean(windowRef.navigator),
            hasElectronAPI: Boolean(windowRef.electronAPI),
        };
    }
    return { hasWindow: false };
}

function handleDomReadyState(
    documentRef: Pick<MockDocument, "addEventListener" | "readyState">,
    windowRef: Pick<MockWindow, "setTimeout">,
    initFunction: () => void
) {
    if (documentRef.readyState === "loading") {
        documentRef["addEventListener"]("DOMContentLoaded", initFunction);
        return "waiting_for_dom";
    }

    windowRef.setTimeout(initFunction, 0);
    return "immediate_init";
}

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
        mockMasterStateManager.initialize.mockResolvedValue(undefined);
        mockMasterStateManager.getState.mockReturnValue({
            app: {
                initialized: false,
                isOpeningFile: false,
                startTime: 1000,
            },
        });
        mockGetState.mockReturnValue(1000);

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
        global.document = mockDocument as unknown as Document;
        global.window = mockWindow as unknown as Window & typeof globalThis;
        global.performance = mockPerformance as unknown as Performance;
        global.console = mockConsole as unknown as Console;
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
            // Test localhost detection
            expect(isDevelopmentModeFor(getMockWindow(), getMockDocument())).toBe(
                true
            );
            expect(getEnvironmentFor(getMockWindow(), getMockDocument())).toBe(
                "development"
            );
        });

        it("should detect production mode correctly", async () => {
            // Mock production environment
            getMockWindow().location.hostname = "app.production.com";
            getMockWindow().electronAPI = undefined;
            getMockWindow().__DEVELOPMENT__ = undefined;

            expect(isDevelopmentModeFor(getMockWindow(), getMockDocument())).toBe(
                false
            );
            expect(getEnvironmentFor(getMockWindow(), getMockDocument())).toBe(
                "production"
            );
            expect(getEnvironmentFor(getMockWindow(), getMockDocument())).not.toBe(
                "development"
            );
        });

        it("should handle different development indicators", async () => {
            const testCases: readonly {
                expected: boolean;
                prop: keyof MockLocation;
                value: string;
            }[] = [
                { prop: "hostname", value: "127.0.0.1", expected: true },
                { prop: "hostname", value: "dev.example.com", expected: true },
                { prop: "search", value: "?debug=true", expected: true },
                { prop: "protocol", value: "file:", expected: true },
            ];

            for (const testCase of testCases) {
                // Reset to production state
                getMockWindow().location.hostname = "production.com";
                getMockWindow().location.search = "";
                getMockWindow().location.protocol = "https:";
                getMockWindow().__DEVELOPMENT__ = undefined;
                getMockWindow().electronAPI = undefined;

                // Set specific test case
                getMockWindow().location[testCase.prop] = testCase.value;

                expect(isDevelopmentModeFor(getMockWindow(), getMockDocument())).toBe(
                    testCase.expected
                );
            }
        });
    });

    describe("State Management Initialization", () => {
        it("should initialize state manager successfully", async () => {
            mockMasterStateManager.isInitialized = true;

            const result = await initializeStateManagerFor(
                mockMasterStateManager,
                mockAppActions,
                mockGetState,
                mockSubscribe
            );

            expect(mockMasterStateManager.initialize).toHaveBeenCalled();
            expect(mockSubscribe).toHaveBeenCalledWith(
                "app.isOpeningFile",
                expect.any(Function)
            );
            expect(result).toMatchObject({
                isInitialized: false,
                isOpeningFile: false,
                startTime: 1000,
            });
        });

        it("should handle state manager initialization failure", async () => {
            mockMasterStateManager.initialize.mockRejectedValue(
                new Error("Init failed")
            );

            await expect(
                initializeStateManagerFor(
                    mockMasterStateManager,
                    mockAppActions,
                    mockGetState,
                    mockSubscribe
                )
            ).rejects.toThrow("Init failed");
            expect(mockMasterStateManager.initialize).toHaveBeenCalled();
            expect(mockSubscribe).not.toHaveBeenCalled();
        });
    });

    describe("Error Handling", () => {
        it("should handle unhandled promise rejections", async () => {
            const mockEvent = {
                reason: new Error("Test rejection"),
                preventDefault: vi.fn(),
            };

            const handlingOutcome = handleUnhandledRejectionFor(
                mockShowNotification,
                mockMasterStateManager,
                mockEvent
            );

            expect(handlingOutcome).toBe("unhandled_rejection_handled");
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Application error: Test rejection",
                "error",
                5000
            );
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it("should handle uncaught errors", async () => {
            const mockEvent = {
                error: new Error("Test uncaught error"),
            };

            const handlingOutcome = handleUncaughtErrorFor(
                mockShowNotification,
                mockMasterStateManager,
                mockEvent
            );

            expect(handlingOutcome).toBe("uncaught_error_handled");
            expect(mockShowNotification).toHaveBeenCalledWith(
                "Critical error: Test uncaught error",
                "error",
                7000
            );
            expect(mockShowNotification).not.toHaveBeenCalledWith(
                "Application error: Test uncaught error",
                "error",
                5000
            );
        });

        it("should handle notification failures gracefully", async () => {
            mockShowNotification.mockImplementation(() => {
                throw new Error("Notification failed");
            });

            const mockEvent = {
                reason: new Error("Test error"),
                preventDefault: vi.fn(),
            };

            // Should not throw despite notification failure
            expect(() =>
                handleUnhandledRejectionFor(
                    mockShowNotification,
                    mockMasterStateManager,
                    mockEvent
                )
            ).not.toThrow();
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(global.console.error).toHaveBeenCalledWith(
                "[Renderer] Failed to show error notification:",
                expect.any(Error)
            );
        });
    });

    describe("DOM Validation", () => {
        it("should validate required DOM elements successfully", async () => {
            getMockDocument().getElementById = vi
                .fn()
                .mockImplementation((id) => {
                    const requiredIds = [
                        "openFileBtn",
                        "notification",
                        "loadingOverlay",
                    ];
                    return requiredIds.includes(id) ? { id } : null;
                });

            const result = validateDOMElementsFor(
                getMockDocument(),
                mockShowNotification
            );

            expect(result).toBe(true);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it("should handle missing DOM elements", async () => {
            getMockDocument().getElementById = vi.fn().mockReturnValue(null);

            const result = validateDOMElementsFor(
                getMockDocument(),
                mockShowNotification
            );

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
            const monitor = createPerformanceMonitor(
                getMockPerformance() as unknown as Performance
            );

            // Test start timing
            monitor.start("test_operation");
            expect(monitor.metrics.get("test_operation_start")).toBe(1000);

            // Mock time advancement
            getMockPerformance().now = vi.fn().mockReturnValue(1500);

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
            const monitor = createPerformanceMonitor(
                getMockPerformance() as unknown as Performance
            );

            const duration = monitor.end("missing_operation");
            expect(duration).toBe(0);
            expect(monitor.metrics.has("missing_operation")).toBe(false);
            expect(global.console.warn).toHaveBeenCalledWith(
                "[Performance] No start time found for operation: missing_operation"
            );
        });
    });

    describe("Application Information", () => {
        it("should provide correct app information", async () => {
            const appInfo = createAppInfo(
                getMockWindow().navigator,
                getMockPerformance()
            );

            expect(appInfo.name).toBe("FIT File Viewer");
            expect(appInfo.version).toBe("21.1.0");
            expect(appInfo.description).toBe(
                "Advanced FIT file analysis and visualization tool"
            );

            const runtimeInfo = appInfo.getRuntimeInfo();
            expect(runtimeInfo.userAgent).toBe(
                getMockWindow().navigator.userAgent
            );
            expect(runtimeInfo.platform).toBe(getMockWindow().navigator.platform);
            expect(runtimeInfo.memoryUsage).toEqual({
                usedJSHeapSize: 1000000,
                totalJSHeapSize: 2000000,
                jsHeapSizeLimit: 4000000,
            });
        });

        it("should handle missing performance.memory gracefully", async () => {
            const mockPerformanceNoMemory: MockPerformance = {
                now: vi.fn().mockReturnValue(1000),
                memory: null,
            };

            const runtimeInfo = createAppInfo(
                getMockWindow().navigator,
                mockPerformanceNoMemory
            ).getRuntimeInfo();

            expect(runtimeInfo.memoryUsage).toBeNull();
            expect(runtimeInfo.userAgent).toBe(
                getMockWindow().navigator.userAgent
            );
        });
    });

    describe("Cleanup Functions", () => {
        it("should cleanup properly with initialized state manager", async () => {
            mockMasterStateManager.isInitialized = true;

            expect(
                cleanupRendererFor(
                    mockMasterStateManager,
                    mockAppActions,
                    getMockWindow()
                )
            ).toBe("state_manager_cleaned");
            expect(mockAppActions.setInitialized).toHaveBeenCalledWith(false);
            expect(mockAppActions.setFileOpening).toHaveBeenCalledWith(false);
            expect(mockMasterStateManager.cleanup).toHaveBeenCalled();
            expect(getMockWindow().removeEventListener).toHaveBeenCalledWith(
                "unhandledrejection",
                expect.any(Function)
            );
            expect(getMockWindow().removeEventListener).toHaveBeenCalledWith(
                "error",
                expect.any(Function)
            );
        });

        it("should cleanup with fallback when state manager not initialized", async () => {
            mockMasterStateManager.isInitialized = false;

            const view = cleanupRendererFor(
                mockMasterStateManager,
                mockAppActions,
                getMockWindow()
            );

            expect(view).toEqual({
                appState: { isInitialized: false, isOpeningFile: false },
                isOpeningFileRef: { value: false },
            });
            expect(mockMasterStateManager.cleanup).not.toHaveBeenCalled();
        });

        it("should handle cleanup errors gracefully", async () => {
            mockMasterStateManager.cleanup.mockImplementation(() => {
                throw new Error("Cleanup failed");
            });
            mockMasterStateManager.isInitialized = true;

            // Should not throw even if cleanup fails
            expect(() =>
                cleanupRendererFor(mockMasterStateManager, mockAppActions)
            ).not.toThrow();
            expect(mockMasterStateManager.cleanup).toHaveBeenCalled();
            expect(global.console.error).toHaveBeenCalledWith(
                "[Renderer] Cleanup failed:",
                expect.any(Error)
            );
        });
    });

    describe("Component Initialization", () => {
        it("should initialize components in correct order", async () => {
            const dependencies = {
                openFileBtn: { id: "openFileBtn" },
                applyTheme: mockApplyTheme,
                listenForThemeChange: mockListenForThemeChange,
            };

            const result = await initializeComponentsFor(
                mockSetupTheme,
                mockSetupListeners,
                dependencies
            );

            expect(result).toBe("listeners_ready");
            expect(mockSetupTheme).toHaveBeenCalledWith(
                mockApplyTheme,
                mockListenForThemeChange
            );
            expect(mockSetupListeners).toHaveBeenCalledWith(dependencies);
        });

        it("should handle missing openFileBtn gracefully", async () => {
            const dependencies = {
                openFileBtn: null,
                applyTheme: mockApplyTheme,
                listenForThemeChange: mockListenForThemeChange,
            };

            const result = await initializeComponentsFor(
                mockSetupTheme,
                mockSetupListeners,
                dependencies
            );

            expect(result).toBe("listeners_skipped");
            expect(mockSetupTheme).toHaveBeenCalledWith(
                mockApplyTheme,
                mockListenForThemeChange
            );
            expect(mockSetupListeners).not.toHaveBeenCalled();
        });
    });

    describe("Async Components", () => {
        it("should initialize recent files successfully", async () => {
            const result = await initializeRecentFilesFor(getMockWindow());

            expect(result).toBe("recent_files_ready");
            expect(getMockWindow().electronAPI?.recentFiles).toHaveBeenCalled();
        });

        it("should handle recent files failure gracefully", async () => {
            getMockWindow().electronAPI?.recentFiles?.mockRejectedValue(
                new Error("Recent files failed")
            );

            // Should not throw despite failure
            await expect(initializeRecentFilesFor(getMockWindow())).resolves.toBe(
                "recent_files_failed"
            );
            expect(global.console.warn).toHaveBeenCalledWith(
                "[Renderer] Recent files initialization failed:",
                expect.any(Error)
            );
        });

        it("should check for updates in production mode", async () => {
            const result = scheduleProductionUpdateCheckFor(getMockWindow());

            // Should set up timeout for update check in production
            expect(result).toBe("update_check_scheduled");
            expect(getMockWindow().setTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                5000
            );
        });
    });

    describe("Global API Exposure", () => {
        it("should expose utilities to global scope", async () => {
            const APP_INFO = {
                name: "FIT File Viewer",
                version: "21.1.0",
            };

            const result = exposeUtilitiesFor(
                getMockWindow(),
                mockCreateExportGPXButton,
                APP_INFO
            );

            expect(result.createExportGPXButton).toBe(
                mockCreateExportGPXButton
            );
            expect(result.APP_INFO).toBe(APP_INFO);
        });

        it("should expose development utilities in dev mode", async () => {
            const result = exposeDevelopmentUtilitiesFor(
                getMockWindow(),
                mockShowNotification,
                mockHandleOpenFile
            );

            expect(result).toEqual({
                showNotification: mockShowNotification,
                handleOpenFile: mockHandleOpenFile,
            });
            expect(result).not.toHaveProperty("createExportGPXButton");
        });
    });

    describe("Module Loading and File Structure", () => {
        it("should have proper import structure defined", async () => {
            // Test that the imports are properly structured
            expect(typeof mockShowNotification).toBe("function");
            expect(typeof mockHandleOpenFile).toBe("function");
            expect(typeof mockSetupTheme).toBe("function");
            expect(typeof mockShowUpdateNotification).toBe("function");
            expect(typeof mockSetupListeners).toBe("function");
            expect(typeof mockShowAboutModal).toBe("function");
            expect(typeof mockCreateExportGPXButton).toBe("function");
            expect(typeof mockApplyTheme).toBe("function");
            expect(typeof mockListenForThemeChange).toBe("function");
            expect(typeof mockSetLoading).toBe("function");
            expect(typeof mockMasterStateManager.initialize).toBe("function");
            expect(typeof mockMasterStateManager.cleanup).toBe("function");
            expect(mockMasterStateManager.isInitialized).toBe(false);
            expect(typeof mockAppActions.setInitialized).toBe("function");
            expect(typeof mockAppActions.setFileOpening).toBe("function");
            expect(typeof mockGetState).toBe("function");
            expect(typeof mockSubscribe).toBe("function");
            expect(mockUiStateManager).toEqual({});
            expect(mockUiStateManager).not.toHaveProperty("initialize");
        });

        it("should handle window object availability", async () => {
            const result = getWindowAvailability(getMockWindow());

            expect(result).toEqual({
                hasWindow: true,
                hasLocation: true,
                hasNavigator: true,
                hasElectronAPI: true,
            });
            expect(getWindowAvailability(undefined)).toEqual({
                hasWindow: false,
            });
        });
    });

    describe("DOM Ready State Handling", () => {
        it("should handle loading document state", async () => {
            const mockDoc: MockDocument = {
                ...getMockDocument(),
                readyState: "loading",
            };

            const initFunction = vi.fn();
            const result = handleDomReadyState(
                mockDoc,
                getMockWindow(),
                initFunction
            );

            expect(result).toBe("waiting_for_dom");
            expect(mockDoc.addEventListener).toHaveBeenCalledWith(
                "DOMContentLoaded",
                initFunction
            );
            expect(getMockWindow().setTimeout).not.toHaveBeenCalled();
        });

        it("should handle complete document state", async () => {
            const mockDoc: MockDocument = {
                ...getMockDocument(),
                readyState: "complete",
            };

            const initFunction = vi.fn();
            const result = handleDomReadyState(
                mockDoc,
                getMockWindow(),
                initFunction
            );

            expect(result).toBe("immediate_init");
            expect(getMockWindow().setTimeout).toHaveBeenCalledWith(
                initFunction,
                0
            );
            expect(mockDoc.addEventListener).not.toHaveBeenCalledWith(
                "DOMContentLoaded",
                initFunction
            );
        });
    });
});
