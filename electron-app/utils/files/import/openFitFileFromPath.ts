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

type FitFileElectronAPI = {
    readonly notifyFitFileLoaded?: ElectronPreloadEventApi["notifyFitFileLoaded"];
    readonly parseFitFile: ElectronFileApi["parseFitFile"];
    readonly readFile: ElectronFileApi["readFile"];
};

type FitFileElectronApiMethods = Readonly<{
    readonly notifyFitFileLoaded?: ElectronPreloadEventApi["notifyFitFileLoaded"];
    readonly parseFitFile?: ElectronFileApi["parseFitFile"];
    readonly readFile?: ElectronFileApi["readFile"];
}>;

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

        try {
            fitFileStateManager.handleFileLoadingError(new Error(message));
        } catch {
            /* ignore */
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
    if (!isFitFileElectronApiMethods(value)) {
        return false;
    }

    const readFile = readElectronApiValue(() => value.readFile);
    const parseFitFile = readElectronApiValue(() => value.parseFitFile);
    const notifyFitFileLoaded = readElectronApiValue(
        () => value.notifyFitFileLoaded
    );

    return (
        typeof readFile === "function" &&
        typeof parseFitFile === "function" &&
        hasOptionalFunction(notifyFitFileLoaded)
    );
}

function isFitFileElectronApiMethods(
    value: unknown
): value is FitFileElectronApiMethods {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readElectronApiValue(readValue: () => unknown): unknown {
    try {
        return readValue();
    } catch {
        return undefined;
    }
}

function hasOptionalFunction(value: unknown): boolean {
    return value === undefined || typeof value === "function";
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
        return fitFileStateManager.transitionLoadingPhase(phase, options);
    } catch {
        return false;
    }
}

function notifyFileLoadStarted(filePath: string): boolean {
    try {
        fitFileStateManager.startFileLoading(filePath);
        return true;
    } catch {
        return false;
    }
}
