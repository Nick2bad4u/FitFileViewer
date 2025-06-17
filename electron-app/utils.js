/* eslint-env browser */

// utils.js - Enhanced Utility exports for FitFileViewer Electron app
/**
 * Exposes utility functions globally for use in index.html and other scripts.
 *
 * Note: Exposing utilities globally is generally discouraged in modern JavaScript development
 * due to potential namespace pollution and security risks. In Electron apps, this can make
 * the application vulnerable to cross-site scripting (XSS) attacks if untrusted content is
 * loaded. This approach is used here to simplify integration with the Electron app's renderer
 * process, where direct access to these utilities is required in inline scripts.
 *
 * @global
 * @namespace utils
 * @version 1.0.0
 * @author FitFileViewer Team
 */

// Import utility functions
import { formatDistance } from "./utils/formatDistance.js";
import { formatDuration } from "./utils/formatDuration.js";
import { patchSummaryFields } from "./utils/patchSummaryFields.js";
import { displayTables } from "./utils/displayTables.js";
import { renderTable } from "./utils/renderTable.js";
import { copyTableAsCSV } from "./utils/copyTableAsCSV.js";
import { renderMap } from "./utils/renderMap.js";
import { renderSummary } from "./utils/renderSummary.js";
import { setActiveTab } from "./utils/setActiveTab.js";
import { toggleTabVisibility } from "./utils/toggleTabVisibility.js";
import { showFitData } from "./utils/showFitData.js";
import { applyTheme, loadTheme, listenForThemeChange } from "./utils/theme.js";
import { updateMapTheme } from "./utils/updateMapTheme.js";
import { showNotification, setLoading } from "./utils/rendererUtils.js";
import { formatArray } from "./utils/formatUtils.js";
import { setTabButtonsEnabled } from "./utils/enableTabButtons.js";

// Constants for better maintainability
const CONSTANTS = {
    NAMESPACE: "FitFileViewer",
    ERRORS: {
        FUNCTION_NOT_AVAILABLE: "Function is not available",
        INVALID_FUNCTION: "Invalid function provided",
        NAMESPACE_COLLISION: "Namespace collision detected",
    },
    LOG_PREFIX: "[utils.js]",
};

// Dynamic version loading from electronAPI
CONSTANTS.VERSION = "unknown"; // Default version

// Function to get version from electronAPI
async function loadVersionFromElectron() {
    try {
        if (window.electronAPI && typeof window.electronAPI.getAppVersion === "function") {
            const version = await window.electronAPI.getAppVersion();
            CONSTANTS.VERSION = version || "unknown";
            logWithContext("info", `Version loaded from Electron: ${CONSTANTS.VERSION}`);
            return CONSTANTS.VERSION;
        } else {
            logWithContext("warn", "electronAPI.getAppVersion not available, keeping default version");
        }
    } catch (error) {
        logWithContext("warn", "Failed to load version from Electron API:", { error: error.message });
    }
    return CONSTANTS.VERSION;
}

// Initialize version asynchronously when electronAPI becomes available
if (typeof window !== "undefined") {
    // Try immediately if electronAPI is already available
    if (window.electronAPI && window.electronAPI.getAppVersion) {
        loadVersionFromElectron();
    } else {
        // Wait for electronAPI to be available
        const checkForElectronAPI = () => {
            if (window.electronAPI && window.electronAPI.getAppVersion) {
                loadVersionFromElectron();
            } else {
                // Keep checking periodically for a short time
                setTimeout(checkForElectronAPI, 100);
            }
        };
        setTimeout(checkForElectronAPI, 100);
    }
}

// Enhanced logging with context
function logWithContext(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} ${CONSTANTS.LOG_PREFIX} ${message}`;

    if (context && Object.keys(context).length > 0) {
        console[level](logMessage, context);
    } else {
        console[level](logMessage);
    }
}

// Validation functions
function validateFunction(fn, name) {
    if (typeof fn !== "function") {
        logWithContext("error", `Invalid function: ${name}`, { type: typeof fn });
        return false;
    }
    return true;
}

// List of utilities to expose globally with enhanced metadata
const utils = {
    // Formatting utilities
    formatDistance,
    formatDuration,
    formatArray,

    // Data processing utilities
    patchSummaryFields,
    displayTables,
    renderTable,
    copyTableAsCSV,

    // Visualization utilities
    renderMap,
    renderSummary,

    // UI management utilities
    setActiveTab,
    toggleTabVisibility,
    showFitData,
    setTabButtonsEnabled,

    // Theme utilities
    applyTheme,
    loadTheme,
    listenForThemeChange,
    updateMapTheme,

    // Notification utilities
    showNotification,
    setLoading,
};

// Enhanced global attachment with validation and error handling
function attachUtilitiesToWindow() {
    const attachmentResults = {
        successful: [],
        failed: [],
        collisions: [],
        total: 0,
    };

    try {
        for (const [key, fn] of Object.entries(utils)) {
            attachmentResults.total++;

            // Skip undefined or null functions
            if (fn === undefined || fn === null) {
                attachmentResults.failed.push({
                    name: key,
                    reason: "Function is undefined or null",
                    type: typeof fn,
                });
                continue;
            }

            // Validate the function
            if (!validateFunction(fn, key)) {
                attachmentResults.failed.push({
                    name: key,
                    reason: CONSTANTS.ERRORS.INVALID_FUNCTION,
                    type: typeof fn,
                });
                continue;
            }

            // Check for namespace collisions and handle intelligently
            if (window[key] && window[key] !== undefined) {
                // If the same function is already attached, skip it silently
                if (window[key] === fn) {
                    attachmentResults.successful.push(key + " (already attached)");
                    continue;
                }

                // If both are functions, check if they're functionally equivalent
                if (typeof window[key] === "function" && typeof fn === "function") {
                    // Functions with same name are likely the same, just re-exported
                    if (window[key].name === fn.name && (window[key].name === key || window[key].name === "")) {
                        attachmentResults.successful.push(key + " (updated)");
                    } else {
                        // Only log if the functions are genuinely different
                        const isDifferent = window[key].toString() !== fn.toString();
                        if (isDifferent) {
                            logWithContext("info", `Function collision resolved for: ${key}`, {
                                note: "Different implementations detected, using newer version",
                            });
                        }
                        attachmentResults.collisions.push({
                            name: key,
                            previousType: typeof window[key],
                            resolved: true,
                        });
                    }
                } else {
                    // Non-function collisions are more serious
                    logWithContext("warn", `Type collision detected for: ${key}`, {
                        existing: typeof window[key],
                        new: typeof fn,
                        overwriting: true,
                    });
                    attachmentResults.collisions.push({
                        name: key,
                        previousType: typeof window[key],
                        newType: typeof fn,
                        serious: true,
                    });
                }
            }

            // Attach to window with error handling
            try {
                window[key] = fn;
                attachmentResults.successful.push(key);
            } catch (error) {
                logWithContext("error", `Failed to attach function: ${key}`, { error: error.message });
                attachmentResults.failed.push({
                    name: key,
                    reason: error.message,
                    type: typeof fn,
                });
            }
        }

        // Log attachment summary
        logWithContext("info", "Utility attachment completed", {
            successful: attachmentResults.successful.length,
            failed: attachmentResults.failed.length,
            collisions: attachmentResults.collisions.length,
            total: attachmentResults.total,
        });

        // Log failures in development
        const isDevelopment =
            (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development") ||
            (typeof window !== "undefined" && window.location && window.location.protocol === "file:");
        if (isDevelopment) {
            if (attachmentResults.failed.length > 0) {
                logWithContext("warn", "Failed attachments:", { failed: attachmentResults.failed });
            }
            // Only log serious collisions (non-function type mismatches)
            const seriousCollisions = attachmentResults.collisions.filter((c) => c.serious);
            if (seriousCollisions.length > 0) {
                logWithContext("warn", "Serious namespace collisions:", { collisions: seriousCollisions });
            }
        }

        return attachmentResults;
    } catch (error) {
        logWithContext("error", "Critical error during utility attachment:", { error: error.message });
        return {
            successful: [],
            failed: [{ name: "ALL", reason: error.message }],
            collisions: [],
            total: Object.keys(utils).length,
        };
    }
}

// Enhanced namespace management
const FitFileViewerUtils = {
    // Core utilities object
    utils,

    // Metadata with dynamic version getter
    get version() {
        return CONSTANTS.VERSION;
    },
    namespace: CONSTANTS.NAMESPACE,

    // Utility management functions
    getAvailableUtils: () => Object.keys(utils),

    isUtilAvailable: (name) => {
        return Object.prototype.hasOwnProperty.call(utils, name) && validateFunction(utils[name], name);
    },

    getUtil: (name) => {
        if (!FitFileViewerUtils.isUtilAvailable(name)) {
            logWithContext("error", `Utility not available: ${name}`);
            return null;
        }
        return utils[name];
    },

    // Safe utility execution
    safeExecute: (utilName, ...args) => {
        const util = FitFileViewerUtils.getUtil(utilName);
        if (!util) {
            throw new Error(`${CONSTANTS.ERRORS.FUNCTION_NOT_AVAILABLE}: ${utilName}`);
        }

        try {
            return util.apply(null, args);
        } catch (error) {
            logWithContext("error", `Error executing utility: ${utilName}`, {
                error: error.message,
                args: args.length,
            });
            throw error;
        }
    },

    // Development helpers
    validateAllUtils: () => {
        const results = { valid: [], invalid: [] };
        for (const [key, fn] of Object.entries(utils)) {
            if (validateFunction(fn, key)) {
                results.valid.push(key);
            } else {
                results.invalid.push(key);
            }
        }
        return results;
    },

    // Cleanup function
    cleanup: () => {
        for (const key of Object.keys(utils)) {
            try {
                delete window[key];
            } catch (error) {
                logWithContext("error", `Failed to cleanup utility: ${key}`, { error: error.message });
            }
        }
        logWithContext("info", "Utils cleanup completed");
    },
};

// Attach utilities to window after imports are loaded
let attachmentResults;
setTimeout(() => {
    attachmentResults = attachUtilitiesToWindow();
}, 0);

// Expose the utils namespace for advanced usage
window.FitFileViewerUtils = FitFileViewerUtils;

// Development mode enhancements
const isDevelopment =
    (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development") ||
    (typeof window !== "undefined" && window.location && window.location.protocol === "file:");
if (isDevelopment) {
    // Expose additional development helpers
    window.devUtilsHelpers = {
        reattachUtils: attachUtilitiesToWindow,
        validateUtils: FitFileViewerUtils.validateAllUtils,
        getAttachmentResults: () => attachmentResults,
        cleanup: FitFileViewerUtils.cleanup,
        logLevel: "debug",
    };

    logWithContext("info", "Development helpers exposed on window.devUtilsHelpers");
}

// Report successful initialization
logWithContext("info", `Utils module initialized successfully (v${CONSTANTS.VERSION})`);

// Export for module usage (if needed)
export { utils as default, FitFileViewerUtils, CONSTANTS as UTILS_CONSTANTS };
