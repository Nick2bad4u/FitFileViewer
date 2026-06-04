/**
 * File open handling utility for FitFileViewer Provides secure file opening
 * with comprehensive error handling and state management integration
 */

import { AppActions } from "../../app/lifecycle/appActions.js";
import {
    createRendererLogger,
    type RendererLogLevel,
} from "../../logging/rendererLogger.js";
import { getProcessEnvironmentValue } from "../../runtime/processEnvironment.js";
import * as stateManager from "../../state/core/stateManager.js";
import { clearAllNotifications } from "../../ui/notifications/showNotification.js";
import {
    type FitParsePayload,
    getFitMessagesSessionCount,
    getFitParseErrorMessage,
    unwrapFitParseMessages,
} from "./fitParsePayload.js";
import { getFitFileBufferValidationError } from "./fitFileValidation.js";
import type { FitMessages } from "../../../shared/fit";
import type { ElectronAPI } from "../../../shared/preloadApi.js";

const __TEST_ONLY_exposedStateManager = stateManager;

type FileOpeningRef = { value?: boolean };

type FileOpenUiElements = {
    isOpeningFileRef?: FileOpeningRef | null | undefined;
    openFileBtn?: { disabled?: boolean } | null | undefined;
    setLoading?: ((isLoading: boolean) => void) | null | undefined;
};

type NotificationType = "error" | "info" | "success" | "warning";

type ShowNotification = (
    message: string,
    type?: NotificationType,
    duration?: number
) => void;

type HandleOpenFileParams = FileOpenUiElements & {
    showNotification?: ShowNotification | null | undefined;
};

type HandleOpenFileOptions = {
    timeout?: number;
    validateFileSize?: boolean;
};

type FileParseResult = FitParsePayload;

type FileOpenDialogResult =
    | Awaited<ReturnType<ElectronAPI["openFile"]>>
    | string[];

type FileOpenElectronAPI = Pick<ElectronAPI, "readFile"> & {
    openFile: () => Promise<FileOpenDialogResult>;
    parseFitFile: (
        arrayBuffer: Parameters<ElectronAPI["parseFitFile"]>[0]
    ) => Promise<FileParseResult>;
};

type FileOpenRendererGlobal = typeof globalThis & {
    __FFV_fitFileStateManager?: unknown;
    electronAPI?: Partial<FileOpenElectronAPI>;
    sendFitFileToAltFitReader?: (arrayBuffer: ArrayBuffer) => void;
    showFitData?: (data: FitMessages, fileName?: string) => void;
};

type FitFileStateManagerFacade = {
    handleFileLoadingError: (error: Error) => void;
};

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
} as const;

const log = createRendererLogger(FILE_OPEN_CONSTANTS.LOG_PREFIX);

const REQUIRED_ELECTRON_API_METHODS = [
    FILE_OPEN_CONSTANTS.ELECTRON_API_METHODS.OPEN_FILE,
    FILE_OPEN_CONSTANTS.ELECTRON_API_METHODS.PARSE_FIT_FILE,
    FILE_OPEN_CONSTANTS.ELECTRON_API_METHODS.READ_FILE,
] satisfies readonly (keyof FileOpenElectronAPI)[];

function isFileOpenElectronAPI(
    electronAPI: Partial<FileOpenElectronAPI>
): electronAPI is FileOpenElectronAPI {
    return REQUIRED_ELECTRON_API_METHODS.every(
        (method) => typeof electronAPI[method] === "function"
    );
}

function getFileOpenGlobal(): FileOpenRendererGlobal {
    return globalThis;
}

function isMissingFileError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /\bENOENT\b/u.test(message);
}

function getFileReadErrorMessage(error: unknown): string {
    if (isMissingFileError(error)) {
        return "File not found. It may have been moved, deleted, or opened from an old recent-file entry.";
    }

    return error instanceof Error ? error.message : String(error);
}

function showFileOpenErrorNotification(
    showNotification: ShowNotification,
    message: string,
    duration?: number
): void {
    clearAllNotifications();
    if (duration === undefined) {
        showNotification(message, "error");
        return;
    }

    showNotification(message, "error", duration);
}

const resolveFitFileStateManager = (): FitFileStateManagerFacade | null => {
    const candidate = getFileOpenGlobal().__FFV_fitFileStateManager;

    if (
        candidate &&
        typeof candidate === "object" &&
        "handleFileLoadingError" in candidate &&
        typeof (candidate as { handleFileLoadingError?: unknown })
            .handleFileLoadingError === "function"
    ) {
        return candidate as FitFileStateManagerFacade;
    }

    return null;
};

/**
 * Handles file opening with Electron file IO and renderer state updates.
 *
 * @throws Does not intentionally throw; internal validation failures are
 *   converted to a false return value.
 */
async function handleOpenFile(
    {
        isOpeningFileRef,
        openFileBtn,
        setLoading,
        showNotification,
    }: HandleOpenFileParams,
    options: HandleOpenFileOptions = {}
): Promise<boolean> {
    const config = {
        timeout: 30_000,
        validateFileSize: true,
        ...options,
    };

    const openingRef = isOpeningFileRef;

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

        const electronAPI = getValidatedElectronAPI();
        if (!electronAPI) {
            showNotification(
                "Electron API not available. Please restart the app.",
                "error",
                FILE_OPEN_CONSTANTS.ERROR_TIMEOUTS.CRITICAL
            );
            updateUIState(uiElements, false, false);
            return false;
        }

        log("info", "Opening file dialog");

        let filePath: null | string | string[];
        try {
            filePath = await electronAPI.openFile();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            log("error", "Failed to open file dialog", { error: message });
            showFileOpenErrorNotification(
                showNotification,
                `Unable to open the file dialog. Please try again. Error details: ${message}`
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

        let arrayBuffer: ArrayBuffer;
        try {
            if (!filePathString) {
                throw new Error("No file path provided");
            }
            arrayBuffer = await electronAPI.readFile(filePathString);
        } catch (error) {
            const message = getFileReadErrorMessage(error);
            log("error", "Failed to read file", {
                error: message,
                filePath: filePathString,
            });
            showFileOpenErrorNotification(
                showNotification,
                `Error reading file: ${message}`
            );
            notifyFileLoadError(error);
            updateUIState(uiElements, false, false);
            return false;
        }

        const bufferValidationError = getFitFileBufferValidationError(
            arrayBuffer,
            {
                allowEmpty: !config.validateFileSize,
                enforceMaxSize: config.validateFileSize,
            }
        );
        if (bufferValidationError) {
            const message = bufferValidationError;
            log("error", message, { filePath: filePathString });
            showFileOpenErrorNotification(showNotification, message);
            notifyFileLoadError(new Error(message));
            updateUIState(uiElements, false, false);
            return false;
        }

        log("info", "File read successfully", {
            bytes: arrayBuffer.byteLength,
        });

        let result: FileParseResult;
        try {
            result = await electronAPI.parseFitFile(arrayBuffer);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            log("error", "Failed to parse FIT file", { error: message });
            showFileOpenErrorNotification(
                showNotification,
                `Error parsing FIT file: ${message}`
            );
            notifyFileLoadError(error);
            updateUIState(uiElements, false, false);
            return false;
        }

        const parseErrorMessage = getFitParseErrorMessage(result);
        if (parseErrorMessage) {
            showFileOpenErrorNotification(
                showNotification,
                `Error: ${parseErrorMessage.display}`
            );
            notifyFileLoadError(new Error(parseErrorMessage.summary));
            updateUIState(uiElements, false, false);
            return false;
        }

        const fitData = unwrapFitParseMessages(result);

        if (
            getProcessEnvironmentValue("NODE_ENV") !== undefined &&
            getProcessEnvironmentValue("NODE_ENV") !== "production"
        ) {
            console.log("[DEBUG] FIT parse result:", result);
            const sessionCount = getFitMessagesSessionCount(fitData);
            console.log(
                `[HandleOpenFile] Debug: Parsed FIT data contains ${sessionCount} sessions`
            );
        }

        try {
            const { showFitData } = getFileOpenGlobal();
            if (typeof showFitData === "function") {
                showFitData(fitData, filePathString);
            }

            const { sendFitFileToAltFitReader } = getFileOpenGlobal();
            if (typeof sendFitFileToAltFitReader === "function") {
                sendFitFileToAltFitReader(arrayBuffer);
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            log("error", "Failed to display FIT data", { error: message });
            showFileOpenErrorNotification(
                showNotification,
                `Error displaying FIT data: ${message}`
            );
            notifyFileLoadError(error);
            updateUIState(uiElements, false, false);
            return true;
        }

        updateUIState(uiElements, false, false);
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log("error", "Unexpected error during file open", { error: message });
        showFileOpenErrorNotification(
            showNotification,
            `Unexpected error during file open: ${message}`
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

function logWithContext(
    message: string,
    level: RendererLogLevel = "info",
    context: Record<string, unknown> = {}
): void {
    const normalizedLevel: RendererLogLevel =
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
            const consoleMethod: RendererLogLevel | "log" =
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

function notifyFileLoadError(error: unknown): boolean {
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

/** Updates UI affordances while a file open operation is active. */
function updateUIState(
    uiElements: FileOpenUiElements,
    isLoading: boolean,
    isOpening: boolean
): void {
    try {
        const { isOpeningFileRef, openFileBtn, setLoading } = uiElements;

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

/** Validates that all required Electron API methods are available. */
function getValidatedElectronAPI(): FileOpenElectronAPI | null {
    const { electronAPI } = getFileOpenGlobal();

    if (!electronAPI) {
        log("error", "Electron API not available");
        return null;
    }

    if (!isFileOpenElectronAPI(electronAPI)) {
        log("error", "Missing Electron API methods", {
            methods: REQUIRED_ELECTRON_API_METHODS.filter(
                (method) => typeof electronAPI[method] !== "function"
            ),
        });
        return null;
    }

    return electronAPI;
}

/** Validates that all required Electron API methods are available. */
function validateElectronAPI(): boolean {
    return getValidatedElectronAPI() !== null;
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
