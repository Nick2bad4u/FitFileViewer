/**
 * Open a FIT file from a known absolute path.
 *
 * Used by the Browser tab (folder-based activity browsing) to open a selected
 * .fit file without showing the native file picker.
 */

/**
 * @typedef {{ handleFileLoadingError?: (error: Error) => void }} FitFileStateManagerLike
 */
/** @typedef {import("../../../shared/fit").FitDecodeResult} FitDecodeResult */
/**
 * @typedef {{
 *     notifyFitFileLoaded?: (filePath: string) => void;
 *     parseFitFile: (arrayBuffer: ArrayBuffer) => Promise<FitDecodeResult | { data: FitDecodeResult }>;
 *     readFile: (filePath: string) => Promise<ArrayBuffer>;
 * }} FitFileElectronAPI
 */
/**
 * @typedef {typeof globalThis & {
 *     __FFV_fitFileStateManager?: unknown;
 *     electronAPI?: Partial<FitFileElectronAPI>;
 *     showFitData?: (data: FitDecodeResult, filePath: string) => void;
 * }} OpenFitFileGlobal
 */

/**
 * @param {Object} params
 * @param {string} params.filePath
 * @param {(message: string, type: string, timeout?: number) => void} params.showNotification
 * @param {HTMLElement} [params.openFileBtn]
 *
 * @returns {Promise<boolean>}
 */
export async function openFitFileFromPath({
    filePath,
    showNotification,
    openFileBtn,
}) {
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

    const disableBtn = () => {
        if (openFileBtn instanceof HTMLElement) {
            openFileBtn.setAttribute("disabled", "true");
        }
    };

    const enableBtn = () => {
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

        const data = unwrapParsedFitData(await api.parseFitFile(arrayBuffer));

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

/**
 * @param {unknown} value
 *
 * @returns {value is string}
 */
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

/**
 * @param {ArrayBuffer} buffer
 *
 * @returns {boolean}
 */
function isValidFitBuffer(buffer) {
    // Hard cap: 100MB
    return buffer.byteLength > 0 && buffer.byteLength <= 100 * 1024 * 1024;
}

/**
 * @returns {OpenFitFileGlobal}
 */
function getOpenFitFileGlobal() {
    return /** @type {OpenFitFileGlobal} */ (globalThis);
}

/**
 * @returns {FitFileElectronAPI | null}
 */
function resolveFitFileElectronAPI() {
    const { electronAPI } = getOpenFitFileGlobal();
    if (!electronAPI || typeof electronAPI !== "object") {
        return null;
    }

    if (
        typeof electronAPI.readFile !== "function" ||
        typeof electronAPI.parseFitFile !== "function"
    ) {
        return null;
    }

    return /** @type {FitFileElectronAPI} */ (electronAPI);
}

/**
 * @param {FitDecodeResult | { data: FitDecodeResult }} result
 *
 * @returns {FitDecodeResult}
 */
function unwrapParsedFitData(result) {
    if (result && typeof result === "object" && "data" in result) {
        return result.data;
    }

    return result;
}

/**
 * Resolve the renderer-side fit file state manager if it has been installed.
 * This is used only for reporting errors into the app state pipeline.
 *
 * @returns {FitFileStateManagerLike | null}
 */
function resolveFitFileStateManager() {
    const candidate = /** @type {unknown} */ (
        globalThis.__FFV_fitFileStateManager
    );

    if (!candidate || typeof candidate !== "object") {
        return null;
    }

    const mgr = /** @type {{ handleFileLoadingError?: unknown }} */ (candidate);
    if (typeof mgr.handleFileLoadingError !== "function") {
        return null;
    }

    return /** @type {FitFileStateManagerLike} */ (candidate);
}
