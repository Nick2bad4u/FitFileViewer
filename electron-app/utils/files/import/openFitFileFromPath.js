/**
 * Open a FIT file from a known absolute path.
 *
 * Used by the Browser tab (folder-based activity browsing) to open a selected
 * .fit file without showing the native file picker.
 */
/**
 * Open and parse a FIT file from a path exposed by the renderer file browser.
 *
 * @throws Never intentionally; failures are reported through notifications and
 *   file-state error handling.
 */
export async function openFitFileFromPath({ filePath, showNotification, openFileBtn, }) {
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
        if (!(arrayBuffer instanceof ArrayBuffer) ||
            !isValidFitBuffer(arrayBuffer)) {
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
        }
        catch {
            /* ignore */
        }
        showNotification("File loaded successfully!", "success");
        return true;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        showNotification(`Failed to open file: ${message}`, "error", 8000);
        const mgr = resolveFitFileStateManager();
        if (mgr) {
            try {
                mgr.handleFileLoadingError(new Error(message));
            }
            catch {
                /* ignore */
            }
        }
        return false;
    }
    finally {
        enableBtn();
    }
}
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function isValidFitBuffer(buffer) {
    // Hard cap: 100MB
    return buffer.byteLength > 0 && buffer.byteLength <= 100 * 1024 * 1024;
}
function getOpenFitFileGlobal() {
    return globalThis;
}
function resolveFitFileElectronAPI() {
    const { electronAPI } = getOpenFitFileGlobal();
    if (!electronAPI || typeof electronAPI !== "object") {
        return undefined;
    }
    if (typeof electronAPI.readFile !== "function" ||
        typeof electronAPI.parseFitFile !== "function") {
        return undefined;
    }
    return electronAPI;
}
function unwrapParsedFitData(result) {
    if (isParsedFitWrapper(result)) {
        return result.data;
    }
    return result;
}
function isFitDecodeResultLike(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isParsedFitWrapper(result) {
    if (!("data" in result)) {
        return false;
    }
    const candidate = result;
    return isFitDecodeResultLike(candidate.data);
}
/**
 * Resolve the renderer-side fit file state manager if it has been installed.
 * This is used only for reporting errors into the app state pipeline.
 */
function resolveFitFileStateManager() {
    const candidate = getOpenFitFileGlobal().__FFV_fitFileStateManager;
    if (!candidate || typeof candidate !== "object") {
        return undefined;
    }
    const mgr = candidate;
    if (typeof mgr.handleFileLoadingError !== "function") {
        return undefined;
    }
    return candidate;
}
