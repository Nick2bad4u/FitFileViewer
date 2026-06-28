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
import { renderDecodedFitData } from "../../rendering/core/renderDecodedFitData.js";
import { fitFileStateManager } from "../../state/domain/fitFileState.js";
import { clearAllNotifications } from "../../ui/notifications/showNotification.js";
import {
    getFitMessagesSessionCount,
    getFitParseErrorMessage,
    unwrapFitParseMessages,
} from "./fitParsePayload.js";
import { getFitFileBufferValidationError } from "./fitFileValidation.js";
import { sendFitFileToAltFitReader } from "./sendFitFileToAltFitReader.js";
import type {
    ElectronDialogApi,
    ElectronFileApi,
} from "../../../shared/preloadApi.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import type { FitFileLoadingPhase } from "../../state/core/stateManagerDefaults.js";

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
    electronApiScope?: RendererElectronApiScope | undefined;
    timeout?: number;
    validateFileSize?: boolean;
};

type FileParseResult = Awaited<ReturnType<ElectronFileApi["parseFitFile"]>>;

type FileOpenElectronAPI = {
    readonly openFile: ElectronDialogApi["openFile"];
    readonly parseFitFile: ElectronFileApi["parseFitFile"];
    readonly readFile: ElectronFileApi["readFile"];
};

type FileOpenElectronApiMethods = Readonly<{
    readonly openFile?: ElectronDialogApi["openFile"];
    readonly parseFitFile?: ElectronFileApi["parseFitFile"];
    readonly readFile?: ElectronFileApi["readFile"];
}>;

type FitFileStateManagerFacade = {
    handleFileLoadingError: (error: Error) => void;
    startFileLoading?: (filePath: string) => void;
    transitionLoadingPhase?: (
        phase: FitFileLoadingPhase,
        options?: {
            error?: null | string;
            filePath?: null | string;
            progress?: number;
            source?: string;
        }
    ) => boolean;
    updateLoadingProgress?: (progress: number) => void;
};

// Constants for better maintainability
const FILE_OPEN_CONSTANTS = {
    ERROR_TIMEOUTS: {
        CRITICAL: 7000,
        DEFAULT: 5000,
    },
    LOG_PREFIX: "HandleOpenFile",
} as const;

const log = createRendererLogger(FILE_OPEN_CONSTANTS.LOG_PREFIX);

function isFileOpenElectronAPI(value: unknown): value is FileOpenElectronAPI {
    if (!isFileOpenElectronApiMethods(value)) {
        return false;
    }

    const openFile = readElectronApiValue(() => value.openFile);
    const parseFitFile = readElectronApiValue(() => value.parseFitFile);
    const readFile = readElectronApiValue(() => value.readFile);

    return (
        typeof openFile === "function" &&
        typeof parseFitFile === "function" &&
        typeof readFile === "function"
    );
}

function isFileOpenElectronApiMethods(
    value: unknown
): value is FileOpenElectronApiMethods {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readElectronApiValue(readValue: () => unknown): unknown {
    try {
        return readValue();
    } catch {
        return undefined;
    }
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
    const candidate = fitFileStateManager;

    if (
        candidate &&
        typeof candidate === "object" &&
        "handleFileLoadingError" in candidate &&
        typeof candidate.handleFileLoadingError === "function"
    ) {
        return candidate;
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
        notifyFileLoadPhase("selecting", {
            progress: 5,
            source: "handleOpenFile.selecting",
        });
        updateUIState(uiElements, true, true);

        const electronAPI = getValidatedElectronAPI(config.electronApiScope);
        if (!electronAPI) {
            showNotification(
                "Electron API not available. Please restart the app.",
                "error",
                FILE_OPEN_CONSTANTS.ERROR_TIMEOUTS.CRITICAL
            );
            notifyFileLoadPhase("error", {
                error: "Electron API not available. Please restart the app.",
                source: "handleOpenFile.electronApiUnavailable",
            });
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
            notifyFileLoadPhase("error", {
                error: message,
                source: "handleOpenFile.dialogError",
            });
            updateUIState(uiElements, false, false);
            return false;
        }

        if (!filePath) {
            log("info", "File dialog cancelled by user");
            notifyFileLoadPhase("idle", {
                source: "handleOpenFile.cancelled",
            });
            updateUIState(uiElements, false, false);
            return false;
        }

        const filePathString = Array.isArray(filePath) ? filePath[0] : filePath;
        log("info", "File selected", { filePath: filePathString });
        if (filePathString) {
            notifyFileLoadStarted(filePathString);
        }

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
        notifyFileLoadPhase("validating", {
            filePath: filePathString,
            progress: 45,
            source: "handleOpenFile.validating",
        });
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
            notifyFileLoadPhase("parsing", {
                filePath: filePathString,
                progress: 65,
                source: "handleOpenFile.parsing",
            });
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
            notifyFileLoadPhase("rendering", {
                filePath: filePathString,
                progress: 90,
                source: "handleOpenFile.rendering",
            });
            await renderDecodedFitData(fitData, filePathString, {
                electronApiScope: config.electronApiScope,
            });
            sendFitFileToAltFitReader(arrayBuffer);
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

function notifyFileLoadPhase(
    phase: FitFileLoadingPhase,
    options: {
        error?: null | string;
        filePath?: null | string;
        progress?: number;
        source?: string;
    } = {}
): boolean {
    try {
        const manager = resolveFitFileStateManager();
        if (!manager || typeof manager.transitionLoadingPhase !== "function") {
            return false;
        }

        return manager.transitionLoadingPhase(phase, options);
    } catch (error) {
        log("warn", "Failed to update file loading phase", {
            error: error instanceof Error ? error.message : String(error),
            phase,
        });
        return false;
    }
}

function notifyFileLoadStarted(filePath: string): boolean {
    try {
        const manager = resolveFitFileStateManager();
        if (!manager) {
            return false;
        }

        if (typeof manager.startFileLoading === "function") {
            manager.startFileLoading(filePath);
            return true;
        }

        return notifyFileLoadPhase("reading", {
            filePath,
            progress: 0,
            source: "handleOpenFile.reading",
        });
    } catch (error) {
        log("warn", "Failed to propagate file loading start", {
            error: error instanceof Error ? error.message : String(error),
            filePath,
        });
        return false;
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
function getValidatedElectronAPI(
    electronApiScope?: RendererElectronApiScope
): FileOpenElectronAPI | null {
    const electronAPI = getRendererElectronApi<FileOpenElectronAPI>(
        isFileOpenElectronAPI,
        electronApiScope
    );

    if (!electronAPI) {
        log("error", "Electron API not available");
        return null;
    }

    return electronAPI;
}

/** Validates that all required Electron API methods are available. */
function validateElectronAPI(
    electronApiScope?: RendererElectronApiScope
): boolean {
    return getValidatedElectronAPI(electronApiScope) !== null;
}

// Export functions for testing
export { handleOpenFile, logWithContext, updateUIState, validateElectronAPI };
