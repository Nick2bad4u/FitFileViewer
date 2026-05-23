/**
 * Open a FIT file from a known absolute path.
 *
 * Used by the Browser tab (folder-based activity browsing) to open a selected
 * .fit file without showing the native file picker.
 */

import type {
    FitDecodeErrorPayload,
    FitDecodeResult,
    FitMessages,
} from "../../../shared/fit";

type FitFileStateManagerLike = {
    handleFileLoadingError: (error: Error) => void;
};

type ParsedFitPayload = FitDecodeResult | { data: FitDecodeResult };

type FitFileElectronAPI = {
    notifyFitFileLoaded?: (filePath: string) => void;
    parseFitFile: (arrayBuffer: ArrayBuffer) => Promise<ParsedFitPayload>;
    readFile: (filePath: string) => Promise<ArrayBuffer>;
};

type OpenFitFileGlobal = typeof globalThis & {
    __FFV_fitFileStateManager?: unknown;
    electronAPI?: Partial<FitFileElectronAPI>;
    showFitData?: (data: FitMessages, filePath: string) => void;
};

type ShowNotification = (
    message: string,
    type: string,
    timeout?: number
) => void;

type OpenFitFileFromPathParams = {
    filePath: string;
    openFileBtn?: HTMLElement;
    showNotification: ShowNotification;
};

/**
 * Open and parse a FIT file from a path exposed by the renderer file browser.
 *
 * @throws Never intentionally; failures are reported through notifications and
 *   file-state error handling.
 */
export async function openFitFileFromPath({
    filePath,
    showNotification,
    openFileBtn,
}: OpenFitFileFromPathParams): Promise<boolean> {
    if (!isNonEmptyString(filePath)) {
        showNotification("Invalid file path.", "error");
        return false;
    }

    const appGlobal = getOpenFitFileGlobal();
    const api = resolveFitFileElectronAPI();
    if (!api) {
        showNotification("Electron file API unavailable.", "error");
        return false;
    }

    const disableBtn = (): void => {
        if (openFileBtn instanceof HTMLElement) {
            openFileBtn.setAttribute("disabled", "true");
        }
    };

    const enableBtn = (): void => {
        if (openFileBtn instanceof HTMLElement) {
            openFileBtn.removeAttribute("disabled");
        }
    };

    try {
        disableBtn();

        const arrayBuffer = await api.readFile(filePath);
        if (
            !(arrayBuffer instanceof ArrayBuffer) ||
            !isValidFitBuffer(arrayBuffer)
        ) {
            throw new Error("Invalid or unsupported file buffer");
        }

        const data = unwrapParsedFitMessages(
            await api.parseFitFile(arrayBuffer)
        );

        if (typeof appGlobal.showFitData !== "function") {
            throw new TypeError("showFitData is not available");
        }

        appGlobal.showFitData(data, filePath);

        try {
            if (typeof api.notifyFitFileLoaded === "function") {
                api.notifyFitFileLoaded(filePath);
            }
        } catch {
            /* ignore */
        }

        showNotification("File loaded successfully!", "success");
        return true;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showNotification(`Failed to open file: ${message}`, "error", 8000);

        const mgr = resolveFitFileStateManager();
        if (mgr) {
            try {
                mgr.handleFileLoadingError(new Error(message));
            } catch {
                /* ignore */
            }
        }

        return false;
    } finally {
        enableBtn();
    }
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function isValidFitBuffer(buffer: ArrayBuffer): boolean {
    // Hard cap: 100MB
    return buffer.byteLength > 0 && buffer.byteLength <= 100 * 1024 * 1024;
}

function getOpenFitFileGlobal(): OpenFitFileGlobal {
    return globalThis as OpenFitFileGlobal;
}

function resolveFitFileElectronAPI(): FitFileElectronAPI | undefined {
    const { electronAPI } = getOpenFitFileGlobal();
    if (!electronAPI || typeof electronAPI !== "object") {
        return undefined;
    }

    if (
        typeof electronAPI.readFile !== "function" ||
        typeof electronAPI.parseFitFile !== "function"
    ) {
        return undefined;
    }

    return electronAPI as FitFileElectronAPI;
}

function unwrapParsedFitMessages(result: ParsedFitPayload): FitMessages {
    const decoded = unwrapParsedFitData(result);

    if (isFitDecodeErrorPayload(decoded)) {
        throw new Error(formatFitDecodeError(decoded));
    }

    return decoded;
}

function unwrapParsedFitData(result: ParsedFitPayload): FitDecodeResult {
    if (isParsedFitWrapper(result)) {
        return result.data;
    }

    return result;
}

function isFitDecodeErrorPayload(
    value: FitDecodeResult
): value is FitDecodeErrorPayload {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        typeof (value as { error?: unknown }).error === "string"
    );
}

function formatFitDecodeError(errorPayload: FitDecodeErrorPayload): string {
    if (typeof errorPayload.details === "string") {
        return `${errorPayload.error}\n${errorPayload.details}`;
    }

    return errorPayload.error;
}

function isFitDecodeResultLike(value: unknown): value is FitDecodeResult {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isParsedFitWrapper(
    result: ParsedFitPayload
): result is { data: FitDecodeResult } {
    if (!("data" in result)) {
        return false;
    }

    const candidate = result as { data?: unknown };
    return isFitDecodeResultLike(candidate.data);
}

/**
 * Resolve the renderer-side fit file state manager if it has been installed.
 * This is used only for reporting errors into the app state pipeline.
 */
function resolveFitFileStateManager(): FitFileStateManagerLike | undefined {
    const candidate = getOpenFitFileGlobal().__FFV_fitFileStateManager;

    if (!candidate || typeof candidate !== "object") {
        return undefined;
    }

    const mgr = candidate as { handleFileLoadingError?: unknown };
    if (typeof mgr.handleFileLoadingError !== "function") {
        return undefined;
    }

    return candidate as FitFileStateManagerLike;
}
