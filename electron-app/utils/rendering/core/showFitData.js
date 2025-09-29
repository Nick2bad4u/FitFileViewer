/**
 * FIT data display utility for FitFileViewer
 * Handles the display and management of loaded FIT file data with state management integration
 */

/**
 * @typedef {Object} FitDataObject
 * @property {string} [cachedFileName] - Cached filename for performance
 * @property {string} [cachedFilePath] - Cached filepath for performance
 */

/**
 * @typedef {Object} DisplayOptions
 * @property {boolean} [resetRenderStates=true] - Whether to reset rendering states
 * @property {boolean} [updateUI=true] - Whether to update UI elements
 */

import { deferUntilIdle } from "../../app/performance/lazyRenderingUtils.js";
import { createGlobalChartStatusIndicator } from "../../charts/components/createGlobalChartStatusIndicator.js";
import { setState } from "../../state/core/stateManager.js";

// Constants for better maintainability
const DISPLAY_CONSTANTS = {
    CSS_CLASSES: {
        HAS_FILE: "has-file",
        MARQUEE: "marquee",
    },
    EVENTS: {
        FIT_FILE_LOADED: "fitfile-loaded",
        FIT_FILE_LOADED_IPC: "fit-file-loaded",
    },
    LOG_PREFIX: "[ShowFitData]",
    SELECTORS: {
        ACTIVE_FILE_NAME: "activeFileName",
        FILE_NAME_CONTAINER: "activeFileNameContainer",
        UNLOAD_BUTTON: "unloadFileBtn",
    },
    TITLE_PREFIX: "Fit File Viewer",
};

/**
 * Shows FIT data in the UI and updates application state
 * Used by Electron main process to display loaded FIT file data
 *
 * @param {Object} data - Parsed FIT file data
 * @param {string} [filePath] - Path to the FIT file
 * @param {Object} [options={}] - Display options
 * @param {boolean} [options.resetRenderStates=true] - Whether to reset rendering states
 * @param {boolean} [options.updateUI=true] - Whether to update UI elements
 *
 * @example
 * // Show FIT data with default options
 * showFitData(parsedData, "/path/to/file.fit");
 *
 * @example
 * // Show data without resetting render states
 * showFitData(parsedData, "/path/to/file.fit", { resetRenderStates: false });
 *
 * @public
 */
export function showFitData(data, filePath, options = {}) {
    const config = {
        resetRenderStates: true,
        updateUI: true,
        ...options,
    };

    try {
        // Validate input
        if (!data || typeof data !== "object") {
            throw new Error("Invalid data: expected object");
        }

        logWithContext("Displaying FIT data", "info");

        // Set global data and update state
        globalThis.globalData = data;
        console.log("[ShowFitData] Setting globalData state", data ? "with data" : "null");
        setState("globalData", data, { source: "showFitData" });

        // Reset rendering states if requested
        if (config.resetRenderStates) {
            resetRenderingStates();
        }

        // Handle file path and UI updates
        if (filePath && config.updateUI) {
            const fileName = getCachedFileName(data, filePath);

            // Update file display state
            updateFileState(fileName);

            // Enable tabs and send notifications
            enableTabsAndNotify(filePath);

            // Use central state management for file information
            setState("currentFile", filePath, { source: "showFitData" });

            try {
                if (typeof globalThis.scrollTo === "function") {
                    const prefersReducedMotion =
                        typeof globalThis.matchMedia === "function" &&
                        globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

                    (globalThis.requestAnimationFrame || globalThis.setTimeout)(() => {
                        globalThis.scrollTo({
                            top: 0,
                            behavior: prefersReducedMotion ? "auto" : "smooth",
                        });
                    }, 0);
                }
            } catch {
                /* no-op */
            }
        }

        // Create global chart status indicator if available
        if (typeof createGlobalChartStatusIndicator === "function") {
            try {
                createGlobalChartStatusIndicator();
            } catch (indicatorError) {
                const errorMessage =
                    indicatorError instanceof Error
                        ? indicatorError.message
                        : "Unknown error creating chart status indicator";
                logWithContext(`Error creating chart status indicator: ${errorMessage}`, "warn");
            }
        }

        logWithContext(`FIT data displayed successfully${filePath ? ` for file: ${extractFileName(filePath)}` : ""}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error showing FIT data";
        logWithContext(`Error showing FIT data: ${errorMessage}`, "error");

        // Let the central error handling system manage this error
        // instead of writing directly to state
        console.error("[ShowFitData] Error:", error);

        throw error;
    }

    // Create tables if available
    if (globalThis.createTables && globalThis.globalData) {
        globalThis.createTables(globalThis.globalData);
    }

    // Pre-render summary data so it's ready when user switches to summary tab
    // This ensures all tabs have their data ready, even though we default to map
    if (globalThis.renderSummary && globalThis.globalData) {
        globalThis.renderSummary(globalThis.globalData);
    }

    // Pre-render charts in the background during idle time
    // This ensures charts are ready when user clicks the chart tab
    preRenderChartsInBackground(data);

    // Switch to map tab as default when file is loaded
    // Use setTimeout to ensure this happens after DOM updates and tab handlers are ready
    setTimeout(() => {
        // Use type assertion for window extensions
        const windowExt = /** @type {Window & {
            updateTabVisibility?: Function,
            updateActiveTab?: Function,
            renderMap?: Function,
            isMapRendered?: boolean
        }} */ (globalThis);

        if (windowExt.updateTabVisibility && windowExt.updateActiveTab) {
            windowExt.updateTabVisibility("content-map");
            windowExt.updateActiveTab("tab-map");

            // Manually trigger map rendering since we're programmatically switching tabs
            if (windowExt.renderMap && !windowExt.isMapRendered) {
                windowExt.renderMap();
                windowExt.isMapRendered = true;
            }
        }
    }, 0);
}

/**
 * Enables tab buttons and notifies the main process
 * @param {string} filePath - Path of the loaded file
 * @private
 */
function enableTabsAndNotify(filePath) {
    try {
        // Enable tab buttons when a file is loaded
        if (globalThis.setTabButtonsEnabled) {
            globalThis.setTabButtonsEnabled(true);
        }

        // Notify main process via IPC
        if (globalThis.electronAPI?.send) {
            globalThis.electronAPI.send(DISPLAY_CONSTANTS.EVENTS.FIT_FILE_LOADED_IPC, filePath);
        }

        // Dispatch custom event for other components
        const event = new CustomEvent(DISPLAY_CONSTANTS.EVENTS.FIT_FILE_LOADED, {
            detail: { filePath },
        });
        globalThis.dispatchEvent(event);

        logWithContext("Tabs enabled and notifications sent");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error enabling tabs and notifications";
        logWithContext(`Error enabling tabs and notifications: ${errorMessage}`, "error");
    }
}

/**
 * Extracts filename from a file path
 * @param {string} filePath - Full file path
 * @returns {string} Filename only
 * @private
 */
function extractFileName(filePath) {
    if (!filePath || typeof filePath !== "string") {
        return "";
    }
    return filePath.split(/[/\\]/).pop() || "";
}

/**
 * Manages file name caching for performance
 * @param {FitDataObject} data - FIT data object
 * @param {string} filePath - Path of the file
 * @returns {string} Cached or newly computed filename
 * @private
 */
function getCachedFileName(data, filePath) {
    try {
        // Use type assertion for property access
        const dataWithCache = /** @type {FitDataObject} */ (data);

        // Check if we can use cached filename
        if (dataWithCache.cachedFileName && dataWithCache.cachedFilePath === filePath) {
            return dataWithCache.cachedFileName;
        }

        // Extract and cache new filename
        const fileName = extractFileName(filePath);
        dataWithCache.cachedFileName = fileName;
        dataWithCache.cachedFilePath = filePath;

        return fileName;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error managing file name cache";
        logWithContext(`Error managing file name cache: ${errorMessage}`, "error");
        return extractFileName(filePath);
    }
}

/**
 * Logs messages with context for data display operations
 * @param {string} message - The message to log
 * @param {string} level - Log level ('info', 'warn', 'error')
 * @private
 */
function logWithContext(message, level = "info") {
    try {
        const prefix = DISPLAY_CONSTANTS.LOG_PREFIX;
        switch (level) {
            case "error": {
                console.error(`${prefix} ${message}`);
                break;
            }
            case "warn": {
                console.warn(`${prefix} ${message}`);
                break;
            }
            default: {
                console.log(`${prefix} ${message}`);
            }
        }
    } catch {
        // Silently fail if logging encounters an error
    }
}

/**
 * Pre-renders charts in the background during browser idle time
 * This ensures charts are ready when the user clicks the chart tab
 * @param {Object} data - FIT file data to render
 * @private
 */
function preRenderChartsInBackground(data) {
    try {
        // Only pre-render if we have valid data and the renderChartsWithData function exists
        if (!data || !globalThis.renderChartsWithData) {
            return;
        }

        logWithContext("Scheduling background chart pre-rendering");

        // Use deferUntilIdle to render during browser idle time
        // This ensures it doesn't interfere with UI rendering or user interactions
        deferUntilIdle(
            async () => {
                try {
                    logWithContext("Starting background chart pre-rendering");

                    // Set a flag to indicate this is background pre-rendering
                    // This can be used by the rendering logic to skip certain operations
                    const isBackgroundRender = true;

                    // Trigger chart rendering in the background
                    // The state system will cache the results
                    await globalThis.renderChartsWithData(data, isBackgroundRender);

                    logWithContext("Background chart pre-rendering completed");
                } catch (error) {
                    // Silently fail - this is a performance optimization, not critical
                    logWithContext(`Background chart pre-rendering failed: ${error}`, "warn");
                }
            },
            {
                // Give the UI some time to settle before starting
                // This ensures map rendering and other initial UI updates complete first
                timeout: 3000,
            }
        );
    } catch (error) {
        // Silently fail - this is a performance optimization
        logWithContext(`Error scheduling background chart pre-rendering: ${error}`, "warn");
    }
}

/**
 * Resets rendering states to ensure proper re-rendering with new data
 * @private
 */
function resetRenderingStates() {
    try {
        // Reset rendering flags - use type assertion for window extensions
        /** @type {Window & {isMapRendered?: boolean, isChartRendered?: boolean}} */ (globalThis).isMapRendered = false;
        /** @type {Window & {isMapRendered?: boolean, isChartRendered?: boolean}} */ (globalThis).isChartRendered =
            false;

        // Update state management
        setState("ui.isMapRendered", false, { source: "showFitData" });
        setState("ui.isChartRendered", false, { source: "showFitData" });

        logWithContext("Rendering states reset");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error resetting rendering states";
        logWithContext(`Error resetting rendering states: ${errorMessage}`, "error");
    }
}

/**
 * Updates UI elements to show active file information
 * @param {string} fileName - Name of the active file
 * @private
 */
function updateFileState(fileName) {
    try {
        const { TITLE_PREFIX } = DISPLAY_CONSTANTS,
            hasFile = Boolean(fileName),
            sanitizedName = hasFile ? fileName : "",
            title = hasFile ? `${TITLE_PREFIX} - ${sanitizedName}` : TITLE_PREFIX;

        setState(
            "ui.fileInfo",
            {
                displayName: sanitizedName,
                hasFile,
                title,
            },
            { source: "showFitData.updateFileState" }
        );
        setState("ui.unloadButtonVisible", hasFile, { source: "showFitData.updateFileState" });

        logWithContext(`File state updated for display: ${sanitizedName}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error updating file display";
        logWithContext(`Error updating file display: ${errorMessage}`, "error");
    }
}
