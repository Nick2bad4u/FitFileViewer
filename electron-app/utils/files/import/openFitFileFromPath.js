/**
 * Open a FIT file from a known absolute path.
 *
 * Used by the Browser tab (folder-based activity browsing) to open a selected
 * .fit file without showing the native file picker.
 */

/**
 * @typedef {{ handleFileLoadingError?: (error: Error) => void }} FitFileStateManagerLike
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

    const api = /** @type {any} */ (globalThis).electronAPI;
    if (
        !api ||
        typeof api.readFile !== "function" ||
        typeof api.parseFitFile !== "function"
    ) {
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

        const result = await api.parseFitFile(arrayBuffer);
        const data =
            result && typeof result === "object" && "data" in result
                ? /** @type {any} */ (result).data
                : result;

        if (typeof globalThis.showFitData !== "function") {
            throw new TypeError("showFitData is not available");
        }

        globalThis.showFitData(data, filePath);

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
 * Resolve the renderer-side fit file state manager if it has been installed.
 * This is used only for reporting errors into the app state pipeline.
 *
 * @returns {FitFileStateManagerLike | null}
 */
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
