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

            // Update file display elements
            updateFileDisplay(fileName);

            // Enable tabs and send notifications
            enableTabsAndNotify(filePath);

            // Update state with file information
            setState(
                "fileInfo",
                {
                    loadedAt: Date.now(),
                    name: fileName,
                    path: filePath,
                },
                { source: "showFitData" }
            );
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

        // Update state with error information
        setState(
            "error",
            {
                message: errorMessage,
                source: "showFitData",
                timestamp: Date.now(),
            },
            { source: "showFitData" }
        );

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
 * Resets rendering states to ensure proper re-rendering with new data
 * @private
 */
function resetRenderingStates() {
    try {
        // Reset rendering flags - use type assertion for window extensions
        /** @type {Window & {isMapRendered?: boolean, isChartRendered?: boolean}} */ (globalThis).isMapRendered = false;
        /** @type {Window & {isMapRendered?: boolean, isChartRendered?: boolean}} */ (globalThis).isChartRendered = false;

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
function updateFileDisplay(fileName) {
    try {
        const // Destructure constants for cleaner code
            { CSS_CLASSES, SELECTORS, TITLE_PREFIX } = DISPLAY_CONSTANTS,
            // Update file name container
            fileNameContainer = document.getElementById(SELECTORS.FILE_NAME_CONTAINER);
        if (fileNameContainer) {
            fileNameContainer.classList.add(CSS_CLASSES.HAS_FILE);
        }

        // Update file name display
        const fileSpan = document.getElementById(SELECTORS.ACTIVE_FILE_NAME);
        if (fileSpan) {
            fileSpan.classList.remove(CSS_CLASSES.MARQUEE);
            fileSpan.innerHTML = `<span class="active-label">Active:</span> ${fileName}`;
            fileSpan.title = fileName;
            fileSpan.scrollLeft = 0;
        }

        // Show unload button
        const unloadBtn = document.getElementById(SELECTORS.UNLOAD_BUTTON);
        if (unloadBtn) {
            unloadBtn.style.display = "";
        }

        // Update document title
        document.title = fileName ? `${TITLE_PREFIX} - ${fileName}` : TITLE_PREFIX;

        logWithContext(`File display updated: ${fileName}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error updating file display";
        logWithContext(`Error updating file display: ${errorMessage}`, "error");
    }
}
