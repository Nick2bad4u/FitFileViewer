/* eslint-env browser */

// Utils.js - Enhanced Utility exports for FitFileViewer Electron app
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

import { setLoading, showNotification } from "./utils/app/initialization/rendererUtils.js";
import { patchSummaryFields } from "./utils/data/processing/patchSummaryFields.js";
import { copyTableAsCSV } from "./utils/files/export/copyTableAsCSV.js";
// Import utility functions
import { formatDistance } from "./utils/formatting/formatters/formatDistance.js";
import { formatDuration } from "./utils/formatting/formatters/formatDuration.js";
import { formatArray } from "./utils/formatting/formatters/formatUtils.js";
import { renderMap } from "./utils/maps/core/renderMap.js";
import { createTables } from "./utils/rendering/components/createTables.js";
import { renderSummary } from "./utils/rendering/core/renderSummary.js";
import { renderTable } from "./utils/rendering/core/renderTable.js";
import { showFitData } from "./utils/rendering/core/showFitData.js";
import { applyTheme, listenForThemeChange, loadTheme } from "./utils/theming/core/theme.js";
import { updateMapTheme } from "./utils/theming/specific/updateMapTheme.js";
import { setTabButtonsEnabled } from "./utils/ui/controls/enableTabButtons.js";
import { updateActiveTab } from "./utils/ui/tabs/updateActiveTab.js";
import { updateTabVisibility } from "./utils/ui/tabs/updateTabVisibility.js";

/**
 * @typedef {Object} ConstantsType
 * @property {string} NAMESPACE
 * @property {{FUNCTION_NOT_AVAILABLE: string, INVALID_FUNCTION: string, NAMESPACE_COLLISION: string}} ERRORS
 * @property {string} LOG_PREFIX
 * @property {string} VERSION
 */

// Constants for better maintainability
const CONSTANTS = /** @type {ConstantsType} */ ({
    ERRORS: {
        FUNCTION_NOT_AVAILABLE: "Function is not available",
        INVALID_FUNCTION: "Invalid function provided",
        NAMESPACE_COLLISION: "Namespace collision detected",
    },
    LOG_PREFIX: "[utils.js]",
    NAMESPACE: "FitFileViewer",
    VERSION: "unknown", // Default version
});

// Version loading idempotency guards
/** @type {boolean} */
let versionLoadStarted = false;
/** @type {Promise<string>|null} */
let versionLoadPromise = null;
/** @type {number|undefined} */
let electronAPICheckTimerId;

// Function to get version from electronAPI (idempotent)
async function loadVersionFromElectron() {
    if (versionLoadStarted) {
        return versionLoadPromise ?? Promise.resolve(CONSTANTS.VERSION);
    }
    versionLoadStarted = true;
    // If a polling timer was set, cancel it since we're proceeding now
    if (typeof electronAPICheckTimerId === "number") {
        clearTimeout(electronAPICheckTimerId);
        electronAPICheckTimerId = undefined;
    }

    versionLoadPromise = (async () => {
        try {
            if (
                /** @type {any} */ (globalThis).electronAPI &&
                typeof (/** @type {any} */ (globalThis).electronAPI.getAppVersion) === "function"
            ) {
                const version = await /** @type {any} */ (globalThis).electronAPI.getAppVersion();
                CONSTANTS.VERSION = version || "unknown";
                logWithContext("info", `Version loaded from Electron: ${CONSTANTS.VERSION}`);
                return CONSTANTS.VERSION;
            }
            logWithContext("warn", "electronAPI.getAppVersion not available, keeping default version");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            logWithContext("warn", "Failed to load version from Electron API:", { error: errorMessage });
        }
        return CONSTANTS.VERSION;
    })();

    return versionLoadPromise;
}

// Initialize version asynchronously when electronAPI becomes available
if (globalThis.window !== undefined) {
    // Try immediately if electronAPI is already available
    if (
        /** @type {any} */ (globalThis).electronAPI &&
        typeof (/** @type {any} */ (globalThis).electronAPI.getAppVersion) === "function"
    ) {
        // Fire and forget - don't need to await
        loadVersionFromElectron();
    } else {
        // Wait for electronAPI to be available
        const checkForElectronAPI = () => {
            if (versionLoadStarted) {
                // Already loading or loaded; stop polling
                electronAPICheckTimerId = undefined;
                return;
            }
            if (
                /** @type {any} */ (globalThis).electronAPI &&
                typeof (/** @type {any} */ (globalThis).electronAPI.getAppVersion) === "function"
            ) {
                // Fire and forget - don't need to await
                loadVersionFromElectron();
            } else {
                // Keep checking periodically for a short time
                electronAPICheckTimerId = /** @type {number} */ (
                    /** @type {unknown} */ (setTimeout(checkForElectronAPI, 100))
                );
            }
        };
        electronAPICheckTimerId = /** @type {number} */ (/** @type {unknown} */ (setTimeout(checkForElectronAPI, 100)));
    }
}

/**
 * Enhanced logging with context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function logWithContext(level, message, context = {}) {
    const timestamp = new Date().toISOString(),
        logMessage = `${timestamp} ${CONSTANTS.LOG_PREFIX} ${message}`;

    if (context && Object.keys(context).length > 0) {
        // @ts-expect-error - Dynamic console method access
        console[level](logMessage, context);
    } else {
        // @ts-expect-error - Dynamic console method access
        console[level](logMessage);
    }
}

/**
 * Validation functions
 * @param {any} fn - Function to validate
 * @param {string} name - Function name
 * @returns {boolean} Is valid function
 */
function validateFunction(fn, name) {
    if (typeof fn !== "function") {
        logWithContext("error", `Invalid function: ${name}`, { type: typeof fn });
        return false;
    }
    return true;
}

// List of utilities to expose globally with enhanced metadata
const utils = {
    // Theme utilities
    applyTheme,
    copyTableAsCSV,
    createTables,

    formatArray,
    // Formatting utilities
    formatDistance,
    formatDuration,
    listenForThemeChange,

    loadTheme,
    // Data processing utilities
    patchSummaryFields,

    // Visualization utilities
    renderMap,
    renderSummary,
    renderTable,
    setLoading,

    setTabButtonsEnabled,
    showFitData,
    // Notification utilities
    showNotification,
    // UI management utilities
    updateActiveTab,

    updateMapTheme,
    updateTabVisibility,
};

/**
 * @typedef {Object} AttachmentResult
 * @property {string} name
 * @property {string} reason
 * @property {string} type
 */

/**
 * @typedef {Object} CollisionResult
 * @property {string} name
 * @property {string} previousType
 * @property {string} newType
 * @property {boolean} serious
 * @property {boolean} resolved
 */

/**
 * @typedef {Object} AttachmentResults
 * @property {string[]} successful
 * @property {AttachmentResult[]} failed
 * @property {CollisionResult[]} collisions
 * @property {number} total
 */

// Enhanced global attachment with validation and error handling
function attachUtilitiesToWindow() {
    /** @type {AttachmentResults} */
    const attachmentResults = {
        collisions: [],
        failed: [],
        successful: [],
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
            // @ts-expect-error - Dynamic window property access
            if (window[key] && window[key] !== undefined) {
                // If the same function is already attached, skip it silently
                // @ts-expect-error - Dynamic window property access
                if (window[key] === fn) {
                    attachmentResults.successful.push(`${key} (already attached)`);
                    continue;
                }

                // If both are functions, check if they're functionally equivalent
                // @ts-expect-error - Dynamic window property access
                if (typeof window[key] === "function" && typeof fn === "function") {
                    // Functions with same name are likely the same, just re-exported
                    // @ts-expect-error - Dynamic window property access
                    if (window[key].name === fn.name && (window[key].name === key || window[key].name === "")) {
                        attachmentResults.successful.push(`${key} (updated)`);
                    } else {
                        // Only log if the functions are genuinely different
                        // @ts-expect-error - Dynamic window property access
                        const isDifferent = window[key].toString() !== fn.toString();
                        if (isDifferent) {
                            logWithContext("info", `Function collision resolved for: ${key}`, {
                                note: "Different implementations detected, using newer version",
                            });
                        }
                        attachmentResults.collisions.push({
                            name: key,
                            newType: typeof fn,
                            // @ts-expect-error - Dynamic window property access
                            previousType: typeof window[key],
                            resolved: true,
                            serious: false,
                        });
                    }
                } else {
                    // Non-function collisions are more serious
                    logWithContext("warn", `Type collision detected for: ${key}`, {
                        // @ts-expect-error - Dynamic window property access
                        existing: typeof window[key],
                        new: typeof fn,
                        overwriting: true,
                    });
                    attachmentResults.collisions.push({
                        name: key,
                        newType: typeof fn,
                        // @ts-expect-error - Dynamic window property access
                        previousType: typeof window[key],
                        resolved: false,
                        serious: true,
                    });
                }
            }

            // Attach to window with error handling
            try {
                // @ts-expect-error - Dynamic window property assignment
                window[key] = fn;
                attachmentResults.successful.push(key);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                logWithContext("error", `Failed to attach function: ${key}`, { error: errorMessage });
                attachmentResults.failed.push({
                    name: key,
                    reason: errorMessage,
                    type: typeof fn,
                });
            }
        }

        // Log attachment summary
        logWithContext("info", "Utility attachment completed", {
            collisions: attachmentResults.collisions.length,
            failed: attachmentResults.failed.length,
            successful: attachmentResults.successful.length,
            total: attachmentResults.total,
        });

        // Log failures in development
        const isDevelopment =
            (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development") ||
            (globalThis.window !== undefined && globalThis.location && globalThis.location.protocol === "file:");
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
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logWithContext("error", "Critical error during utility attachment:", { error: errorMessage });
        return {
            collisions: [],
            failed: [{ name: "ALL", reason: errorMessage, type: "unknown" }],
            successful: [],
            total: Object.keys(utils).length,
        };
    }
}

/**
 * @typedef {Object} ValidationResults
 * @property {string[]} valid
 * @property {string[]} invalid
 */

// Enhanced namespace management
const FitFileViewerUtils = {
    // Cleanup function
    cleanup: () => {
        for (const key of Object.keys(utils)) {
            try {
                // @ts-expect-error - Dynamic window property deletion
                delete window[key];
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                logWithContext("error", `Failed to cleanup utility: ${key}`, { error: errorMessage });
            }
        }
        logWithContext("info", "Utils cleanup completed");
    },

    // Utility management functions
    getAvailableUtils: () => Object.keys(utils),
    /**
     * @param {string} name - Utility name
     * @returns {Function|null} The utility function or null
     */
    getUtil: (name) => {
        if (!FitFileViewerUtils.isUtilAvailable(name)) {
            logWithContext("error", `Utility not available: ${name}`);
            return null;
        }
        // @ts-expect-error - Dynamic utils property access
        return utils[name];
    },

    /**
     * @param {string} name - Utility name
     * @returns {boolean} Is utility available
     */
    isUtilAvailable: (name) =>
        // @ts-expect-error - Dynamic utils property access
        Object.hasOwn(utils, name) && validateFunction(utils[name], name),

    namespace: CONSTANTS.NAMESPACE,
    // Safe utility execution
    /**
     * @param {string} utilName - Utility name
     * @param {...any} args - Arguments to pass
     * @returns {any} Result of utility execution
     */
    safeExecute: (utilName, ...args) => {
        const util = FitFileViewerUtils.getUtil(utilName);
        if (!util) {
            throw new Error(`${CONSTANTS.ERRORS.FUNCTION_NOT_AVAILABLE}: ${utilName}`);
        }

        try {
            return util(...args);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            logWithContext("error", `Error executing utility: ${utilName}`, {
                args: args.length,
                error: errorMessage,
            });
            throw error;
        }
    },

    // Core utilities object
    utils,

    // Development helpers
    validateAllUtils: () => {
        /** @type {ValidationResults} */
        const results = { invalid: [], valid: [] };
        for (const [key, fn] of Object.entries(utils)) {
            if (validateFunction(fn, key)) {
                results.valid.push(key);
            } else {
                results.invalid.push(key);
            }
        }
        return results;
    },

    // Metadata with dynamic version getter
    get version() {
        return CONSTANTS.VERSION;
    },
};

// Attach utilities to window after imports are loaded
/** @type {AttachmentResults|undefined} */
let attachmentResults;
setTimeout(() => {
    attachmentResults = attachUtilitiesToWindow();
}, 0);

// Expose the utils namespace for advanced usage
// @ts-expect-error - FitFileViewerUtils assigned to window
globalThis.FitFileViewerUtils = FitFileViewerUtils;

// Development mode enhancements
const isDevelopment =
    (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development") ||
    (globalThis.window !== undefined && globalThis.location && globalThis.location.protocol === "file:");
if (isDevelopment) {
    // Expose additional development helpers
    // @ts-expect-error - devUtilsHelpers assigned to window
    globalThis.devUtilsHelpers = {
        cleanup: FitFileViewerUtils.cleanup,
        getAttachmentResults: () => attachmentResults,
        logLevel: "debug",
        reattachUtils: attachUtilitiesToWindow,
        validateUtils: FitFileViewerUtils.validateAllUtils,
    };

    logWithContext("info", "Development helpers exposed on window.devUtilsHelpers");
}

// Report successful initialization
logWithContext("info", `Utils module initialized successfully (v${CONSTANTS.VERSION})`);

// Export for module usage (if needed)
export default utils;
export { FitFileViewerUtils, CONSTANTS as UTILS_CONSTANTS };
