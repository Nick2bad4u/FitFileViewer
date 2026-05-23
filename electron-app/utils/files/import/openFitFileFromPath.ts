/**
 * Open a FIT file from a known absolute path.
 *
 * Used by the Browser tab (folder-based activity browsing) to open a selected
 * .fit file without showing the native file picker.
 */

import { getFitFileBufferValidationError } from "./fitFileValidation.js";
import { unwrapFitParseMessages } from "./fitParsePayload.js";
import type { FitParsePayload } from "./fitParsePayload.js";
import type { FitMessages } from "../../../shared/fit";

type FitFileStateManagerLike = {
    handleFileLoadingError: (error: Error) => void;
};

type FitFileElectronAPI = {
    notifyFitFileLoaded?: (filePath: string) => void;
    parseFitFile: (arrayBuffer: ArrayBuffer) => Promise<FitParsePayload>;
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
        const bufferValidationError =
            getFitFileBufferValidationError(arrayBuffer);
        if (bufferValidationError) {
            throw new Error(bufferValidationError);
        }

        const data = unwrapFitParseMessages(
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
