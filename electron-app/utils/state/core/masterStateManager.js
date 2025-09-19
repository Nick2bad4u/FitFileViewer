/**
 * Master State Integration
 * Complete initialization and integration of all state management components
 */

/**
 * @typedef {Object} ComponentState
 * @property {boolean} initialized - Whether component is initialized
 * @property {number} [timestamp] - Initialization timestamp
 * @property {string} [error] - Error message if initialization failed
 */

/**
 * @typedef {Window & {
 *   __state_debug?: {setState?: Function},
 *   __DEVELOPMENT__?: boolean,
 *   electronAPI?: {
 *     __devMode?: boolean,
 *     openFileDialog?: Function,
 *     openFile?: Function
 *   }
 * }} ExtendedWindow
 */

import { initializeRendererUtils, showNotification } from "../../app/initialization/rendererUtils.js";
import { AppActions, AppSelectors } from "../../app/lifecycle/appActions.js";
import { cleanupStateDevTools, initializeStateDevTools } from "../../debug/stateDevTools.js";
import { initializeControlsState } from "../../rendering/helpers/updateControlsState.js";
import { initializeTabButtonState } from "../../ui/controls/enableTabButtons.js";
import { initializeActiveTabState } from "../../ui/tabs/updateActiveTab.js";
import { initializeTabVisibilityState } from "../../ui/tabs/updateTabVisibility.js";
import { fitFileStateManager } from "../domain/fitFileState.js";
import { settingsStateManager } from "../domain/settingsStateManager.js";
import { UIActions } from "../domain/uiStateManager.js";
import { initializeCompleteStateSystem } from "../integration/stateIntegration.js";
import { computedStateManager, initializeCommonComputedValues } from "./computedStateManager.js";
import { getState, setState, subscribe } from "./stateManager.js";
import { cleanupMiddleware, initializeDefaultMiddleware } from "./stateMiddleware.js";

/**
 * Master State Manager - orchestrates all state management components
 */
export class MasterStateManager {
    isInitialized = false;

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
            "devTools",
            "integration",
        ];
    }

    /**
     * Clean up all state management
     */
    cleanup() {
        console.log("[MasterState] Cleaning up state management...");

        // Clean up specific components
        if (this.components.has("settings")) {
            settingsStateManager.cleanup();
        }

        if (this.components.has("computed")) {
            computedStateManager.cleanup();
        }

        if (this.components.has("middleware")) {
            cleanupMiddleware();
        }

        if (this.components.has("devTools")) {
            cleanupStateDevTools();
        }

        // Clean up components
        this.components.clear();

        // Reset initialization flag
        this.isInitialized = false;

        setState("system.initialized", false, { source: "MasterStateManager.cleanup" });

        console.log("[MasterState] Cleanup completed");
    }

    /**
     * Initialize core state management
     */ /**
     * Get initialization status
     * @returns {Object} Status object
     */
    getInitializationStatus() {
        return {
            components: Object.fromEntries(this.components),
            isInitialized: this.isInitialized,
            systemState: {
                initialized: getState("system.initialized"),
                mode: getState("system.mode"),
                startupTime: getState("system.startupTime"),
                version: getState("system.version"),
            },
        };
    }

    /**
     * Initialize all state management components in proper order
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn("[MasterState] Already initialized");
            return;
        }

        console.log("[MasterState] Starting complete state system initialization...");

        try {
            // Initialize in dependency order
            for (const componentName of this.initializationOrder) {
                await this.initializeComponent(componentName);
            }

            // Set up cross-component integrations
            this.setupIntegrations();

            // Set up error handling
            this.setupErrorHandling();

            // Set up performance monitoring
            this.setupPerformanceMonitoring();

            this.isInitialized = true;
            setState("system.initialized", true, { source: "MasterStateManager" });

            console.log("[MasterState] Complete state system initialization completed successfully");
        } catch (error) {
            console.error("[MasterState] Initialization failed:", error);
            throw error;
        }
    }

    /**
     * Initialize a specific component
     * @param {string} componentName - Name of component to initialize
     */
    async initializeComponent(componentName) {
        console.log(`[MasterState] Initializing ${componentName}...`);

        try {
            switch (componentName) {
                case "computed": {
                    await this.initializeComputedState();
                    break;
                }
                case "core": {
                    await this.initializeCoreState();
                    break;
                }
                case "devTools": {
                    await this.initializeDevTools();
                    break;
                }
                case "fitFile": {
                    await this.initializeFitFileComponents();
                    break;
                }
                case "integration": {
                    await this.initializeIntegrationComponents();
                    break;
                }
                case "middleware": {
                    await this.initializeMiddleware();
                    break;
                }
                case "renderer": {
                    await this.initializeRendererComponents();
                    break;
                }
                case "settings": {
                    await this.initializeSettings();
                    break;
                }
                case "tabs": {
                    await this.initializeTabComponents();
                    break;
                }
                case "ui": {
                    await this.initializeUIComponents();
                    break;
                }
                default: {
                    console.warn(`[MasterState] Unknown component: ${componentName}`);
                }
            }

            this.components.set(componentName, { initialized: true, timestamp: Date.now() });
            console.log(`[MasterState] ${componentName} initialized successfully`);
        } catch (error) {
            console.error(`[MasterState] Failed to initialize ${componentName}:`, error);
            const errorMessage = error instanceof Error ? error.message : "Unknown initialization error";
            this.components.set(componentName, { error: errorMessage, initialized: false });
            throw error;
        }
    }

    /**
     * Initialize computed state system
     */
    async initializeComputedState() {
        console.log("[MasterState] Initializing computed state system...");
        initializeCommonComputedValues();
        this.components.set("computed", computedStateManager);
    }

    async initializeCoreState() {
        // Initialize the complete state system
        initializeCompleteStateSystem();

        // Set initial application state
        setState("system.version", "21.1.0", { source: "MasterStateManager" });
        setState("system.startupTime", Date.now(), { source: "MasterStateManager" });

        // Detect mode without using process (not available in renderer)
        const mode = this.isDevelopmentMode() ? "development" : "production";
        setState("system.mode", mode, { source: "MasterStateManager" });
    }

    /**
     * Initialize development tools
     */
    async initializeDevTools() {
        console.log("[MasterState] Initializing development tools...");
        const isDevelopment = this.isDevelopmentMode();
        if (isDevelopment) {
            initializeStateDevTools();
        }
        this.components.set("devTools", isDevelopment);
    }

    /**
     * Initialize FIT file components
     */
    async initializeFitFileComponents() {
        // FIT file state manager initializes itself
        // Just ensure it's ready
        if (!fitFileStateManager) {
            throw new Error("FIT file state manager not available");
        }
    }

    /**
     * Initialize integration components
     */
    async initializeIntegrationComponents() {
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
    async initializeMiddleware() {
        console.log("[MasterState] Initializing middleware system...");
        initializeDefaultMiddleware();
        this.components.set("middleware", true);
    }

    /**
     * Initialize renderer components
     */
    async initializeRendererComponents() {
        initializeRendererUtils();
    }

    /**
     * Initialize settings state manager
     */
    async initializeSettings() {
        console.log("[MasterState] Initializing settings state manager...");
        await settingsStateManager.initialize();
        this.components.set("settings", settingsStateManager);
    }

    /**
     * Initialize tab-related components
     */
    async initializeTabComponents() {
        initializeTabButtonState();
        initializeActiveTabState();
        initializeTabVisibilityState();
    }

    /**
     * Initialize UI components
     */
    async initializeUIComponents() {
        initializeControlsState();

        // Set up theme initialization
        const savedTheme = localStorage.getItem("fitFileViewer_theme") || "system";
        UIActions.setTheme(savedTheme);
    }

    /**
     * Detects if the application is running in development mode
     * @returns {boolean} True if in development mode
     */
    isDevelopmentMode() {
        try {
            // Safely access window/document properties (jsdom/tests can stub or omit parts)
            const loc = /** @type {any} */ (globalThis.window === undefined ? undefined : globalThis.location) || {};
            const hostname = typeof loc.hostname === "string" ? loc.hostname : "";
            const search = typeof loc.search === "string" ? loc.search : "";
            const hash = typeof loc.hash === "string" ? loc.hash : "";
            const protocol = typeof loc.protocol === "string" ? loc.protocol : "";
            const href = typeof loc.href === "string" ? loc.href : "";

            const hasDevAttr =
                (typeof document !== "undefined" &&
                    document.documentElement &&
                    typeof document.documentElement.hasAttribute === "function" &&
                    Object.hasOwn(document.documentElement.dataset, "devMode")) ||
                false;

            return (
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                (hostname && hostname.includes("dev")) ||
                /** @type {any} */ (globalThis).__DEVELOPMENT__ === true ||
                (search && search.includes("debug=true")) ||
                (hash && hash.includes("debug")) ||
                hasDevAttr ||
                protocol === "file:" ||
                (globalThis.window !== undefined &&
                    /** @type {any} */ (globalThis).electronAPI &&
                    (/** @type {any} */ (globalThis.electronAPI).__devMode) !== undefined) ||
                (typeof console !== "undefined" && typeof href === "string" && href.includes("electron"))
            );
        } catch {
            return false;
        }
    }

    /**
     * Reinitialize a specific component
     * @param {string} componentName - Component to reinitialize
     */
    async reinitializeComponent(componentName) {
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
        // Prevent default drag behaviors
        for (const eventName of ["dragenter", "dragover", "dragleave", "drop"]) {
            document.addEventListener(eventName, preventDefaults, false);
        }

        /** @param {Event} e */
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight drop area
        for (const eventName of ["dragenter", "dragover"]) {
            document.addEventListener(eventName, highlight, false);
        }

        for (const eventName of ["dragleave", "drop"]) {
            document.addEventListener(eventName, unhighlight, false);
        }

        function highlight() {
            document.body.classList.add("drag-over");
        }

        function unhighlight() {
            document.body.classList.remove("drag-over");
        }

        // Handle dropped files
        document.addEventListener("drop", handleDrop, false);

        /** @param {DragEvent} e */
        function handleDrop(e) {
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file && file.name.toLowerCase().endsWith(".fit")) {
                    // Handle FIT file drop - file.path not available in browser, use file object
                    showNotification("FIT file dropped", "info");
                } else {
                    showNotification("Please drop a .fit file", "warning");
                }
            }
        }

        console.log("[MasterState] Drag and drop set up");
    }

    /**
     * Set up error handling
     */
    setupErrorHandling() {
        // Global error handler
        globalThis.addEventListener("error", (event) => {
            setState(
                "system.lastError",
                {
                    colno: event.colno,
                    filename: event.filename,
                    lineno: event.lineno,
                    message: event.error?.message || "Unknown error",
                    stack: event.error?.stack,
                    timestamp: Date.now(),
                },
                { source: "globalErrorHandler" }
            );

            console.error("[MasterState] Global error caught:", event.error);
        });

        // Unhandled promise rejection handler
        globalThis.addEventListener("unhandledrejection", (event) => {
            setState(
                "system.lastPromiseRejection",
                {
                    reason: event.reason?.message || event.reason,
                    timestamp: Date.now(),
                },
                { source: "promiseRejectionHandler" }
            );

            console.error("[MasterState] Unhandled promise rejection:", event.reason);
        });

        console.log("[MasterState] Error handling set up");
    }

    /**
     * Set up integrations between components
     */
    setupIntegrations() {
        // Integrate file operations with UI state
        subscribe(
            "globalData",
            /** @param {*} data */ (data) => {
                if (data) {
                    // Enable tabs when data is loaded
                    UIActions.showTab("summary");
                } else {
                    // Disable tabs when no data
                    UIActions.showTab("summary");
                }
            }
        );

        // Integrate loading state with UI
        subscribe(
            "isLoading",
            /** @param {boolean} isLoading */ (isLoading) => {
                // Update UI elements based on loading state
                const elements = document.querySelectorAll(".loading-sensitive");
                for (const el of elements) {
                    /** @type {HTMLElement} */ (el).style.pointerEvents = isLoading ? "none" : "auto";
                    /** @type {HTMLElement} */ (el).style.opacity = isLoading ? "0.5" : "1";
                }
            }
        );

        // Integrate theme changes with maps and charts
        subscribe(
            "ui.theme",
            /** @param {string} theme */ (theme) => {
                // Notify other components about theme changes
                globalThis.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme } }));
            }
        );

        console.log("[MasterState] Component integrations set up");
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener("keydown", (event) => {
            // Ctrl/Cmd + O - Open file
            if ((event.ctrlKey || event.metaKey) && event.key === "o") {
                event.preventDefault();
                globalThis.electronAPI?.openFileDialog();
            }

            // Ctrl/Cmd + T - Toggle theme
            if ((event.ctrlKey || event.metaKey) && event.key === "t") {
                event.preventDefault();
                const currentTheme = getState("ui.theme"),
                    newTheme = currentTheme === "light" ? "dark" : "light";
                UIActions.setTheme(newTheme);
            }

            // Ctrl/Cmd + 1-4 - Switch tabs
            if ((event.ctrlKey || event.metaKey) && event.key >= "1" && event.key <= "4") {
                event.preventDefault();
                const tabIndex = Number.parseInt(event.key) - 1,
                    tabNames = ["summary", "chart", "map", "data"];
                if (tabNames[tabIndex] && AppSelectors.hasData()) {
                    AppActions.switchTab(tabNames[tabIndex]);
                }
            }
        });

        console.log("[MasterState] Keyboard shortcuts set up");
    } /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor state change frequency
        let lastResetTime = Date.now(),
            stateChangeCount = 0;

        // Use type assertion for window debug state
        const windowExt = /** @type {ExtendedWindow} */ (globalThis),
            originalSetState = windowExt.__state_debug?.setState;
        if (originalSetState && // Wrap setState to count changes
            windowExt.__state_debug) {
                windowExt.__state_debug.setState = /** @param {...*} args */ (...args) => {
                    stateChangeCount++;
                    return originalSetState(...args);
                };
            }

        // Reset counter every minute
        setInterval(() => {
            const now = Date.now(),
                elapsed = now - lastResetTime;

            setState(
                "system.performance",
                {
                    memoryUsage:
                        /** @type {Performance & {memory?: {usedJSHeapSize: number, totalJSHeapSize: number}}} */ (
                            performance
                        ).memory
                            ? {
                                  total: Math.round(
                                      /** @type {Performance & {memory: {totalJSHeapSize: number}}} */ (performance)
                                          .memory.totalJSHeapSize /
                                          1024 /
                                          1024
                                  ),
                                  used: Math.round(
                                      /** @type {Performance & {memory: {usedJSHeapSize: number}}} */ (performance)
                                          .memory.usedJSHeapSize /
                                          1024 /
                                          1024
                                  ),
                              }
                            : null,
                    stateChangesPerMinute: Math.round((stateChangeCount * 60_000) / elapsed),
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
        // Window resize
        window.addEventListener("resize", () => {
            UIActions.updateWindowState();
        });

        // Window focus/blur
        window.addEventListener("focus", () => {
            setState("ui.windowFocused", true, { source: "windowEventListener" });
        });

        window.addEventListener("blur", () => {
            setState("ui.windowFocused", false, { source: "windowEventListener" });
        });

        // Before unload
        window.addEventListener("beforeunload", () => {
            setState("system.unloading", true, { source: "windowEventListener" });
        });
    }
}

// Create and export global master state manager
export const masterStateManager = new MasterStateManager();

/**
 * Get master state manager instance
 * @returns {MasterStateManager} Master state manager
 */
export function getMasterStateManager() {
    return masterStateManager;
}

/**
 * Initialize the complete FitFileViewer state system
 * Call this once during application startup
 */
export async function initializeFitFileViewerState() {
    await masterStateManager.initialize();
}

// Export for convenience

export {AppActions, AppSelectors} from "../../app/lifecycle/appActions.js";
export {UIActions} from "../domain/uiStateManager.js";
