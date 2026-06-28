/**
 * Open a FIT file from a known absolute path.
 *
 * Used by the Browser tab (folder-based activity browsing) to open a selected
 * .fit file without showing the native file picker.
 */

import { getFitFileBufferValidationError } from "./fitFileValidation.js";
import { unwrapFitParseMessages } from "./fitParsePayload.js";
import { getOpenFitFileFromPathRuntime } from "./openFitFileFromPathRuntime.js";
import { sendFitFileToAltFitReader } from "./sendFitFileToAltFitReader.js";
import type {
    ElectronFileApi,
    ElectronPreloadEventApi,
} from "../../../shared/preloadApi.js";
import { renderDecodedFitData } from "../../rendering/core/renderDecodedFitData.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import type { FitFileLoadingPhase } from "../../state/core/stateManagerDefaults.js";
import { fitFileStateManager } from "../../state/domain/fitFileState.js";

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

type FitFileElectronAPI = {
    readonly notifyFitFileLoaded?: ElectronPreloadEventApi["notifyFitFileLoaded"];
    readonly parseFitFile: ElectronFileApi["parseFitFile"];
    readonly readFile: ElectronFileApi["readFile"];
};

type ShowNotification = (
    message: string,
    type: string,
    timeout?: number
) => void;

type OpenFitFileFromPathParams = {
    electronApiScope?: RendererElectronApiScope | undefined;
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
    electronApiScope,
    filePath,
    showNotification,
    openFileBtn,
}: OpenFitFileFromPathParams): Promise<boolean> {
    if (!isNonEmptyString(filePath)) {
        showNotification("Invalid file path.", "error");
        return false;
    }

    const api = resolveFitFileElectronAPI(electronApiScope);
    if (!api) {
        showNotification("Electron file API unavailable.", "error");
        return false;
    }
    const runtime = getOpenFitFileFromPathRuntime();

    const disableBtn = (): void => {
        if (runtime.isHTMLElement(openFileBtn)) {
            openFileBtn.setAttribute("disabled", "true");
        }
    };

    const enableBtn = (): void => {
        if (runtime.isHTMLElement(openFileBtn)) {
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

        notifyFileLoadPhase("rendering", {
            filePath,
            progress: 90,
            source: "openFitFileFromPath.rendering",
        });
        await renderDecodedFitData(data, filePath, { electronApiScope });

        sendFitFileToAltFitReader(arrayBuffer);

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

function resolveFitFileElectronAPI(
    electronApiScope: RendererElectronApiScope | undefined
): FitFileElectronAPI | undefined {
    return (
        getRendererElectronApi<FitFileElectronAPI>(
            isFitFileElectronAPI,
            electronApiScope
        ) ?? undefined
    );
}

function isFitFileElectronAPI(value: unknown): value is FitFileElectronAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    return (
        typeof Reflect.get(value, "readFile") === "function" &&
        typeof Reflect.get(value, "parseFitFile") === "function" &&
        hasOptionalFunctionProperty(value, "notifyFitFileLoaded")
    );
}

function hasOptionalFunctionProperty(
    value: object,
    propertyKey: string
): boolean {
    const propertyValue = Reflect.get(value, propertyKey);
    return propertyValue === undefined || typeof propertyValue === "function";
}

/**
 * Resolve the renderer-side fit file state manager if it has been installed.
 * This is used only for reporting errors into the app state pipeline.
 */
function resolveFitFileStateManager(): FitFileStateManagerLike | undefined {
    const candidate = fitFileStateManager;

    if (!candidate || typeof candidate !== "object") {
        return undefined;
    }

    if (typeof candidate.handleFileLoadingError !== "function") {
        return undefined;
    }

    return candidate;
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
