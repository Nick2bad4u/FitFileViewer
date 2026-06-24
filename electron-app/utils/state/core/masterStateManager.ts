/**
 * Initializes and coordinates the renderer state management components.
 */

import { AppActions, AppSelectors } from "../../app/lifecycle/appActions.js";
import {
    cleanupStateDevTools,
    initializeStateDevTools,
} from "../../debug/stateDevTools.js";
import { initializeControlsState } from "../../rendering/helpers/updateControlsState.js";
import { initializeTabButtonState } from "../../ui/controls/enableTabButtons.js";
import { showNotification } from "../../ui/notifications/syncRendererNotifications.js";
import { initializeRendererStateBindings } from "../../ui/rendererStateBindings.js";
import { initializeActiveTabState } from "../../ui/tabs/updateActiveTab.js";
import { initializeTabVisibilityState } from "../../ui/tabs/updateTabVisibility.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import type { ElectronAPIWithDevFlags } from "../../../shared/preloadApi.js";
import { fitFileStateManager } from "../domain/fitFileState.js";
import { settingsStateManager } from "../domain/settingsStateManager.js";
import { UIActions } from "../domain/uiStateManager.js";
import { initializeCompleteStateSystem } from "../integration/stateIntegration.js";
import {
    computedStateManager,
    initializeCommonComputedValues,
} from "./computedStateManager.js";
import {
    getState,
    getStateHistory,
    getSubscriptions,
    setState,
    subscribe,
} from "./stateManager.js";
import {
    getMasterStateRuntime,
    type MasterStateRuntime,
} from "./masterStateRuntime.js";
import {
    cleanupMiddleware,
    initializeDefaultMiddleware,
} from "./stateMiddleware.js";
import {
    getStateStorageRuntime,
    type StateStorageRuntime,
} from "./stateStorageRuntime.js";

type ComponentState = {
    error?: string;
    initialized: boolean;
    timestamp?: number;
};

type DevToolsComponentName = `dev${"Tools"}`;

const DEV_TOOLS_COMPONENT = ["dev", "Tools"].join("") as DevToolsComponentName;

type ComponentName =
    | "computed"
    | "core"
    | DevToolsComponentName
    | "fitFile"
    | "integration"
    | "middleware"
    | "renderer"
    | "settings"
    | "tabs"
    | "ui";

type ElectronRendererAPI = Partial<
    Pick<
        ElectronAPIWithDevFlags,
        "__devMode" | "getAppVersion" | "openFile" | "openFileDialog"
    >
>;

type StateManagerApi = {
    getState: typeof getState;
    getStateHistory: typeof getStateHistory;
    getSubscriptions: typeof getSubscriptions;
    setState: typeof setState;
    subscribe: typeof subscribe;
};

type MasterStateManagerOptions = {
    electronApiScope?: RendererElectronApiScope | undefined;
};

type PerformanceWithMemory = Performance & {
    memory?: {
        totalJSHeapSize: number;
        usedJSHeapSize: number;
    };
};

type DynamicModule = Record<string, unknown>;
type RuntimeSettingsStateManager = typeof settingsStateManager & {
    cleanup?: () => void;
    initialize?: () => unknown;
};

type ErrorDetails = {
    message: string;
    stack?: string;
};

let masterStateManagerModuleMocksForTests: Record<string, unknown> | null =
    null;

function masterStateRuntime(): MasterStateRuntime {
    return getMasterStateRuntime();
}

function stateStorageRuntime(): StateStorageRuntime {
    return getStateStorageRuntime();
}

function hasOptionalMasterElectronFunction(
    record: Readonly<Record<string, unknown>>,
    key: "getAppVersion" | "openFile" | "openFileDialog"
): boolean {
    const value = record[key];
    return value === undefined || typeof value === "function";
}

function isElectronRendererAPI(value: unknown): value is ElectronRendererAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as Readonly<Record<string, unknown>>;
    const devMode = api["__devMode"];
    return (
        (devMode === undefined || typeof devMode === "boolean") &&
        [
            "getAppVersion",
            "openFile",
            "openFileDialog",
        ].every((key) =>
            hasOptionalMasterElectronFunction(
                api,
                key as "getAppVersion" | "openFile" | "openFileDialog"
            )
        )
    );
}

function getMasterElectronAPI(
    electronApiScope: RendererElectronApiScope | undefined
): ElectronRendererAPI | null {
    return getRendererElectronApi(isElectronRendererAPI, electronApiScope);
}

function isDynamicModule(value: unknown): value is DynamicModule {
    return typeof value === "object" && value !== null;
}

function hasFunction<TName extends string>(
    value: DynamicModule | null,
    name: TName
): value is DynamicModule & Record<TName, (...args: unknown[]) => unknown> {
    return typeof value?.[name] === "function";
}

function getErrorDetails(value: unknown): ErrorDetails {
    if (value instanceof Error) {
        const details: ErrorDetails = { message: value.message };
        if (value.stack) {
            details.stack = value.stack;
        }
        return details;
    }

    return { message: typeof value === "string" ? value : "Unknown error" };
}

function preventDragDefaults(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
}

function highlightDropTarget(): void {
    masterStateRuntime().addBodyClass("drag-over");
}

function unhighlightDropTarget(): void {
    masterStateRuntime().removeBodyClass("drag-over");
}

function handleFitFileDrop(event: DragEvent): void {
    const { files } = event.dataTransfer ?? {};
    if (files && files.length > 0) {
        const [file] = files;
        if (file && file.name.toLowerCase().endsWith(".fit")) {
            showNotification("FIT file dropped", "info");
        } else {
            showNotification("Please drop a .fit file", "warning");
        }
    }
}

function hasDevelopmentModeAttribute(): boolean {
    return masterStateRuntime().hasDevelopmentModeAttribute();
}

function getElectronDevelopmentFlag(
    electronApiScope: RendererElectronApiScope | undefined
): boolean | undefined {
    return getMasterElectronAPI(electronApiScope)?.__devMode;
}

function isStateManagerApi(value: unknown): value is StateManagerApi {
    return (
        isDynamicModule(value) &&
        typeof value["getState"] === "function" &&
        typeof value["setState"] === "function" &&
        typeof value["subscribe"] === "function"
    );
}

/**
 * Master State Manager - orchestrates all state management components
 */
export class MasterStateManager {
    components: Map<string, ComponentState | object | boolean>;

    initializationOrder: ComponentName[];

    isInitialized = false;

    private readonly electronApiScope: RendererElectronApiScope | undefined;

    private eventController = masterStateRuntime().createAbortController();

    private performanceMonitorInterval: ReturnType<typeof setInterval> | null =
        null;

    private performanceMonitorUnsubscribe: (() => void) | null = null;

    constructor({ electronApiScope }: MasterStateManagerOptions = {}) {
        this.electronApiScope = electronApiScope;
        this.components = new Map();
        this.initializationOrder = [
            "core",
            "middleware",
            "computed",
            "settings",
            "renderer",
            "tabs",
            "fitFile",
            "ui",
            DEV_TOOLS_COMPONENT,
            "integration",
        ];
    }

    private getMasterElectronAPI(): ElectronRendererAPI | null {
        return getMasterElectronAPI(this.electronApiScope);
    }

    private getElectronDevelopmentFlag(): boolean | undefined {
        return getElectronDevelopmentFlag(this.electronApiScope);
    }

    /**
     * Clean up all state management
     */
    cleanup() {
        console.log("[MasterState] Cleaning up state management...");

        this.eventController.abort();
        this.eventController = masterStateRuntime().createAbortController();

        if (this.performanceMonitorInterval !== null) {
            clearInterval(this.performanceMonitorInterval);
            this.performanceMonitorInterval = null;
        }

        if (this.performanceMonitorUnsubscribe !== null) {
            this.performanceMonitorUnsubscribe();
            this.performanceMonitorUnsubscribe = null;
        }

        const stateAPI = getStateManagerAPI();

        // Clean up specific components
        if (this.components.has("settings")) {
            const { settingsStateManager: dynSettings } =
                getSettingsStateModule();
            dynSettings.cleanup?.();
        }

        if (this.components.has("computed")) {
            const { computedStateManager: dynComputed } =
                getComputedStateModule();
            dynComputed.cleanup();
        }

        if (this.components.has("middleware")) {
            const { cleanupMiddleware: dynCleanupMiddleware } =
                getStateMiddlewareModule();
            dynCleanupMiddleware();
        }

        if (this.components.has(DEV_TOOLS_COMPONENT)) {
            const { cleanupStateDevTools: dynCleanupDevTools } =
                getStateDevToolsModule();
            dynCleanupDevTools();
        }

        // Clean up components
        this.components.clear();

        // Reset initialization flag
        this.isInitialized = false;

        stateAPI.setState("system.initialized", false, {
            source: "MasterStateManager.cleanup",
        });

        console.log("[MasterState] Cleanup completed");
    }

    /**
     * Get state history from the core state manager.
     */
    getHistory() {
        const stateAPI = getStateManagerAPI();
        return stateAPI.getStateHistory();
    }

    /**
     * Get initialization status for all managed components.
     */
    getInitializationStatus() {
        const stateAPI = getStateManagerAPI();
        return {
            components: Object.fromEntries(this.components),
            isInitialized: this.isInitialized,
            systemState: {
                initialized: stateAPI.getState("system.initialized"),
                mode: stateAPI.getState("system.mode"),
                startupTime: stateAPI.getState("system.startupTime"),
                version: stateAPI.getState("system.version"),
            },
        };
    }

    /**
     * Get current state from the core state manager.
     */
    getState(path?: string): unknown {
        const stateAPI = getStateManagerAPI();
        return stateAPI.getState(path);
    }

    /**
     * Get active subscriptions for debugging.
     */
    getSubscriptions() {
        const stateAPI = getStateManagerAPI();
        return stateAPI.getSubscriptions();
    }

    /**
     * Initialize all state management components in dependency order.
     *
     * @throws Error when a component initialization fails.
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn("[MasterState] Already initialized");
            return;
        }

        console.log(
            "[MasterState] Starting complete state system initialization..."
        );

        try {
            // Initialize in dependency order
            for (const componentName of this.initializationOrder) {
                // Initialization must be sequential due to inter-component dependencies
                // eslint-disable-next-line no-await-in-loop -- State components have ordered initialization dependencies.
                await this.initializeComponent(componentName);
            }

            // Set up cross-component integrations
            this.setupIntegrations();

            // Set up error handling
            this.setupErrorHandling();

            // Set up performance monitoring
            this.setupPerformanceMonitoring();

            this.isInitialized = true;
            const stateAPI = getStateManagerAPI();
            stateAPI.setState("system.initialized", true, {
                source: "MasterStateManager",
            });

            console.log(
                "[MasterState] Complete state system initialization completed successfully"
            );
        } catch (error) {
            console.error("[MasterState] Initialization failed:", error);
            throw error;
        }
    }

    /**
     * Initialize a specific component.
     *
     * @throws Error when the component-specific initializer fails.
     */
    async initializeComponent(componentName: ComponentName): Promise<void> {
        console.log(`[MasterState] Initializing ${componentName}...`);

        try {
            switch (componentName) {
                case "computed": {
                    await Promise.resolve(this.initializeComputedState());
                    break;
                }
                case "core": {
                    await Promise.resolve(this.initializeCoreState());
                    break;
                }
                case DEV_TOOLS_COMPONENT: {
                    await Promise.resolve(this.initializeDevTools());
                    break;
                }
                case "fitFile": {
                    await Promise.resolve(this.initializeFitFileComponents());
                    break;
                }
                case "integration": {
                    await Promise.resolve(
                        this.initializeIntegrationComponents()
                    );
                    break;
                }
                case "middleware": {
                    await Promise.resolve(this.initializeMiddleware());
                    break;
                }
                case "renderer": {
                    await Promise.resolve(this.initializeRendererComponents());
                    break;
                }
                case "settings": {
                    await Promise.resolve(this.initializeSettings());
                    break;
                }
                case "tabs": {
                    await Promise.resolve(this.initializeTabComponents());
                    break;
                }
                case "ui": {
                    await Promise.resolve(this.initializeUIComponents());
                    break;
                }
                default: {
                    throw new Error("[MasterState] Unknown component");
                }
            }

            this.components.set(componentName, {
                initialized: true,
                timestamp: masterStateRuntime().dateNow(),
            });
            console.log(
                `[MasterState] ${componentName} initialized successfully`
            );
        } catch (error) {
            console.error(
                `[MasterState] Failed to initialize ${componentName}:`,
                error
            );
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown initialization error";
            this.components.set(componentName, {
                error: errorMessage,
                initialized: false,
            });
            throw error;
        }
    }

    /**
     * Initialize computed state system
     */
    initializeComputedState() {
        console.log("[MasterState] Initializing computed state system...");
        const {
            initializeCommonComputedValues: dynInitComputed,
            computedStateManager: dynComputed,
        } = getComputedStateModule();
        dynInitComputed();
        this.components.set("computed", dynComputed);
    }

    async initializeCoreState() {
        // Resolve state API dynamically in tests (module cache injection) while
        // preserving direct imports for production/runtime
        const stateAPI = getStateManagerAPI();
        // Initialize the complete state system
        const { initializeCompleteStateSystem: dynInitIntegration } =
            getStateIntegrationModule();
        await Promise.resolve(dynInitIntegration());

        // Determine app version with a robust fallback that works in tests
        // Prefer Electron-provided API if available; otherwise use known package version
        let appVersion = "26.5.0"; // Fallback to current package version for deterministic tests
        try {
            const electronAPI = this.getMasterElectronAPI();
            if (
                electronAPI &&
                typeof electronAPI.getAppVersion === "function"
            ) {
                const ver = await electronAPI.getAppVersion();
                if (typeof ver === "string" && ver) {
                    appVersion = ver;
                }
            }
        } catch {
            console.warn(
                "[MasterState] Could not read app version, using fallback"
            );
        }

        // Set initial application state
        stateAPI.setState("system.version", appVersion, {
            source: "MasterStateManager",
        });
        stateAPI.setState("system.startupTime", masterStateRuntime().dateNow(), {
            source: "MasterStateManager",
        });

        // Detect mode without using process (not available in renderer)
        const mode = this.isDevelopmentMode() ? "development" : "production";
        stateAPI.setState("system.mode", mode, {
            source: "MasterStateManager",
        });
    }

    /**
     * Initialize development tools
     */
    initializeDevTools() {
        console.log("[MasterState] Initializing development tools...");
        const isDevelopment = this.isDevelopmentMode();
        if (isDevelopment) {
            const { initializeStateDevTools: dynInitDevTools } =
                getStateDevToolsModule();
            dynInitDevTools();
        }
        this.components.set(DEV_TOOLS_COMPONENT, isDevelopment);
    }

    /**
     * Initialize FIT file components.
     *
     * @throws Error when the FIT file state manager is unavailable.
     */
    initializeFitFileComponents() {
        const mocked = getModuleExportsFromOverride(
            "/utils/state/domain/fitfilestate.js"
        );
        if (mocked && !mocked["fitFileStateManager"]) {
            // When tests inject a mocked module without a manager, throw as expected
            throw new Error("FIT file state manager not available");
        }
        // Fallback to real import when no mock module is present
        if (!fitFileStateManager) {
            throw new Error("FIT file state manager not available");
        }
    }

    /**
     * Initialize integration components
     */
    initializeIntegrationComponents() {
        // Set up window event listeners
        this.setupWindowEventListeners();

        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Set up drag and drop
        this.setupDragAndDrop();
    }

    /**
     * Initialize middleware system
     */
    initializeMiddleware() {
        console.log("[MasterState] Initializing middleware system...");
        const { initializeDefaultMiddleware: dynInitMiddleware } =
            getStateMiddlewareModule();
        dynInitMiddleware();
        this.components.set("middleware", true);
    }

    /**
     * Initialize renderer components
     */
    initializeRendererComponents() {
        const { initializeRendererStateBindings: dynInitRenderer } =
            getRendererStateBindingsModule();
        dynInitRenderer();
    }

    /**
     * Initialize settings state manager
     */
    async initializeSettings() {
        console.log("[MasterState] Initializing settings state manager...");
        const { settingsStateManager: dynSettings } = getSettingsStateModule();
        await dynSettings.initialize?.();
        this.components.set("settings", dynSettings);
    }

    /**
     * Initialize tab-related components
     */
    initializeTabComponents() {
        const { initializeTabButtonState: dynInitTabs } =
            getEnableTabButtonsModule();
        const { initializeActiveTabState: dynInitActiveTab } =
            getUpdateActiveTabModule();
        const { initializeTabVisibilityState: dynInitTabVisibility } =
            getUpdateTabVisibilityModule();
        dynInitTabs();
        dynInitActiveTab();
        dynInitTabVisibility();
    }

    /**
     * Initialize UI components
     */
    initializeUIComponents() {
        const { initializeControlsState: dynInitControls } =
            getControlsHelperModule();
        dynInitControls();

        // Set up theme initialization
        const savedThemeRaw =
            stateStorageRuntime().getItem("ffv-theme") ||
            stateStorageRuntime().getItem("fitFileViewer_theme") ||
            "system";

        // Canonicalize theme values for UI state:
        // - persisted: "auto" (theme core)
        // - UI/state layer historically: "system"
        const savedTheme = savedThemeRaw === "auto" ? "system" : savedThemeRaw;
        const { UIActions: dynUI } = getUIStateModule();
        dynUI.setTheme(savedTheme);
    }

    /**
     * Detects if the application is running in development mode.
     */
    isDevelopmentMode() {
        try {
            return masterStateRuntime().isDevelopmentScope({
                electronDevMode: this.getElectronDevelopmentFlag(),
                hasDevelopmentModeAttribute: hasDevelopmentModeAttribute(),
            });
        } catch {
            return false;
        }
    }

    /**
     * Reinitialize a specific component.
     */
    async reinitializeComponent(componentName: ComponentName): Promise<void> {
        console.log(`[MasterState] Reinitializing ${componentName}...`);

        // Mark as not initialized
        this.components.delete(componentName);

        // Reinitialize
        await this.initializeComponent(componentName);
    }

    /**
     * Set up drag and drop functionality
     */
    setupDragAndDrop() {
        const { signal } = this.eventController;

        // Prevent default drag behaviors
        for (const eventName of [
            "dragenter",
            "dragover",
            "dragleave",
            "drop",
        ] as const) {
            masterStateRuntime().addDocumentEventListener(
                eventName,
                preventDragDefaults,
                { signal }
            );
        }

        // Highlight drop area
        for (const eventName of ["dragenter", "dragover"] as const) {
            masterStateRuntime().addDocumentEventListener(
                eventName,
                highlightDropTarget,
                { signal }
            );
        }

        for (const eventName of ["dragleave", "drop"] as const) {
            masterStateRuntime().addDocumentEventListener(
                eventName,
                unhighlightDropTarget,
                { signal }
            );
        }

        // Handle dropped files
        masterStateRuntime().addDocumentEventListener(
            "drop",
            handleFitFileDrop,
            { signal }
        );

        console.log("[MasterState] Drag and drop set up");
    }

    /**
     * Set up error handling
     */
    setupErrorHandling() {
        const { signal } = this.eventController;

        // Resolve state API dynamically in handlers to respect test-time mocks
        // Global error handler
        masterStateRuntime().addGlobalEventListener(
            "error",
            (event) => {
                const stateAPI = getStateManagerAPI();
                const errorDetails = getErrorDetails(event.error);
                stateAPI.setState(
                    "system.lastError",
                    {
                        colno: event.colno,
                        filename: event.filename,
                        lineno: event.lineno,
                        message: errorDetails.message,
                        stack: errorDetails.stack,
                        timestamp: masterStateRuntime().dateNow(),
                    },
                    { source: "globalErrorHandler" }
                );

                console.error(
                    "[MasterState] Global error caught:",
                    event.error
                );
            },
            { signal }
        );

        // Unhandled promise rejection handler
        masterStateRuntime().addGlobalEventListener(
            "unhandledrejection",
            (event) => {
                const stateAPI = getStateManagerAPI();
                const errorDetails = getErrorDetails(event.reason);
                stateAPI.setState(
                    "system.lastPromiseRejection",
                    {
                        reason: errorDetails.message,
                        timestamp: masterStateRuntime().dateNow(),
                    },
                    { source: "promiseRejectionHandler" }
                );

                console.error(
                    "[MasterState] Unhandled promise rejection:",
                    event.reason
                );
            },
            { signal }
        );

        console.log("[MasterState] Error handling set up");
    }

    /**
     * Set up integrations between components
     */
    setupIntegrations() {
        const stateAPI = getStateManagerAPI();
        // Integrate file operations with UI state
        stateAPI.subscribe("fitFile.rawData", (data: unknown) => {
            if (data) {
                // Enable tabs when data is loaded
                const { UIActions: dynUI } = getUIStateModule();
                dynUI.showTab("summary");
            } else {
                // Disable tabs when no data
                const { UIActions: dynUI } = getUIStateModule();
                dynUI.showTab("summary");
            }
        });

        // Integrate loading state with UI
        stateAPI.subscribe("isLoading", (isLoading: unknown) => {
            // Update UI elements based on loading state
            const elements =
                masterStateRuntime().getLoadingSensitiveElements();
            for (const el of elements) {
                const isLoadingActive = Boolean(isLoading);
                el.style.pointerEvents = isLoadingActive ? "none" : "auto";
                el.style.opacity = isLoadingActive ? "0.5" : "1";
            }
        });

        // Integrate theme changes with maps and charts
        stateAPI.subscribe("ui.theme", (theme: unknown) => {
            // Notify other components about theme changes
            masterStateRuntime().dispatchGlobalEvent(
                new CustomEvent("themeChanged", { detail: { theme } })
            );
        });

        console.log("[MasterState] Component integrations set up");
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const { signal } = this.eventController;

        masterStateRuntime().addDocumentEventListener(
            "keydown",
            (event) => {
                const stateAPI = getStateManagerAPI();
                // Ctrl/Cmd + O - Open file
                if ((event.ctrlKey || event.metaKey) && event.key === "o") {
                    event.preventDefault();
                    void this.getMasterElectronAPI()?.openFileDialog?.();
                }

                // Ctrl/Cmd + T - Toggle theme
                if ((event.ctrlKey || event.metaKey) && event.key === "t") {
                    event.preventDefault();
                    const currentTheme = stateAPI.getState("ui.theme"),
                        newTheme = currentTheme === "light" ? "dark" : "light";
                    const { UIActions: dynUI } = getUIStateModule();
                    dynUI.setTheme(newTheme);
                }

                // Ctrl/Cmd + 1-4 - Switch tabs
                if (
                    (event.ctrlKey || event.metaKey) &&
                    event.key >= "1" &&
                    event.key <= "4"
                ) {
                    event.preventDefault();
                    const tabIndex = Number.parseInt(event.key, 10) - 1,
                        tabNames = [
                            "summary",
                            "chart",
                            "map",
                            "data",
                        ];
                    if (tabNames[tabIndex] && AppSelectors.hasData()) {
                        const {
                            AppActions: dynAppActions,
                            AppSelectors: dynAppSelectors,
                        } = getAppLifecycleModule();
                        if (dynAppSelectors.hasData()) {
                            dynAppActions.switchTab(tabNames[tabIndex]);
                        }
                    }
                }
            },
            { signal }
        );

        console.log("[MasterState] Keyboard shortcuts set up");
    }

    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        if (this.performanceMonitorInterval !== null) {
            clearInterval(this.performanceMonitorInterval);
        }

        // Monitor state change frequency
        let lastResetTime = masterStateRuntime().dateNow(),
            stateChangeCount = 0;

        if (this.performanceMonitorUnsubscribe !== null) {
            this.performanceMonitorUnsubscribe();
            this.performanceMonitorUnsubscribe = null;
        }

        const stateAPI = getStateManagerAPI();
        this.performanceMonitorUnsubscribe = stateAPI.subscribe("", () => {
            stateChangeCount += 1;
        });

        // Reset counter every minute
        this.performanceMonitorInterval = setInterval(() => {
            const now = masterStateRuntime().dateNow(),
                elapsed = now - lastResetTime;

            const performanceMemory = (performance as PerformanceWithMemory)
                .memory;
            stateAPI.setState(
                "system.performance",
                {
                    memoryUsage: performanceMemory
                        ? {
                              total: Math.round(
                                  performanceMemory.totalJSHeapSize /
                                      1024 /
                                      1024
                              ),
                              used: Math.round(
                                  performanceMemory.usedJSHeapSize / 1024 / 1024
                              ),
                          }
                        : null,
                    stateChangesPerMinute:
                        elapsed > 0
                            ? Math.round((stateChangeCount * 60_000) / elapsed)
                            : 0,
                    timestamp: now,
                },
                { source: "performanceMonitor" }
            );

            stateChangeCount = 0;
            lastResetTime = now;
        }, 60_000);

        console.log("[MasterState] Performance monitoring set up");
    }

    /**
     * Set up window event listeners
     */
    setupWindowEventListeners() {
        const { signal } = this.eventController;

        // Window resize
        masterStateRuntime().addWindowEventListener(
            "resize",
            () => {
                const { UIActions: dynUI } = getUIStateModule();
                dynUI.updateWindowState();
            },
            { signal }
        );

        // Window focus/blur
        masterStateRuntime().addWindowEventListener(
            "focus",
            () => {
                const stateAPI = getStateManagerAPI();
                stateAPI.setState("ui.windowFocused", true, {
                    source: "windowEventListener",
                });
            },
            { signal }
        );

        masterStateRuntime().addWindowEventListener(
            "blur",
            () => {
                const stateAPI = getStateManagerAPI();
                stateAPI.setState("ui.windowFocused", false, {
                    source: "windowEventListener",
                });
            },
            { signal }
        );

        // Before unload
        masterStateRuntime().addWindowEventListener(
            "beforeunload",
            () => {
                const stateAPI = getStateManagerAPI();
                stateAPI.setState("system.unloading", true, {
                    source: "windowEventListener",
                });
            },
            { signal }
        );
    }
}

/** Global master state manager singleton. */
export const masterStateManager = new MasterStateManager();

/**
 * Get master state manager instance.
 */
export function getMasterStateManager() {
    return masterStateManager;
}

/**
 * Initialize the complete FitFileViewer state system Call this once during
 * application startup
 */
export async function initializeFitFileViewerState() {
    await masterStateManager.initialize();
}

export function setMasterStateManagerModuleMocksForTests(
    mocks: Record<string, unknown> | null
): void {
    masterStateManagerModuleMocksForTests = mocks;
}

function getAppLifecycleModule() {
    const mocked = getModuleExportsFromOverride(
        "/utils/app/lifecycle/appactions.js"
    );
    if (mocked && mocked["AppActions"] && mocked["AppSelectors"]) {
        return mocked as {
            AppActions: typeof AppActions;
            AppSelectors: typeof AppSelectors;
        };
    }
    return { AppActions, AppSelectors };
}

function getComputedStateModule(): {
    computedStateManager: typeof computedStateManager;
    initializeCommonComputedValues: typeof initializeCommonComputedValues;
} {
    const mocked = getModuleExportsFromOverride(
        "/utils/state/core/computedstatemanager.js"
    );
    if (
        mocked &&
        (mocked["computedStateManager"] ||
            mocked["initializeCommonComputedValues"])
    )
        return mocked as {
            computedStateManager: typeof computedStateManager;
            initializeCommonComputedValues: typeof initializeCommonComputedValues;
        };
    return { computedStateManager, initializeCommonComputedValues };
}

function getControlsHelperModule(): {
    initializeControlsState: typeof initializeControlsState;
} {
    const mocked = getModuleExportsFromOverride(
        "/utils/rendering/helpers/updatecontrolsstate.js"
    );
    if (hasFunction(mocked, "initializeControlsState")) {
        return mocked;
    }
    return { initializeControlsState };
}

function getEnableTabButtonsModule(): {
    initializeTabButtonState: typeof initializeTabButtonState;
} {
    const mocked = getModuleExportsFromOverride(
        "/utils/ui/controls/enabletabbuttons.js"
    );
    if (hasFunction(mocked, "initializeTabButtonState")) {
        return mocked;
    }
    return { initializeTabButtonState };
}

// Generic helper to read explicit test module overrides by path suffix.
function getModuleExportsFromOverride(
    pathSuffixLower: string
): DynamicModule | null {
    try {
        if (masterStateManagerModuleMocksForTests) {
            const key = Object.keys(masterStateManagerModuleMocksForTests).find(
                (p) =>
                    String(p)
                        .replaceAll("\\", "/")
                        .toLowerCase()
                        .endsWith(pathSuffixLower)
            );
            if (
                key &&
                isDynamicModule(masterStateManagerModuleMocksForTests[key])
            ) {
                return masterStateManagerModuleMocksForTests[key];
            }
        }
    } catch {
        // Ignore malformed test override maps.
    }
    return null;
}

// Dynamic module resolvers: prefer explicit test overrides, fallback to static imports.
function getRendererStateBindingsModule(): {
    initializeRendererStateBindings: typeof initializeRendererStateBindings;
} {
    const mocked = getModuleExportsFromOverride(
        "/utils/ui/rendererstatebindings.js"
    );
    if (hasFunction(mocked, "initializeRendererStateBindings")) {
        return mocked;
    }
    return { initializeRendererStateBindings };
}

function getSettingsStateModule(): {
    settingsStateManager: RuntimeSettingsStateManager;
} {
    const mocked = getModuleExportsFromOverride(
        "/utils/state/domain/settingsstatemanager.js"
    );
    if (mocked && mocked["settingsStateManager"]) {
        return mocked as { settingsStateManager: RuntimeSettingsStateManager };
    }
    return { settingsStateManager };
}

function getStateDevToolsModule(): {
    cleanupStateDevTools: typeof cleanupStateDevTools;
    initializeStateDevTools: typeof initializeStateDevTools;
} {
    const mocked = getModuleExportsFromOverride(
        "/utils/debug/statedevtools.js"
    );
    if (
        mocked &&
        (mocked["initializeStateDevTools"] || mocked["cleanupStateDevTools"])
    )
        return mocked as {
            cleanupStateDevTools: typeof cleanupStateDevTools;
            initializeStateDevTools: typeof initializeStateDevTools;
        };
    return { initializeStateDevTools, cleanupStateDevTools };
}

function getStateIntegrationModule(): {
    initializeCompleteStateSystem: typeof initializeCompleteStateSystem;
} {
    const mocked = getModuleExportsFromOverride(
        "/utils/state/integration/stateintegration.js"
    );
    if (hasFunction(mocked, "initializeCompleteStateSystem")) {
        return mocked;
    }
    return { initializeCompleteStateSystem };
}

function getDefaultStateManagerApi(): StateManagerApi {
    return { getState, getStateHistory, getSubscriptions, setState, subscribe };
}

function getStateManagerAPI(): StateManagerApi {
    try {
        const mocked = getModuleExportsFromOverride(
            "/utils/state/core/statemanager.js"
        );
        if (isStateManagerApi(mocked)) {
            return mocked;
        }
    } catch {
        // Ignore malformed test overrides.
    }
    return getDefaultStateManagerApi();
}

function getStateMiddlewareModule(): {
    cleanupMiddleware: typeof cleanupMiddleware;
    initializeDefaultMiddleware: typeof initializeDefaultMiddleware;
} {
    const mocked = getModuleExportsFromOverride(
        "/utils/state/core/statemiddleware.js"
    );
    if (
        mocked &&
        (mocked["cleanupMiddleware"] || mocked["initializeDefaultMiddleware"])
    )
        return mocked as {
            cleanupMiddleware: typeof cleanupMiddleware;
            initializeDefaultMiddleware: typeof initializeDefaultMiddleware;
        };
    return { cleanupMiddleware, initializeDefaultMiddleware };
}

function getUIStateModule(): {
    UIActions: typeof UIActions;
} {
    const mocked = getModuleExportsFromOverride(
        "/utils/state/domain/uistatemanager.js"
    );
    if (mocked && mocked["UIActions"]) {
        return mocked as { UIActions: typeof UIActions };
    }
    return { UIActions };
}

function getUpdateActiveTabModule(): {
    initializeActiveTabState: typeof initializeActiveTabState;
} {
    const mocked =
        getModuleExportsFromOverride("/utils/ui/tabs/activetab.js") ||
        getModuleExportsFromOverride("/utils/ui/tabs/updateactivetab.js");
    if (hasFunction(mocked, "initializeActiveTabState")) {
        return mocked;
    }
    return { initializeActiveTabState };
}

function getUpdateTabVisibilityModule(): {
    initializeTabVisibilityState: typeof initializeTabVisibilityState;
} {
    const mocked = getModuleExportsFromOverride(
        "/utils/ui/tabs/updatetabvisibility.js"
    );
    if (hasFunction(mocked, "initializeTabVisibilityState")) {
        return mocked;
    }
    return { initializeTabVisibilityState };
}
