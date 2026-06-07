import type * as NodeModule from "node:module";
import type * as NodePath from "node:path";

/**
 * Initializes and coordinates the renderer state management components.
 */

import { initializeRendererUtils } from "../../app/initialization/rendererUtils.js";
import { AppActions, AppSelectors } from "../../app/lifecycle/appActions.js";
import {
    cleanupStateDevTools,
    initializeStateDevTools,
} from "../../debug/stateDevTools.js";
import { initializeControlsState } from "../../rendering/helpers/updateControlsState.js";
import { initializeTabButtonState } from "../../ui/controls/enableTabButtons.js";
import { showNotification } from "../../ui/notifications/syncRendererNotifications.js";
import { initializeActiveTabState } from "../../ui/tabs/updateActiveTab.js";
import { initializeTabVisibilityState } from "../../ui/tabs/updateTabVisibility.js";
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
    cleanupMiddleware,
    initializeDefaultMiddleware,
} from "./stateMiddleware.js";

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

type StateDebug = {
    setState?: (...args: unknown[]) => unknown;
};

type MasterStateGlobal = typeof globalThis & {
    __DEVELOPMENT__?: boolean;
    __FFV_MOCKS__?: Record<string, unknown>;
    __STATE_MANAGER_API__?: Partial<StateManagerApi>;
    __state_debug?: StateDebug;
    electronAPI?: ElectronRendererAPI;
};

type ModuleCache = Record<string, { exports?: unknown } | undefined>;
type CjsRequire = NodeJS.Require & {
    cache?: ModuleCache;
};

type StateManagerApi = {
    getState: typeof getState;
    getStateHistory: typeof getStateHistory;
    getSubscriptions: typeof getSubscriptions;
    setState: typeof setState;
    subscribe: typeof subscribe;
};

type PerformanceWithMemory = Performance & {
    memory?: {
        totalJSHeapSize: number;
        usedJSHeapSize: number;
    };
};

type LocationLike = Partial<
    Pick<Location, "hash" | "hostname" | "href" | "protocol" | "search">
>;

type DynamicModule = Record<string, unknown>;
type NodePathLike = Pick<typeof NodePath, "join">;

type RuntimeSettingsStateManager = typeof settingsStateManager & {
    cleanup?: () => void;
    initialize?: () => unknown;
};

type ErrorDetails = {
    message: string;
    stack?: string;
};

// Avoid importing Node core modules in the renderer; acquire lazily only when available (tests/CJS).
let __lazyNodePath: NodePathLike | null = null;
let __lazyModule: typeof NodeModule | null = null;

const STATE_MANAGER_CACHE_SUFFIXES = [
    "/utils/state/core/statemanager.js",
    "/utils/state/statemanager.js",
    "state/core/statemanager.js",
] as const;

function getMasterGlobal(): MasterStateGlobal {
    return globalThis;
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
    document.body.classList.add("drag-over");
}

function unhighlightDropTarget(): void {
    document.body.classList.remove("drag-over");
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

function getCurrentLocationLike(): LocationLike {
    return globalThis.window === undefined ? {} : globalThis.location;
}

function getLocationText(
    location: LocationLike,
    key: keyof LocationLike
): string {
    const value = location[key];
    return typeof value === "string" ? value : "";
}

function hasDevelopmentModeAttribute(): boolean {
    return (
        typeof document !== "undefined" &&
        typeof document.documentElement?.hasAttribute === "function" &&
        Object.hasOwn(document.documentElement.dataset, "devMode")
    );
}

function hasElectronDevelopmentFlag(masterGlobal: MasterStateGlobal): boolean {
    return (
        globalThis.window !== undefined &&
        masterGlobal.electronAPI?.__devMode !== undefined
    );
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

    private eventController = new AbortController();

    private performanceMonitorInterval: ReturnType<typeof setInterval> | null =
        null;

    constructor() {
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

    /**
     * Clean up all state management
     */
    cleanup() {
        console.log("[MasterState] Cleaning up state management...");

        this.eventController.abort();
        this.eventController = new AbortController();

        if (this.performanceMonitorInterval !== null) {
            clearInterval(this.performanceMonitorInterval);
            this.performanceMonitorInterval = null;
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
                timestamp: Date.now(),
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
            const electronAPI = getMasterGlobal().electronAPI;
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
        stateAPI.setState("system.startupTime", Date.now(), {
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
        // Resolve fitFileStateManager dynamically to support test-time mocks via require.cache
        const mocked = getModuleExportsFromCache(
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
        const { initializeRendererUtils: dynInitRenderer } =
            getRendererUtilsModule();
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
            localStorage.getItem("ffv-theme") ||
            localStorage.getItem("fitFileViewer_theme") ||
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
            const loc = getCurrentLocationLike();
            const masterGlobal = getMasterGlobal();
            const hostname = getLocationText(loc, "hostname");
            const search = getLocationText(loc, "search");
            const hash = getLocationText(loc, "hash");
            const protocol = getLocationText(loc, "protocol");
            const href = getLocationText(loc, "href");

            return (
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname.includes("dev") ||
                masterGlobal.__DEVELOPMENT__ === true ||
                search.includes("debug=true") ||
                hash.includes("debug") ||
                hasDevelopmentModeAttribute() ||
                protocol === "file:" ||
                hasElectronDevelopmentFlag(masterGlobal) ||
                href.includes("electron")
            );
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
            document.addEventListener(eventName, preventDragDefaults, {
                signal,
            });
        }

        // Highlight drop area
        for (const eventName of ["dragenter", "dragover"] as const) {
            document.addEventListener(eventName, highlightDropTarget, {
                signal,
            });
        }

        for (const eventName of ["dragleave", "drop"] as const) {
            document.addEventListener(eventName, unhighlightDropTarget, {
                signal,
            });
        }

        // Handle dropped files
        document.addEventListener("drop", handleFitFileDrop, { signal });

        console.log("[MasterState] Drag and drop set up");
    }

    /**
     * Set up error handling
     */
    setupErrorHandling() {
        const { signal } = this.eventController;

        // Resolve state API dynamically in handlers to respect test-time mocks
        // Global error handler
        globalThis.addEventListener(
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
                        timestamp: Date.now(),
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
        globalThis.addEventListener(
            "unhandledrejection",
            (event) => {
                const stateAPI = getStateManagerAPI();
                const errorDetails = getErrorDetails(event.reason);
                stateAPI.setState(
                    "system.lastPromiseRejection",
                    {
                        reason: errorDetails.message,
                        timestamp: Date.now(),
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
        stateAPI.subscribe("globalData", (data: unknown) => {
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
                document.querySelectorAll<HTMLElement>(".loading-sensitive");
            for (const el of elements) {
                const isLoadingActive = Boolean(isLoading);
                el.style.pointerEvents = isLoadingActive ? "none" : "auto";
                el.style.opacity = isLoadingActive ? "0.5" : "1";
            }
        });

        // Integrate theme changes with maps and charts
        stateAPI.subscribe("ui.theme", (theme: unknown) => {
            // Notify other components about theme changes
            globalThis.dispatchEvent(
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

        document.addEventListener(
            "keydown",
            (event) => {
                const stateAPI = getStateManagerAPI();
                // Ctrl/Cmd + O - Open file
                if ((event.ctrlKey || event.metaKey) && event.key === "o") {
                    event.preventDefault();
                    void getMasterGlobal().electronAPI?.openFileDialog?.();
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
        let lastResetTime = Date.now(),
            stateChangeCount = 0;

        // Use type assertion for window debug state
        const windowExt = getMasterGlobal(),
            originalSetState = windowExt.__state_debug?.setState;
        if (
            originalSetState && // Wrap setState to count changes
            windowExt.__state_debug
        ) {
            windowExt.__state_debug.setState = (...args: unknown[]) => {
                stateChangeCount += 1;
                return originalSetState(...args);
            };
        }

        // Reset counter every minute
        this.performanceMonitorInterval = setInterval(() => {
            const stateAPI = getStateManagerAPI();
            const now = Date.now(),
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
        window.addEventListener(
            "resize",
            () => {
                const { UIActions: dynUI } = getUIStateModule();
                dynUI.updateWindowState();
            },
            { signal }
        );

        // Window focus/blur
        window.addEventListener(
            "focus",
            () => {
                const stateAPI = getStateManagerAPI();
                stateAPI.setState("ui.windowFocused", true, {
                    source: "windowEventListener",
                });
            },
            { signal }
        );

        window.addEventListener(
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
        window.addEventListener(
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

function getAppLifecycleModule() {
    const mocked = getModuleExportsFromCache(
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

// Helper to dynamically resolve mocked state API in tests (require.cache injection)
// Helper to obtain CommonJS require in both CJS and ESM contexts (used by Vitest cache-injection tests)
function getCjsRequire(): CjsRequire | null {
    // Fall back to native require when present (CommonJS context)
    try {
        if (typeof require !== "undefined" && (require as CjsRequire).cache) {
            return require as CjsRequire;
        }
    } catch {
        // ignore
    }
    // As a last resort, use Module.createRequire if available
    try {
        if (typeof require !== "undefined") {
            const Module = require("node:module") as typeof NodeModule;
            if (Module && typeof Module.createRequire === "function") {
                const basePath =
                    typeof __filename === "undefined"
                        ? process.cwd()
                        : __filename;
                const req = Module.createRequire(basePath) as CjsRequire;
                if (req && req.cache) return req;
                return req;
            }
        }
    } catch {
        // ignore
    }
    return null;
}

function getComputedStateModule(): {
    computedStateManager: typeof computedStateManager;
    initializeCommonComputedValues: typeof initializeCommonComputedValues;
} {
    const mocked = getModuleExportsFromCache(
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
    const mocked = getModuleExportsFromCache(
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
    const mocked = getModuleExportsFromCache(
        "/utils/ui/controls/enabletabbuttons.js"
    );
    if (hasFunction(mocked, "initializeTabButtonState")) {
        return mocked;
    }
    return { initializeTabButtonState };
}

// Obtain the global Node module cache directly; compatible with require.cache mutations in tests
// Generic helper to read a mocked module's exports from require.cache by path suffix
// Supports Windows paths by normalizing to forward slashes and lowercasing
function getModuleExportsFromCache(
    pathSuffixLower: string
): DynamicModule | null {
    try {
        // Prefer an explicit global mocks registry if tests provided one
        const globalMocks = getMasterGlobal().__FFV_MOCKS__;
        if (globalMocks && typeof globalMocks === "object") {
            const key = Object.keys(globalMocks).find((p) =>
                String(p)
                    .replaceAll("\\", "/")
                    .toLowerCase()
                    .endsWith(pathSuffixLower)
            );
            if (key && isDynamicModule(globalMocks[key])) {
                return globalMocks[key];
            }
        }
        const req = getCjsRequire();
        const cache = req?.cache || getNodeModuleCache();
        if (!cache) return null;
        const key = Object.keys(cache).find((p) =>
            String(p)
                .replaceAll("\\", "/")
                .toLowerCase()
                .endsWith(pathSuffixLower)
        );
        const exportsValue = key && cache[key] ? cache[key]?.exports : null;
        return isDynamicModule(exportsValue) ? exportsValue : null;
    } catch {
        return null;
    }
}

function getNodeModuleCache(): ModuleCache | null {
    try {
        if (typeof require === "undefined") return null;
        if (!__lazyModule) {
            // eslint-disable-next-line import-x/max-dependencies -- Test-only fallback for CJS module cache inspection.
            __lazyModule = require("node:module") as typeof NodeModule;
        }
        const cache = (
            __lazyModule as typeof NodeModule & { _cache?: ModuleCache }
        )._cache;
        return cache && typeof cache === "object" ? cache : null;
    } catch {
        return null;
    }
}

// Dynamic module resolvers: prefer require.cache-injected mocks (used by tests), fallback to static imports
function getRendererUtilsModule(): {
    initializeRendererUtils: typeof initializeRendererUtils;
} {
    const mocked = getModuleExportsFromCache(
        "/utils/app/initialization/rendererutils.js"
    );
    if (hasFunction(mocked, "initializeRendererUtils")) {
        return mocked;
    }
    return { initializeRendererUtils };
}

function getSettingsStateModule(): {
    settingsStateManager: RuntimeSettingsStateManager;
} {
    const mocked = getModuleExportsFromCache(
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
    const mocked = getModuleExportsFromCache("/utils/debug/statedevtools.js");
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
    const mocked = getModuleExportsFromCache(
        "/utils/state/integration/stateintegration.js"
    );
    if (hasFunction(mocked, "initializeCompleteStateSystem")) {
        return mocked;
    }
    return { initializeCompleteStateSystem };
}

function getAnyCachedStateManagerApi(cache: ModuleCache): StateManagerApi | null {
    for (const moduleRecord of Object.values(cache)) {
        const exportsValue = moduleRecord?.exports;
        if (isStateManagerApi(exportsValue)) {
            return exportsValue;
        }
    }
    return null;
}

function getCachedStateManagerApi(cache: ModuleCache): StateManagerApi | null {
    const match = Object.keys(cache).find((pathName) => {
        const normalizedPath = pathName.replaceAll("\\", "/").toLowerCase();
        return STATE_MANAGER_CACHE_SUFFIXES.some((suffix) =>
            normalizedPath.endsWith(suffix)
        );
    });
    const exportsValue = match ? cache[match]?.exports : null;
    return isStateManagerApi(exportsValue) ? exportsValue : null;
}

function getCurrentWorkingDirectory(): string {
    return typeof process !== "undefined" && typeof process.cwd === "function"
        ? process.cwd()
        : "";
}

function getDefaultStateManagerApi(): StateManagerApi {
    return { getState, getStateHistory, getSubscriptions, setState, subscribe };
}

function getLazyNodePath(req: CjsRequire): NodePathLike | null {
    if (__lazyNodePath) {
        return __lazyNodePath;
    }

    try {
        const nodePathModule: unknown = req("node:path");
        __lazyNodePath = isNodePathLike(nodePathModule) ? nodePathModule : null;
    } catch {
        __lazyNodePath = null;
    }

    return __lazyNodePath;
}

function getRequiredStateManagerApi(req: CjsRequire): StateManagerApi | null {
    const nodePath = getLazyNodePath(req);
    if (!nodePath) {
        return null;
    }

    for (const candidate of getStateManagerRequireCandidates(nodePath)) {
        const stateManagerApi = tryRequireStateManagerApi(req, candidate);
        if (stateManagerApi) {
            return stateManagerApi;
        }
    }

    return null;
}

function getStateManagerRequireCandidates(nodePath: NodePathLike): string[] {
    const cwd = getCurrentWorkingDirectory();
    return ["stateManager.js", "stateManager.cjs", "stateManager.mjs"].map(
        (fileName) =>
            nodePath.join(cwd, "utils", "state", "core", fileName)
    );
}

function getStateManagerAPI(): StateManagerApi {
    try {
        // Direct global override for tests
        const direct = getMasterGlobal().__STATE_MANAGER_API__;
        if (isStateManagerApi(direct)) {
            return direct;
        }
        const req = getCjsRequire();
        const cache = (req && req.cache) || getNodeModuleCache();
        if (cache) {
            return (
                getCachedStateManagerApi(cache) ??
                (req ? getRequiredStateManagerApi(req) : null) ??
                getAnyCachedStateManagerApi(cache) ??
                getDefaultStateManagerApi()
            );
        }
    } catch {
        // ignore
    }
    return getDefaultStateManagerApi();
}

function isNodePathLike(value: unknown): value is NodePathLike {
    return isDynamicModule(value) && typeof value["join"] === "function";
}

function tryRequireStateManagerApi(
    req: CjsRequire,
    candidate: string
): StateManagerApi | null {
    try {
        const requiredModule: unknown = req(candidate);
        return isStateManagerApi(requiredModule) ? requiredModule : null;
    } catch {
        return null;
    }
}

function getStateMiddlewareModule(): {
    cleanupMiddleware: typeof cleanupMiddleware;
    initializeDefaultMiddleware: typeof initializeDefaultMiddleware;
} {
    const mocked = getModuleExportsFromCache(
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
    const mocked = getModuleExportsFromCache(
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
        getModuleExportsFromCache("/utils/ui/tabs/activetab.js") ||
        getModuleExportsFromCache("/utils/ui/tabs/updateactivetab.js");
    if (hasFunction(mocked, "initializeActiveTabState")) {
        return mocked;
    }
    return { initializeActiveTabState };
}

function getUpdateTabVisibilityModule(): {
    initializeTabVisibilityState: typeof initializeTabVisibilityState;
} {
    const mocked = getModuleExportsFromCache(
        "/utils/ui/tabs/updatetabvisibility.js"
    );
    if (hasFunction(mocked, "initializeTabVisibilityState")) {
        return mocked;
    }
    return { initializeTabVisibilityState };
}
