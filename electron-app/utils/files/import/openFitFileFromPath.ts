/**
 * Open a FIT file from a known absolute path.
 *
 * Used by the Browser tab (folder-based activity browsing) to open a selected
 * .fit file without showing the native file picker.
 */

import { getFitFileBufferValidationError } from "./fitFileValidation.js";
import {
    type FitParsePayload,
    unwrapFitParseMessages,
} from "./fitParsePayload.js";
import type { FitMessages } from "../../../shared/fit";
import type { ElectronAPI } from "../../../shared/preloadApi.js";
import type { FitFileLoadingPhase } from "../../state/core/stateManagerDefaults.js";

type FitFileStateManagerLike = {
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
};

type FitFileElectronAPI = Pick<ElectronAPI, "readFile"> &
    Partial<Pick<ElectronAPI, "notifyFitFileLoaded">> & {
        parseFitFile: (
            arrayBuffer: Parameters<ElectronAPI["parseFitFile"]>[0]
        ) => Promise<FitParsePayload>;
    };

type OpenFitFileGlobal = typeof globalThis & {
    __FFV_fitFileStateManager?: unknown;
    electronAPI?: Partial<FitFileElectronAPI>;
    sendFitFileToAltFitReader?: (arrayBuffer: ArrayBuffer) => void;
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
        notifyFileLoadStarted(filePath);

        const arrayBuffer = await api.readFile(filePath);
        notifyFileLoadPhase("validating", {
            filePath,
            progress: 45,
            source: "openFitFileFromPath.validating",
        });
        const bufferValidationError =
            getFitFileBufferValidationError(arrayBuffer);
        if (bufferValidationError) {
            throw new Error(bufferValidationError);
        }

        notifyFileLoadPhase("parsing", {
            filePath,
            progress: 65,
            source: "openFitFileFromPath.parsing",
        });
        const data = unwrapFitParseMessages(
            await api.parseFitFile(arrayBuffer)
        );

        if (typeof appGlobal.showFitData !== "function") {
            throw new TypeError("showFitData is not available");
        }

        notifyFileLoadPhase("rendering", {
            filePath,
            progress: 90,
            source: "openFitFileFromPath.rendering",
        });
        appGlobal.showFitData(data, filePath);

        if (typeof appGlobal.sendFitFileToAltFitReader === "function") {
            appGlobal.sendFitFileToAltFitReader(arrayBuffer);
        }

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
    return globalThis;
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

function notifyFileLoadPhase(
    phase: FitFileLoadingPhase,
    options: {
        error?: null | string;
        filePath?: null | string;
        progress?: number;
        source?: string;
    } = {}
): boolean {
    const mgr = resolveFitFileStateManager();
    if (!mgr || typeof mgr.transitionLoadingPhase !== "function") {
        return false;
    }

    try {
        return mgr.transitionLoadingPhase(phase, options);
    } catch {
        return false;
    }
}

function notifyFileLoadStarted(filePath: string): boolean {
    const mgr = resolveFitFileStateManager();
    if (!mgr) {
        return false;
    }

    try {
        if (typeof mgr.startFileLoading === "function") {
            mgr.startFileLoading(filePath);
            return true;
        }

        return notifyFileLoadPhase("reading", {
            filePath,
            progress: 0,
            source: "openFitFileFromPath.reading",
        });
    } catch {
        return false;
    }
}
