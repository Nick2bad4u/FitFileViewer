/**
 * FIT data display utility for FitFileViewer Handles the display and management
 * of loaded FIT file data with state management integration
 */

/**
 * @typedef {Object} FitDataObject
 *
 * @property {string} [cachedFileName] - Cached filename for performance
 * @property {string} [cachedFilePath] - Cached filepath for performance
 */

/**
 * @typedef {Object} DisplayOptions
 *
 * @property {boolean} [resetRenderStates=true] - Whether to reset rendering
 *   states. Default is `true`
 * @property {boolean} [updateUI=true] - Whether to update UI elements. Default
 *   is `true`
 */

import { AppActions } from "../../app/lifecycle/appActions.js";
import { createGlobalChartStatusIndicator } from "../../charts/components/createGlobalChartStatusIndicator.js";
import { applyEstimatedPowerToRecords } from "../../data/processing/estimateCyclingPower.js";
import { getPowerEstimationSettings } from "../../data/processing/powerEstimationSettings.js";
import { createRendererLogger } from "../../logging/rendererLogger.js";
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
    LOG_PREFIX: "ShowFitData",
    SELECTORS: {
        ACTIVE_FILE_NAME: "activeFileName",
        FILE_NAME_CONTAINER: "activeFileNameContainer",
        UNLOAD_BUTTON: "unloadFileBtn",
    },
    TITLE_PREFIX: "Fit File Viewer",
};

const log = createRendererLogger(DISPLAY_CONSTANTS.LOG_PREFIX);

/**
 * Shows FIT data in the UI and updates application state Used by Electron main
 * process to display loaded FIT file data
 *
 * @example
 *     // Show FIT data with default options
 *     showFitData(parsedData, "/path/to/file.fit");
 *
 * @example
 *     // Show data without resetting render states
 *     showFitData(parsedData, "/path/to/file.fit", {
 *         resetRenderStates: false,
 *     });
 *
 * @param {Object} data - Parsed FIT file data
 * @param {string} [filePath] - Path to the FIT file
 * @param {Object} [options={}] - Display options. Default is `{}`
 * @param {boolean} [options.resetRenderStates=true] - Whether to reset
 *   rendering states. Default is `true`
 * @param {boolean} [options.updateUI=true] - Whether to update UI elements
 *   Default is `true`
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

        log("info", "Displaying FIT data", {
            filePath,
            hasData: Boolean(data),
        });

        integrateFitState(data, filePath);

        // Set global data for legacy compatibility
        globalThis.globalData = data;

        // Apply estimated power early so Charts/Summary/Tables can consume it immediately.
        // This only applies to cycling-like activities that lack real power, and only when enabled.
        try {
            if (
                globalThis.globalData &&
                Array.isArray(
                    /** @type {any} */ (globalThis.globalData).recordMesgs
                )
            ) {
                applyEstimatedPowerToRecords({
                    recordMesgs: /** @type {Record<string, unknown>[]} */ (
                        /** @type {any} */ (globalThis.globalData).recordMesgs
                    ),
                    sessionMesgs: Array.isArray(
                        /** @type {any} */ (globalThis.globalData).sessionMesgs
                    )
                        ? /** @type {Record<string, unknown>[]} */ (
                              /** @type {any} */ (globalThis.globalData)
                                  .sessionMesgs
                          )
                        : undefined,
                    settings: getPowerEstimationSettings(),
                });
            }
        } catch {
            /* ignore */
        }

        // Reset rendering states if requested
        if (config.resetRenderStates) {
            log(
                "info",
                "resetRenderStates option is deprecated and now handled by AppActions"
            );
        }

        // Handle file path and UI updates
        if (filePath && config.updateUI) {
            const fileName = getCachedFileName(data, filePath);

            // Update file display state
            updateFileState(fileName);

            // Enable tabs and send notifications
            enableTabsAndNotify(filePath);

            try {
                if (typeof globalThis.scrollTo === "function") {
                    const prefersReducedMotion =
                        typeof globalThis.matchMedia === "function" &&
                        globalThis.matchMedia(
                            "(prefers-reduced-motion: reduce)"
                        ).matches;

                    (globalThis.requestAnimationFrame || globalThis.setTimeout)(
                        () => {
                            globalThis.scrollTo({
                                top: 0,
                                behavior: prefersReducedMotion
                                    ? "auto"
                                    : "smooth",
                            });
                        },
                        0
                    );
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
                log("warn", "Error creating chart status indicator", {
                    error: errorMessage,
                });
            }
        }

        log("info", "FIT data displayed successfully", {
            filePath,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown error showing FIT data";
        log("error", "Error showing FIT data", {
            error: errorMessage,
            filePath,
        });

        // Let the central error handling system manage this error
        // instead of writing directly to state
        console.error("[ShowFitData] Error:", error);

        throw error;
    } finally {
        try {
            AppActions.setFileOpening(false);
        } catch {
            /* ignore */
        }
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

    // Charts are rendered on-demand when the user activates the Charts tab.
    // Background pre-rendering was removed because it can freeze the UI.

    // Switch to map tab as default when file is loaded
    // Use setTimeout to ensure this happens after DOM updates and tab handlers are ready
    setTimeout(() => {
        // Use type assertion for window extensions
        const windowExt = /**
         * @type {Window & {
         *     updateTabVisibility?: Function;
         *     updateActiveTab?: Function;
         *     renderMap?: Function;
         *     isMapRendered?: boolean;
         * }}
         */ (globalThis);

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
 *
 * @private
 *
 * @param {string} filePath - Path of the loaded file
 */
function enableTabsAndNotify(filePath) {
    try {
        // Enable tab buttons when a file is loaded
        if (globalThis.setTabButtonsEnabled) {
            globalThis.setTabButtonsEnabled(true);
        }

        // Notify main process via IPC
        if (globalThis.electronAPI?.notifyFitFileLoaded) {
            globalThis.electronAPI.notifyFitFileLoaded(filePath);
        } else if (globalThis.electronAPI?.send) {
            // Backward compatibility for older preload builds.
            globalThis.electronAPI.send(
                DISPLAY_CONSTANTS.EVENTS.FIT_FILE_LOADED_IPC,
                filePath
            );
        }

        // Dispatch custom event for other components
        const event = new CustomEvent(
            DISPLAY_CONSTANTS.EVENTS.FIT_FILE_LOADED,
            {
                detail: { filePath },
            }
        );
        globalThis.dispatchEvent(event);

        log("info", "Tabs enabled and notifications sent", { filePath });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown error enabling tabs and notifications";
        log("error", "Error enabling tabs and notifications", {
            error: errorMessage,
            filePath,
        });
    }
}

/**
 * Extracts filename from a file path
 *
 * @private
 *
 * @param {string} filePath - Full file path
 *
 * @returns {string} Filename only
 */
function extractFileName(filePath) {
    if (!filePath || typeof filePath !== "string") {
        return "";
    }
    return filePath.split(/[/\\]/).pop() || "";
}

/**
 * Manages file name caching for performance
 *
 * @private
 *
 * @param {FitDataObject} data - FIT data object
 * @param {string} filePath - Path of the file
 *
 * @returns {string} Cached or newly computed filename
 */
function getCachedFileName(data, filePath) {
    try {
        // Use type assertion for property access
        const dataWithCache = /** @type {FitDataObject} */ (data);

        // Check if we can use cached filename
        if (
            dataWithCache.cachedFileName &&
            dataWithCache.cachedFilePath === filePath
        ) {
            return dataWithCache.cachedFileName;
        }

        // Extract and cache new filename
        const fileName = extractFileName(filePath);
        dataWithCache.cachedFileName = fileName;
        dataWithCache.cachedFilePath = filePath;

        return fileName;
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown error managing file name cache";
        log("error", "Error managing file name cache", {
            error: errorMessage,
            filePath,
        });
        return extractFileName(filePath);
    }
}

function integrateFitState(data, filePath) {
    try {
        const manager = resolveFitFileStateManager();

        if (manager && typeof manager.handleFileLoaded === "function") {
            if (filePath && typeof manager.startFileLoading === "function") {
                try {
                    manager.startFileLoading(filePath);
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : String(error);
                    log("warn", "Unable to start file loading state", {
                        error: message,
                        filePath,
                    });
                }
            }

            manager.handleFileLoaded(data, { filePath: filePath ?? null });
            return;
        }

        AppActions.loadFile(data, filePath ?? null);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log("error", "Failed to integrate FIT state", {
            error: message,
            filePath,
        });
        AppActions.loadFile(data, filePath ?? null);
    }
}

function resolveFitFileStateManager() {
    const candidate = /** @type {unknown} */ (
        globalThis.__FFV_fitFileStateManager
    );

    if (
        candidate &&
        typeof candidate === "object" &&
        "handleFileLoaded" in candidate &&
        typeof (
            /** @type {{ handleFileLoaded?: unknown }} */ (candidate)
                .handleFileLoaded
        ) === "function"
    ) {
        return /** @type {{
         *     handleFileLoaded: Function;
         *     startFileLoading?: (filePath: string) => void;
         * }} */ (candidate);
    }

    return null;
}

/**
 * Updates UI elements to show active file information
 *
 * @private
 *
 * @param {string} fileName - Name of the active file
 */
function updateFileState(fileName) {
    try {
        const { TITLE_PREFIX } = DISPLAY_CONSTANTS,
            hasFile = Boolean(fileName),
            sanitizedName = hasFile ? fileName : "",
            title = hasFile
                ? `${TITLE_PREFIX} - ${sanitizedName}`
                : TITLE_PREFIX;

        setState(
            "ui.fileInfo",
            {
                displayName: sanitizedName,
                hasFile,
                title,
            },
            { source: "showFitData.updateFileState" }
        );
        setState("ui.unloadButtonVisible", hasFile, {
            source: "showFitData.updateFileState",
        });

        log("info", "File state updated for display", {
            fileName: sanitizedName,
            hasFile,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Unknown error updating file display";
        log("error", "Error updating file display", {
            error: errorMessage,
            fileName,
        });
    }
}
