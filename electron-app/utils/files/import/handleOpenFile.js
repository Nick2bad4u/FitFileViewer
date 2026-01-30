/**
 * File open handling utility for FitFileViewer Provides secure file opening
 * with comprehensive error handling and state management integration
 */

import { AppActions } from "../../app/lifecycle/appActions.js";
import { createRendererLogger } from "../../logging/rendererLogger.js";
import * as stateManager from "../../state/core/stateManager.js";

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
    LOG_PREFIX: "HandleOpenFile",
};

const log = createRendererLogger(FILE_OPEN_CONSTANTS.LOG_PREFIX);

const resolveFitFileStateManager = () => {
    const candidate = /** @type {unknown} */ (
        globalThis.__FFV_fitFileStateManager
    );

    if (
        candidate &&
        typeof candidate === "object" &&
        "handleFileLoadingError" in candidate &&
        typeof (
            /** @type {{ handleFileLoadingError?: unknown }} */ (candidate)
                .handleFileLoadingError
        ) === "function"
    ) {
        return /** @type {{ handleFileLoadingError: (error: Error) => void }} */ (
            candidate
        );
    }

    return null;
};

/**
 * Handles file opening logic with comprehensive error handling and state
 * management
 *
 * @example
 *     // Basic usage
 *     const success = await handleOpenFile({
 *         isOpeningFileRef: { value: false },
 *         openFileBtn: document.getElementById("openFileBtn"),
 *         setLoading: (loading) => showLoadingSpinner(loading),
 *         showNotification: (msg, type) => displayMessage(msg, type),
 *     });
 *
 * @param {Object} params - Configuration object for file opening
 * @param {Object} params.isOpeningFileRef - Reference object to track opening
 *   state
 * @param {HTMLElement} params.openFileBtn - Open file button element
 * @param {Function} params.setLoading - Function to set loading state
 * @param {Function} params.showNotification - Function to show notifications
 * @param {Object} [options={}] - Additional options. Default is `{}`
 * @param {number} [options.timeout=30000] - Timeout for file operations in
 *   milliseconds. Default is `30000`
 * @param {boolean} [options.validateFileSize=true] - Whether to validate file
 *   size. Default is `true`
 *
 * @returns {Promise<boolean>} True if file was successfully opened and
 *   processed
 *
 * @public
 */
async function handleOpenFile(
    { isOpeningFileRef, openFileBtn, setLoading, showNotification },
    options = {}
) {
    const config = {
        timeout: 30_000,
        validateFileSize: true,
        ...options,
    };

    const openingRef = /** @type {{ value?: boolean }} */ (isOpeningFileRef);

    if (openingRef?.value) {
        log("warn", "File opening already in progress");
        if (typeof showNotification === "function") {
            showNotification(
                "File opening is already in progress. Please wait.",
                "warning"
            );
        }
        return false;
    }

    if (typeof showNotification !== "function") {
        log("error", "showNotification function is required");
        return false;
    }

    const uiElements = {
        isOpeningFileRef: openingRef,
        openFileBtn,
        setLoading,
    };

    try {
        AppActions.setFileOpening(true);
        updateUIState(uiElements, true, true);

        if (!validateElectronAPI()) {
            showNotification(
                "Electron API not available. Please restart the app.",
                "error",
                FILE_OPEN_CONSTANTS.ERROR_TIMEOUTS.CRITICAL
            );
            updateUIState(uiElements, false, false);
            return false;
        }

        log("info", "Opening file dialog");

        let filePath;
        try {
            filePath = await globalThis.electronAPI.openFile();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            log("error", "Failed to open file dialog", { error: message });
            showNotification(
                `Unable to open the file dialog. Please try again. Error details: ${message}`,
                "error"
            );
            updateUIState(uiElements, false, false);
            return false;
        }

        if (!filePath) {
            log("info", "File dialog cancelled by user");
            updateUIState(uiElements, false, false);
            return false;
        }

        const filePathString = Array.isArray(filePath) ? filePath[0] : filePath;
        log("info", "File selected", { filePath: filePathString });

        let arrayBuffer;
        try {
            if (!filePathString) {
                throw new Error("No file path provided");
            }
            arrayBuffer = await globalThis.electronAPI.readFile(filePathString);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            log("error", "Failed to read file", {
                error: message,
                filePath: filePathString,
            });
            showNotification(`Error reading file: ${message}`, "error");
            notifyFileLoadError(error);
            updateUIState(uiElements, false, false);
            return false;
        }

        if (config.validateFileSize && arrayBuffer.byteLength === 0) {
            const message = "Selected file appears to be empty";
            log("error", message, { filePath: filePathString });
            showNotification(message, "error");
            notifyFileLoadError(new Error(message));
            updateUIState(uiElements, false, false);
            return false;
        }

        log("info", "File read successfully", {
            bytes: arrayBuffer.byteLength,
        });

        let result;
        try {
            result = await globalThis.electronAPI.parseFitFile(arrayBuffer);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            log("error", "Failed to parse FIT file", { error: message });
            showNotification(`Error parsing FIT file: ${message}`, "error");
            notifyFileLoadError(error);
            updateUIState(uiElements, false, false);
            return false;
        }

        if (result?.error) {
            const details = result.details ? `\n${result.details}` : "";
            const message = `${result.error}${details}`;
            showNotification(`Error: ${message}`, "error");
            notifyFileLoadError(new Error(result.error));
            updateUIState(uiElements, false, false);
            return false;
        }

        if (
            typeof process !== "undefined" &&
            process.env &&
            process.env.NODE_ENV !== "production"
        ) {
            console.log("[DEBUG] FIT parse result:", result);
            const sessionCount = result.data?.sessions?.length || 0;
            console.log(
                `[HandleOpenFile] Debug: Parsed FIT data contains ${sessionCount} sessions`
            );
        }

        try {
            if (globalThis.showFitData) {
                globalThis.showFitData(result?.data || result, filePathString);
            }

            if (/** @type {any} */ (globalThis).sendFitFileToAltFitReader) {
                /** @type {any} */ (globalThis).sendFitFileToAltFitReader(
                    arrayBuffer
                );
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            log("error", "Failed to display FIT data", { error: message });
            showNotification(`Error displaying FIT data: ${message}`, "error");
            notifyFileLoadError(error);
            updateUIState(uiElements, false, false);
            return true;
        }

        updateUIState(uiElements, false, false);
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log("error", "Unexpected error during file open", { error: message });
        showNotification(
            `Unexpected error during file open: ${message}`,
            "error"
        );
        notifyFileLoadError(error);
        updateUIState(uiElements, false, false);
        return false;
    } finally {
        if (openingRef) {
            openingRef.value = false;
        }
        try {
            AppActions.setFileOpening(false);
        } catch {
            /* ignore */
        }
    }
}

function logWithContext(message, level = "info", context = {}) {
    const normalizedLevel =
        level === "error"
            ? "error"
            : level === "warn"
              ? "warn"
              : level === "debug"
                ? "debug"
                : "info";
    try {
        log(
            normalizedLevel,
            message,
            context && typeof context === "object" ? context : {}
        );
    } catch (error) {
        const safeMessage = `[${FILE_OPEN_CONSTANTS.LOG_PREFIX}] ${message}`;
        try {
            const consoleMethod =
                normalizedLevel in console ? normalizedLevel : "log";
            console[consoleMethod](safeMessage);
        } catch (innerError) {
            console.error(
                `[${FILE_OPEN_CONSTANTS.LOG_PREFIX}] Failed to log message`,
                {
                    error:
                        innerError instanceof Error
                            ? innerError.message
                            : innerError,
                    originalError:
                        error instanceof Error ? error.message : error,
                    message,
                }
            );
        }
    }
}

function notifyFileLoadError(error) {
    try {
        const manager = resolveFitFileStateManager();

        if (!manager || typeof manager.handleFileLoadingError !== "function") {
            return false;
        }
        const safeError =
            error instanceof Error ? error : new Error(String(error));
        manager.handleFileLoadingError(safeError);
        return true;
    } catch (notifyError) {
        log("warn", "Failed to propagate file loading error", {
            error:
                notifyError instanceof Error
                    ? notifyError.message
                    : String(notifyError),
        });
        return false;
    }
}

/**
 * Updates UI state during file opening process
 *
 * @private
 *
 * @param {Object} uiElements - UI elements to update
 * @param {boolean} isLoading - Whether to show loading state
 * @param {boolean} isOpening - Whether file opening is in progress
 */
function updateUIState(uiElements, isLoading, isOpening) {
    try {
        const { isOpeningFileRef, openFileBtn, setLoading } =
            /** @type {any} */ (uiElements);

        if (openFileBtn) {
            openFileBtn.disabled = isLoading;
        }

        if (typeof setLoading === "function") {
            setLoading(isLoading);
        }

        if (isOpeningFileRef && typeof isOpeningFileRef === "object") {
            isOpeningFileRef.value = isOpening;
        }

        if (typeof isOpening === "boolean") {
            AppActions.setFileOpening(isOpening);
        }

        log("info", "Updated UI state", { isLoading, isOpening });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log("error", "Error updating UI state", {
            error: message,
            isLoading,
            isOpening,
        });
    }
}

/**
 * Validates that all required Electron API methods are available.
 *
 * @returns {boolean}
 */
function validateElectronAPI() {
    const { ELECTRON_API_METHODS } = FILE_OPEN_CONSTANTS;

    if (!globalThis.electronAPI) {
        log("error", "Electron API not available");
        return false;
    }

    const missingMethods = Object.values(ELECTRON_API_METHODS).filter(
        /** @param {string} method */ (method) =>
            typeof (/** @type {any} */ (globalThis.electronAPI)[method]) !==
            "function"
    );

    if (missingMethods.length > 0) {
        log("error", "Missing Electron API methods", {
            methods: missingMethods,
        });
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
