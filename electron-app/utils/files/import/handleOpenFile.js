/**
 * File open handling utility for FitFileViewer
 * Provides secure file opening with comprehensive error handling and state management integration
 */

// Import stateManager module
import * as stateManager from "../../state/core/stateManager.js";

// Export stateManager for testing
// Only used in tests, never in production code
const __TEST_ONLY_exposedStateManager = stateManager;

// Constants for better maintainability
const FILE_OPEN_CONSTANTS = {
    ELECTRON_API_METHODS: {
        OPEN_FILE: "openFile",
        PARSE_FIT_FILE: "parseFitFile",
        READ_FILE: "readFile",
    },
    ERROR_TIMEOUTS: {
        CRITICAL: 7000,
        DEFAULT: 5000,
    },
    LOG_PREFIX: "[HandleOpenFile]",
};

/**
 * Handles file opening logic with comprehensive error handling and state management
 *
 * @param {Object} params - Configuration object for file opening
 * @param {Object} params.isOpeningFileRef - Reference object to track opening state
 * @param {HTMLElement} params.openFileBtn - Open file button element
 * @param {Function} params.setLoading - Function to set loading state
 * @param {Function} params.showNotification - Function to show notifications
 * @param {Object} [options={}] - Additional options
 * @param {number} [options.timeout=30000] - Timeout for file operations in milliseconds
 * @param {boolean} [options.validateFileSize=true] - Whether to validate file size
 * @returns {Promise<boolean>} True if file was successfully opened and processed
 *
 * @example
 * // Basic usage
 * const success = await handleOpenFile({
 *   isOpeningFileRef: { value: false },
 *   openFileBtn: document.getElementById('openFileBtn'),
 *   setLoading: (loading) => showLoadingSpinner(loading),
 *   showNotification: (msg, type) => displayMessage(msg, type)
 * });
 *
 * @public
 */
async function handleOpenFile({ isOpeningFileRef, openFileBtn, setLoading, showNotification }, options = {}) {
    const config = {
        timeout: 30_000,
        validateFileSize: true,
        ...options,
    };

    // Prevent multiple simultaneous file opening operations
    if (/** @type {*} */ (isOpeningFileRef)?.value) {
        logWithContext("File opening already in progress", "warn");
        showNotification("File opening is already in progress. Please wait.", "warning");
        return false;
    }

    // Validate required parameters
    if (typeof showNotification !== "function") {
        logWithContext("showNotification function is required", "error");
        return false;
    }

    const uiElements = { isOpeningFileRef, openFileBtn, setLoading };

    let arrayBuffer, filePath, result;

    try {
        // Set opening state
        updateUIState(uiElements, true, true);

        // Validate Electron API availability
        if (!validateElectronAPI()) {
            showNotification(
                "Electron API not available. Please restart the app.",
                "error",
                FILE_OPEN_CONSTANTS.ERROR_TIMEOUTS.CRITICAL
            );
            return false;
        }

        logWithContext("Starting file open process");

        // Step 1: Open file dialog
        try {
            filePath = await globalThis.electronAPI.openFile();
        } catch (error) {
            const errorMessage = `Unable to open the file dialog. Please try again. Error details: ${error}`;
            logWithContext(errorMessage, "error");
            showNotification(errorMessage, "error");
            updateUIState(uiElements, false, false);
            return false;
        }

        // User cancelled file dialog
        if (!filePath) {
            logWithContext("File dialog cancelled by user");
            updateUIState(uiElements, false, false);
            return false;
        }

        logWithContext(`File selected: ${filePath}`);

        // Step 2: Read file contents
        try {
            const filePathString = Array.isArray(filePath) ? filePath[0] : filePath;
            if (!filePathString) {
                throw new Error("No file path provided");
            }
            arrayBuffer = await globalThis.electronAPI.readFile(filePathString);
        } catch (error) {
            const errorMessage = `Error reading file: ${error}`;
            logWithContext(errorMessage, "error");
            showNotification(errorMessage, "error");
            updateUIState(uiElements, false, false);
            return false;
        }

        // Validate file size if requested
        if (config.validateFileSize && arrayBuffer.byteLength === 0) {
            const errorMessage = "Selected file appears to be empty";
            logWithContext(errorMessage, "error");
            showNotification(errorMessage, "error");
            updateUIState(uiElements, false, false);
            return false;
        }

        logWithContext(`File read successfully: ${arrayBuffer.byteLength} bytes`);

        // Step 3: Parse FIT file
        try {
            result = await globalThis.electronAPI.parseFitFile(arrayBuffer);
        } catch (error) {
            const errorMessage = `Error parsing FIT file: ${error}`;
            logWithContext(errorMessage, "error");
            showNotification(errorMessage, "error");
            updateUIState(uiElements, false, false);
            return false;
        }

        // Handle parsing errors
        if (result?.error) {
            showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
            updateUIState(uiElements, false, false);
            return false;
        }
        if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
            console.log("[DEBUG] FIT parse result:", result);
            const sessionCount = result.data?.sessions?.length || 0;
            console.log(`[HandleOpenFile] Debug: Parsed FIT data contains ${sessionCount} sessions`);
        }
        try {
            const filePathString = Array.isArray(filePath) ? filePath[0] : filePath;

            if (globalThis.showFitData) {
                // Try result.data first, but fall back to result if result.data is undefined/null
                const dataToShow = result.data || result;
                globalThis.showFitData(dataToShow, filePathString);
            }
            if (/** @type {*} */ (globalThis).sendFitFileToAltFitReader) {
                /** @type {*} */ (globalThis).sendFitFileToAltFitReader(arrayBuffer);
            }
        } catch (error) {
            showNotification(`Error displaying FIT data: ${error}`, "error");
        }

        // Update UI state to indicate loading is complete
        updateUIState(uiElements, false, false);
        return true; // Return true on successful processing
    } finally {
        /** @type {*} */ (isOpeningFileRef).value = false;
    }
}

/**
 * Logs messages with context for file open operations
 * @param {string} message - The message to log
 * @param {string} level - Log level ('info', 'warn', 'error')
 * @private
 */
function logWithContext(message, level = "info") {
    try {
        const prefix = FILE_OPEN_CONSTANTS.LOG_PREFIX;
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
 * Updates UI state during file opening process
 * @param {Object} uiElements - UI elements to update
 * @param {boolean} isLoading - Whether to show loading state
 * @param {boolean} isOpening - Whether file opening is in progress
 * @private
 */
function updateUIState(uiElements, isLoading, isOpening) {
    try {
        const { isOpeningFileRef, openFileBtn, setLoading } = /** @type {*} */ (uiElements);

        if (openFileBtn) {
            openFileBtn.disabled = isLoading;
        }

        if (typeof setLoading === "function") {
            setLoading(isLoading);
        }

        if (isOpeningFileRef && typeof isOpeningFileRef === "object") {
            isOpeningFileRef.value = isOpening;
        }

        // Update state management - log first for better test traceability
        console.log(`[HandleOpenFile] Setting isLoading=${isLoading}, app.isOpeningFile=${isOpening}`);

        // Use direct calls to stateManager.setState for both state updates
        stateManager.setState("app.isOpeningFile", isOpening, { source: "handleOpenFile" });
        stateManager.setState("isLoading", isLoading, { source: "handleOpenFile" });
    } catch (error) {
        logWithContext(`Error updating UI state: ${error instanceof Error ? error.message : String(error)}`, "error");
    }
}

/**
 * Validates that all required Electron API methods are available
 * @returns {boolean} True if all required APIs are available
 * @private
 */
function validateElectronAPI() {
    const { ELECTRON_API_METHODS } = FILE_OPEN_CONSTANTS;

    if (!globalThis.electronAPI) {
        logWithContext("Electron API not available", "error");
        return false;
    }

    const missingMethods = Object.values(ELECTRON_API_METHODS).filter(
        /** @param {string} method */ (method) =>
            typeof (/** @type {*} */ (globalThis.electronAPI)[method]) !== "function"
    );

    if (missingMethods.length > 0) {
        logWithContext(`Missing Electron API methods: ${missingMethods.join(", ")}`, "error");
        return false;
    }

    return true;
}

// Export functions for testing
export {
    // Only used in tests, never in production code
    __TEST_ONLY_exposedStateManager,
    handleOpenFile,
    logWithContext,
    updateUIState,
    validateElectronAPI,
};
