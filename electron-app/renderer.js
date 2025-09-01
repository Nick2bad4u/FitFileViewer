/**
 * @fileoverview Main renderer process entry point for FIT File Viewer
 * Handles application initialization, module loading, and event setup
 *
 * STATE MANAGEMENT MIGRATION:
 * This file has been updated to use the new centralized state management system.
 * The legacy appState object is maintained for backward compatibility but now
 * proxies to the new state manager. Key changes:
 *
 * 1. Imports masterStateManager, appActions, and uiStateManager
 * 2. Initializes state management system before other components
 * 3. Uses appActions.setInitialized() instead of direct state mutation
 * 4. Uses showNotification() for consistent UI notifications
 * 5. Exposes state debugging utilities in development mode
 *
 * Legacy components will continue to work through the appState proxy and
 * isOpeningFileRef, but new code should use the state manager directly.
 *
 * @version 21.1.0
 */

// ==========================================
// Window Extensions for TypeScript
// ==========================================

/**
 * @typedef {Object} WindowExtensions
 * @property {boolean} [__DEVELOPMENT__] - Development mode flag
 * @property {Function} [createExportGPXButton] - Export GPX button creator
 * @property {Object} [APP_INFO] - Application information
 * @property {Object} [__renderer_debug] - Renderer debug utilities
 * @property {Object} [__renderer_dev] - Renderer development utilities
 * @property {Object} [__sensorDebug] - Sensor debug utilities
 * @property {Object} [__debugChartFormatting] - Chart formatting debug utilities
 */

/**
 * @typedef {Object} ElectronAPIExtensions
 * @property {boolean} [__devMode] - Development mode flag in electron API
 */

/**
 * @typedef {Object} PerformanceExtended
 * @property {Object} [memory] - Memory usage information
 * @property {number} [memory.usedJSHeapSize] - Used JS heap size
 * @property {number} [memory.totalJSHeapSize] - Total JS heap size
 * @property {number} [memory.jsHeapSizeLimit] - JS heap size limit
 */

/**
 * @typedef {Object} MasterStateManagerExtended
 * @property {Function} getState - Get current state
 * @property {Function} getHistory - Get state history
 */

// In electron-app/renderer.js

// ==========================================
// Type Definitions (JSDoc)
// ==========================================

/**
 * @typedef {Object} RendererDependencies
 * @property {HTMLElement | null} openFileBtn - Open file button element
 * @property {{value: boolean}} isOpeningFileRef - Reference to             // Expose formatting test utilities globally
            window.__debugChartFormatting = {
                testNewFormatting,
                testFaveroCase,
                testFaveroStringCase
            }; file opening state
 * @property {Function} setLoading - Function to show/hide loading state
 * @property {Function} showNotification - Function to display notifications
 * @property {Function} handleOpenFile - Function to handle file opening
 * @property {Function} showUpdateNotification - Function to show update notifications
 * @property {Function} showAboutModal - Function to display about modal
 * @property {Function} applyTheme - Function to apply theme changes
 * @property {Function} listenForThemeChange - Function to listen for theme changes
 */

// ==========================================
// Utility Imports & Fallbacks
// ==========================================

import { showNotification } from "./utils/ui/notifications/showNotification.js";
import { handleOpenFile } from "./utils/files/import/handleOpenFile.js";
import { setupTheme } from "./utils/theming/core/setupTheme.js";
import { showUpdateNotification } from "./utils/ui/notifications/showUpdateNotification.js";
import { setupListeners } from "./utils/app/lifecycle/listeners.js";
import { showAboutModal } from "./utils/ui/modals/aboutModal.js";
import { createExportGPXButton } from "./utils/files/export/createExportGPXButton.js";
import { applyTheme, listenForThemeChange } from "./utils/theming/core/theme.js";
import { setLoading } from "./utils/app/initialization/rendererUtils.js";
import { masterStateManager } from "./utils/state/core/masterStateManager.js";
import { AppActions } from "./utils/app/lifecycle/appActions.js";
import { getState, subscribe } from "./utils/state/core/stateManager.js";
import { uiStateManager } from "./utils/state/domain/uiStateManager.js";

// ==========================================
// Environment Detection
// ==========================================

/**
 * Detects if the application is running in development mode
 * Since process is not available in renderer, we use alternative methods
 * @returns {boolean} True if in development mode
 */
function isDevelopmentMode() {
    // Check for development indicators
    return (
        // Check if localhost or dev domains
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.includes("dev") ||
        // Check for dev tools being open
        /** @type {any} */ (window).__DEVELOPMENT__ === true ||
        // Check for debug flag in URL
        window.location.search.includes("debug=true") ||
        // Check for development build indicators
        document.documentElement.hasAttribute("data-dev-mode") ||
        // Check if running from file:// protocol (dev mode indicator)
        window.location.protocol === "file:" ||
        // Check if electron dev tools are available
        (window.electronAPI && typeof (/** @type {any} */ (window.electronAPI).__devMode) !== "undefined") ||
        // Check console availability and development-specific globals
        (typeof console !== "undefined" && window.location.href.includes("electron"))
    );
}

/**
 * Gets the current environment name
 * @returns {string} Environment name
 */
function getEnvironment() {
    return isDevelopmentMode() ? "development" : "production";
}

// ==========================================
// Application State Management
// ==========================================

/**
 * Legacy state reference for backward compatibility
 * @deprecated Use masterStateManager instead
 * @type {any}
 */
let appState = /** @type {any} */ (null);

/**
 * Reference object for tracking file opening state (legacy compatibility)
 * @deprecated Use state manager instead
 * @type {{value: boolean}}
 */
const isOpeningFileRef = { value: false };

/**
 * Initialize the centralized state management system
 * @returns {Promise<void>}
 */
async function initializeStateManager() {
    try {
        console.log("[Renderer] Initializing state management system...");

        // Initialize the master state manager
        await masterStateManager.initialize();

        // Create legacy compatibility object
        appState = {
            get isInitialized() {
                return /** @type {any} */ (masterStateManager).getState().app.initialized;
            },
            set isInitialized(value) {
                AppActions.setInitialized(value);
            },
            get isOpeningFile() {
                return /** @type {any} */ (masterStateManager).getState().app.isOpeningFile;
            },
            set isOpeningFile(value) {
                AppActions.setFileOpening(value);
                isOpeningFileRef.value = value;
            },
            get startTime() {
                return getState("app.startTime");
            },
        };

        // Subscribe to state changes to update legacy reference
        subscribe(
            "app.isOpeningFile",
            /** @param {any} isOpening */ (isOpening) => {
                isOpeningFileRef.value = isOpening;
            }
        );

        console.log("[Renderer] State management system initialized");
    } catch (error) {
        console.error("[Renderer] Failed to initialize state manager:", error);
        // Fallback to legacy state object
        appState = {
            isInitialized: false,
            isOpeningFile: false,
            startTime: performance.now(),
        };
        throw error;
    }
}

// ==========================================
// Error Handling
// ==========================================

/**
 * Global error handler for unhandled promise rejections
 * @param {PromiseRejectionEvent} event - The unhandled rejection event
 */
function handleUnhandledRejection(event) {
    console.error("[Renderer] Unhandled promise rejection:", event.reason);

    try {
        // Use state manager if available, fallback to direct notification
        if (masterStateManager && masterStateManager.isInitialized) {
            showNotification(`Application error: ${event.reason?.message || "Unknown error"}`, "error", 5000);
        } else {
            showNotification(`Application error: ${event.reason?.message || "Unknown error"}`, "error", 5000);
        }
    } catch (notifyError) {
        console.error("[Renderer] Failed to show error notification:", notifyError);
    }

    // Prevent default browser behavior
    event.preventDefault();
}

/**
 * Global error handler for uncaught exceptions
 * @param {ErrorEvent} event - The error event
 */
function handleUncaughtError(event) {
    console.error("[Renderer] Uncaught error:", event.error);

    try {
        // Use state manager if available, fallback to direct notification
        if (masterStateManager && masterStateManager.isInitialized) {
            showNotification(`Critical error: ${event.error?.message || "Unknown error"}`, "error", 7000);
        } else {
            showNotification(`Critical error: ${event.error?.message || "Unknown error"}`, "error", 7000);
        }
    } catch (notifyError) {
        console.error("[Renderer] Failed to show error notification:", notifyError);
    }
}

// ==========================================
// DOM Ready & Initialization
// ==========================================

/**
 * Validates that required DOM elements exist
 * @returns {boolean} True if all required elements are present
 */
function validateDOMElements() {
    const requiredElements = [
        { id: "openFileBtn", name: "Open File button" },
        { id: "notification", name: "Notification container" },
        { id: "loadingOverlay", name: "Loading overlay" },
    ],

     missingElements = requiredElements.filter(({ id }) => !document.getElementById(id));

    if (missingElements.length > 0) {
        const missing = missingElements.map(({ name }) => name).join(", ");
        console.error("[Renderer] Missing required DOM elements:", missing);

        // Try to show notification even if notification element might be missing
        try {
            showNotification(`Critical: Missing UI elements: ${missing}`, "error", 10000);
        } catch (error) {
            console.error("[Renderer] Could not show notification:", error);
        }
        return false;
    }

    return true;
}

/**
 * Initializes the application after DOM is ready
 * @returns {Promise<void>}
 */
async function initializeApplication() {
    PerformanceMonitor.start("app_initialization");

    try {
        console.log("[Renderer] Starting application initialization...");

        // Initialize state management system first
        await initializeStateManager();

        // Validate DOM elements
        if (!validateDOMElements()) {
            throw new Error("Required DOM elements are missing");
        }

        // Get required DOM elements
        const openFileBtn = document.getElementById("openFileBtn");

        // Setup global error handlers
        window.addEventListener("unhandledrejection", handleUnhandledRejection);
        window.addEventListener("error", handleUncaughtError);

        // Create dependencies object for setup functions
        const dependencies = {
            openFileBtn,
            isOpeningFileRef,
            setLoading,
            showNotification,
            handleOpenFile,
            showUpdateNotification,
            showAboutModal,
            applyTheme,
            listenForThemeChange,
        };

        // Initialize core components
        if (dependencies.openFileBtn) {
            await initializeComponents(/** @type {any} */ (dependencies));
        } else {
            console.warn("[Renderer] Dependencies missing, initializing with fallbacks");
        }

        // Mark application as initialized using new state system
        AppActions.setInitialized(true);

        const initTime = PerformanceMonitor.end("app_initialization");
        console.log(`[Renderer] Application initialized successfully in ${initTime.toFixed(2)}ms`);

        // Show success notification for development
        if (isDevelopmentMode()) {
            showNotification(`App initialized in ${initTime.toFixed(0)}ms`, "success", 3000);
        }
    } catch (error) {
        PerformanceMonitor.end("app_initialization");
        console.error("[Renderer] Failed to initialize application:", error);

        // Use state manager for error notification
        showNotification(`Initialization failed: ${/** @type {Error} */ (error).message}`, "error", 10000);

        throw error;
    }
}

/**
 * Initializes all application components in proper order
 * @param {RendererDependencies} dependencies - Application dependencies
 * @returns {Promise<void>}
 */
async function initializeComponents(dependencies) {
    try {
        // 1. Setup theme system first (affects all UI)
        PerformanceMonitor.start("theme_setup");
        console.log("[Renderer] Setting up theme system...");
        setupTheme(dependencies.applyTheme, dependencies.listenForThemeChange);
        PerformanceMonitor.end("theme_setup");

        // 2. Setup event listeners
        PerformanceMonitor.start("listeners_setup");
        console.log("[Renderer] Setting up event listeners...");
        if (dependencies.openFileBtn) {
            setupListeners(/** @type {any} */ (dependencies));
        } else {
            console.warn("[Renderer] Open file button not found, skipping listener setup");
        }
        PerformanceMonitor.end("listeners_setup");

        // 3. Initialize any async components
        PerformanceMonitor.start("async_components");
        console.log("[Renderer] Initializing async components...");
        await initializeAsyncComponents();
        PerformanceMonitor.end("async_components");

        console.log("[Renderer] All components initialized successfully");
    } catch (error) {
        console.error("[Renderer] Component initialization failed:", error);
        throw error;
    }
}

/**
 * Initializes components that require async operations
 * @returns {Promise<void>}
 */
async function initializeAsyncComponents() {
    try {
        // Initialize recent files if available
        if (window.electronAPI?.recentFiles) {
            try {
                await window.electronAPI.recentFiles();
                console.log("[Renderer] Recent files API available");
            } catch (error) {
                console.warn("[Renderer] Recent files initialization failed:", error);
            }
        }

        // Check for updates if in production
        if (window.electronAPI?.checkForUpdates && !isDevelopmentMode()) {
            try {
                setTimeout(() => {
                    window.electronAPI.checkForUpdates();
                }, 5000); // Delay to avoid blocking startup
            } catch (error) {
                console.warn("[Renderer] Update check failed:", error);
            }
        }
    } catch (error) {
        console.warn("[Renderer] Some async components failed to initialize:", error);
        // Don't throw - these are non-critical
    }
}

// ==========================================
// Performance Monitoring
// ==========================================

/**
 * Performance monitoring utilities
 * @namespace PerformanceMonitor
 */
const PerformanceMonitor = {
    /**
     * Tracks performance metrics for the application
     * @type {Map<string, number>}
     */
    metrics: new Map(),

    /**
     * Starts timing an operation
     * @param {string} operation - Name of the operation to time
     */
    start(operation) {
        this.metrics.set(`${operation}_start`, performance.now());
    },

    /**
     * Ends timing an operation and logs the result
     * @param {string} operation - Name of the operation that finished
     * @returns {number} Duration in milliseconds
     */
    end(operation) {
        const startTime = this.metrics.get(`${operation}_start`);
        if (!startTime) {
            console.warn(`[Performance] No start time found for operation: ${operation}`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.metrics.set(operation, duration);

        if (isDevelopmentMode()) {
            console.log(`[Performance] ${operation}: ${duration.toFixed(2)}ms`);
        }

        return duration;
    },

    /**
     * Gets all recorded metrics
     * @returns {Object} Object containing all metrics
     */
    getMetrics() {
        /** @type {any} */
        const result = {};
        for (const [key, value] of this.metrics) {
            if (!key.endsWith("_start")) {
                result[key] = value;
            }
        }
        return result;
    },
},

// ==========================================
// Application Information
// ==========================================

// ==========================================
// Application Information
// ==========================================

/**
 * Application metadata and version information
 * @constant {Object}
 */
 APP_INFO = {
    name: "FIT File Viewer",
    version: "21.1.0",
    description: "Advanced FIT file analysis and visualization tool",
    author: "FIT File Viewer Team",
    repository: "https://github.com/user/FitFileViewer",
    license: "MIT",

    /**
     * Gets runtime information about the application
     * @returns {Object} Runtime information
     */
    getRuntimeInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            hardwareConcurrency: navigator.hardwareConcurrency,
            memoryUsage: /** @type {any} */ (performance).memory
                ? {
                      usedJSHeapSize: /** @type {any} */ (performance).memory.usedJSHeapSize,
                      totalJSHeapSize: /** @type {any} */ (performance).memory.totalJSHeapSize,
                      jsHeapSizeLimit: /** @type {any} */ (performance).memory.jsHeapSizeLimit,
                  }
                : null,
        };
    },
};

// ==========================================
// Global API Exposure
// ==========================================

/**
 * Expose utilities to global scope for legacy compatibility
 * @global
 */
if (typeof window !== "undefined") {
    // Expose map utilities globally for chart and map components
    /** @type {any} */ (window).createExportGPXButton = createExportGPXButton;

    // Expose application information
    /** @type {any} */ (window).APP_INFO = APP_INFO;

    // Expose core utilities for debugging and legacy support
    if (isDevelopmentMode()) {
        /** @type {any} */ (window).__renderer_debug = {
            showNotification,
            handleOpenFile,
            setupTheme,
            showUpdateNotification,
            showAboutModal,
            PerformanceMonitor,
        };
    }
}

// Log application startup information
console.group("[Renderer] Application Startup");
console.log("App:", APP_INFO.name, `v${  APP_INFO.version}`);
console.log("Environment:", getEnvironment());
console.log("Runtime Info:", APP_INFO.getRuntimeInfo());
console.groupEnd();

// ==========================================
// Application Lifecycle
// ==========================================

/**
 * Cleanup function called before page unload
 */
function cleanup() {
    try {
        console.log("[Renderer] Performing cleanup...");

        // Remove global event listeners
        window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        window.removeEventListener("error", handleUncaughtError);

        // Reset application state using state manager
        if (masterStateManager.isInitialized) {
            AppActions.setInitialized(false);
            AppActions.setFileOpening(false);
            masterStateManager.cleanup();
        } else {
            // Fallback to legacy state reset
            if (appState) {
                appState.isInitialized = false;
                appState.isOpeningFile = false;
            }
            isOpeningFileRef.value = false;
        }

        console.log("[Renderer] Cleanup completed");
    } catch (error) {
        console.error("[Renderer] Cleanup failed:", error);
    }
}

// ==========================================
// Event Listeners & Startup
// ==========================================

// Setup page lifecycle events
window.addEventListener("beforeunload", cleanup);

// Start application when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApplication);
} else {
    // DOM already loaded
    setTimeout(initializeApplication, 0);
}

// ==========================================
// Development Utilities
// ==========================================

if (isDevelopmentMode()) {
    /**
     * Development utilities exposed to global scope
     * @global
     */
    /** @type {any} */ (window).__renderer_dev = {
        // Legacy state for compatibility
        appState,
        isOpeningFileRef,

        // New state management system
        stateManager: masterStateManager,
        AppActions,
        uiStateManager,

        // Performance and debugging
        PerformanceMonitor,
        APP_INFO,
        reinitialize: initializeApplication,
        cleanup,
        validateDOM: validateDOMElements,
        getPerformanceMetrics: () => PerformanceMonitor.getMetrics(),

        // State debugging helpers
        getState: () => /** @type {any} */ (masterStateManager).getState(),
        getStateHistory: () => /** @type {any} */ (masterStateManager).getHistory(),
        debugState: () => {
            console.log("Current State:", /** @type {any} */ (masterStateManager).getState());
            console.log("State History:", /** @type {any} */ (masterStateManager).getHistory());
            console.log("Active Subscriptions:", /** @type {any} */ (masterStateManager).getSubscriptions());
        },
    };

    // Load debug utilities asynchronously
    (async () => {
        try {
            const {
                debugSensorInfo,
                showSensorNames,
                testManufacturerId,
                testProductId,
                showDataKeys,
                checkDataAvailability,
            } = await import("./utils/debug/debugSensorInfo.js"),
             { testNewFormatting, testFaveroCase, testFaveroStringCase } = await import(
                "./utils/debug/debugChartFormatting.js"
            );

            // Expose sensor debug utilities globally
            /** @type {any} */ (window).__sensorDebug = {
                debugSensorInfo,
                showSensorNames,
                testManufacturerId,
                testProductId,
                showDataKeys,
                checkDataAvailability,
            };

            // Expose formatting test utilities globally
            /** @type {any} */ (window).__debugChartFormatting = {
                testNewFormatting,
                testFaveroCase,
                testFaveroStringCase,
            };

            console.log("🛠️  Debug utilities loaded!");
            console.log("📊 Sensor Debug Commands:");
            console.log("  __sensorDebug.checkDataAvailability()     - Check if FIT data is loaded");
            console.log("  __sensorDebug.debugSensorInfo()           - Full sensor analysis");
            console.log("  __sensorDebug.debugSensorInfo(true)       - Verbose sensor analysis");
            console.log("  __sensorDebug.showSensorNames()           - Quick sensor name list");
            console.log("  __sensorDebug.testManufacturerId(269)     - Test manufacturer ID (e.g., Favero)");
            console.log("  __sensorDebug.testProductId(269, 12)      - Test product ID (e.g., Favero assioma_duo)");
            console.log("  __sensorDebug.showDataKeys()              - Show all available data keys");
            console.log("");
            console.log("🧪 Format Testing Commands:");
            console.log("  __debugChartFormatting.testNewFormatting()      - Test all formatting scenarios");
            console.log("  __debugChartFormatting.testFaveroCase()         - Test the specific Favero case");
            console.log(
                "  __debugChartFormatting.testFaveroStringCase()   - Test Favero with string manufacturer name"
            );
            console.log("");
            console.log("🏗️  State Management Debug Commands:");
            console.log("  __renderer_dev.debugState()               - Show current state and history");
            console.log("  __renderer_dev.getState()                 - Get current application state");
            console.log("  __renderer_dev.getStateHistory()          - Get state change history");
            console.log("  __renderer_dev.stateManager               - Access state manager directly");
            console.log("  __renderer_dev.AppActions                 - Access app actions");
            console.log("  __renderer_dev.uiStateManager             - Access UI state manager");
        } catch (error) {
            console.warn("[Renderer] Debug utilities failed to load:", /** @type {Error} */ (error).message);
        }
    })();

    console.log("[Renderer] Development utilities available at window.__renderer_dev");
    console.log("[Renderer] Performance metrics:", PerformanceMonitor.getMetrics());
}
