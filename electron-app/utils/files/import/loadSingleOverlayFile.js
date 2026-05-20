/**
 * @typedef {{
 *     cachedFilePath?: string;
 *     error?: string;
 *     recordMesgs?: unknown[];
 *     [key: string]: unknown;
 * }} OverlayFitData
 */
/**
 * @typedef {{
 *     decodeFitFile?: (arrayBuffer: ArrayBuffer) => Promise<OverlayFitData | null | undefined>;
 * }} OverlayElectronAPI
 */
/**
 * @typedef {typeof globalThis & {
 *     electronAPI?: OverlayElectronAPI;
 * }} OverlayFileGlobal
 */

/**
 * Internal function to load a single FIT file as overlay
 *
 * @private
 *
 * @param {File} file - File to load
 *
 * @returns {Promise<{ success: boolean; data?: OverlayFitData; error?: string }>} Load result
 */
export async function loadSingleOverlayFile(file) {
    // Keep consistent with main-process IPC safety caps.
    const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024;

    /**
     * @param {unknown} name
     */
    const isFitName = (name) =>
        typeof name === "string" && name.trim().length > 0
            ? /\.fit$/iu.test(name.trim())
            : true;

    try {
        // Fast preflight checks (avoid reading/decoding obviously-invalid inputs)
        if (file && typeof file === "object") {
            const fileInfo = /** @type {{ name?: unknown; size?: unknown }} */ (
                file
            );
            const { name, size } = fileInfo;
            if (!isFitName(name)) {
                return {
                    error: "Only .fit files can be loaded as overlays",
                    success: false,
                };
            }
            if (
                typeof size === "number" &&
                Number.isFinite(size) &&
                size > MAX_FIT_FILE_BYTES
            ) {
                return {
                    error: "File size exceeds 100MB limit",
                    success: false,
                };
            }
        }

        // Prefer modern File.arrayBuffer when available for better testability
        let arrayBuffer;
        if (typeof file.arrayBuffer === "function") {
            arrayBuffer = await file.arrayBuffer();
        }
        // If arrayBuffer is still falsy, try using the fetch/Response helper which works with Blob/File
        if (!arrayBuffer && typeof Response !== "undefined") {
            try {
                arrayBuffer = await new Response(file).arrayBuffer();
            } catch {
                // Ignore and fall through to FileReader
            }
        }
        if (!arrayBuffer) {
            arrayBuffer = await readFileWithFileReader(file);
        }

        if (!(arrayBuffer instanceof ArrayBuffer)) {
            return {
                error: "Failed to read file as ArrayBuffer",
                success: false,
            };
        }

        if (arrayBuffer.byteLength === 0) {
            return {
                error: "Selected file appears to be empty",
                success: false,
            };
        }

        if (arrayBuffer.byteLength > MAX_FIT_FILE_BYTES) {
            return { error: "File size exceeds 100MB limit", success: false };
        }

        const api = resolveOverlayElectronAPI();
        if (!arrayBuffer || !api) {
            return {
                error: "No file data or decoder not available",
                success: false,
            };
        }

        const fitData = await api.decodeFitFile(arrayBuffer);
        const fitDataError = getFitDataError(fitData);
        if (!fitData || fitDataError) {
            return {
                error: fitDataError || "Failed to parse FIT file",
                success: false,
            };
        }

        // Validate that file has at least one valid coordinate without allocating/filtering
        // the entire record set (which can be large).
        const records = Array.isArray(fitData.recordMesgs)
            ? fitData.recordMesgs
            : null;
        let hasValidLocation = false;
        if (records) {
            for (const r of records) {
                if (hasNumericLocation(r)) {
                    hasValidLocation = true;
                    break;
                }
            }
        }

        if (!records || records.length === 0 || !hasValidLocation) {
            return {
                error: "No valid location data found in file",
                success: false,
            };
        }

        return { data: fitData, success: true };
    } catch (error) {
        console.error(
            "[loadSingleOverlayFile] Error processing file:",
            file?.name,
            error
        );
        return {
            error: getErrorMessage(error),
            success: false,
        };
    }
}

/**
 * @returns {OverlayFileGlobal}
 */
function getOverlayFileGlobal() {
    return /** @type {OverlayFileGlobal} */ (globalThis);
}

/**
 * @returns {{ decodeFitFile: (arrayBuffer: ArrayBuffer) => Promise<OverlayFitData | null | undefined> } | null}
 */
function resolveOverlayElectronAPI() {
    const { electronAPI } = getOverlayFileGlobal();
    if (!electronAPI || typeof electronAPI.decodeFitFile !== "function") {
        return null;
    }

    return {
        decodeFitFile: electronAPI.decodeFitFile,
    };
}

/**
 * @param {File} file
 *
 * @returns {Promise<unknown>}
 */
function readFileWithFileReader(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * @param {OverlayFitData | null | undefined} fitData
 *
 * @returns {string | null}
 */
function getFitDataError(fitData) {
    if (!fitData || typeof fitData !== "object") {
        return null;
    }

    return typeof fitData.error === "string" && fitData.error.trim()
        ? fitData.error
        : null;
}

/**
 * @param {unknown} record
 *
 * @returns {boolean}
 */
function hasNumericLocation(record) {
    if (!record || typeof record !== "object") {
        return false;
    }

    const { positionLat, positionLong } =
        /** @type {{ positionLat?: unknown; positionLong?: unknown }} */ (
            record
        );

    return typeof positionLat === "number" && typeof positionLong === "number";
}

/**
 * @param {unknown} error
 *
 * @returns {string}
 */
function getErrorMessage(error) {
    return error instanceof Error && error.message
        ? error.message
        : "Unknown error processing file";
}
