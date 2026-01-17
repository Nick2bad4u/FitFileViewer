/**
 * Internal function to load a single FIT file as overlay
 * @param {File} file - File to load
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} Load result
 * @private
 */
export async function loadSingleOverlayFile(file) {
    // Keep consistent with main-process IPC safety caps.
    const MAX_FIT_FILE_BYTES = 100 * 1024 * 1024;

    /**
     * @param {unknown} name
     */
    const isFitName = (name) =>
        typeof name === "string" && name.trim().length > 0 ? /\.fit$/iu.test(name.trim()) : true;

    try {
        // Fast preflight checks (avoid reading/decoding obviously-invalid inputs)
        if (file && typeof file === "object") {
            const name = /** @type {any} */ (file).name;
            if (!isFitName(name)) {
                return { error: "Only .fit files can be loaded as overlays", success: false };
            }

            const size = /** @type {any} */ (file).size;
            if (typeof size === "number" && Number.isFinite(size) && size > MAX_FIT_FILE_BYTES) {
                return { error: "File size exceeds 100MB limit", success: false };
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
            arrayBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.addEventListener("load", (event) => resolve(/** @type {any} */ (event.target)?.result));
                reader.onerror = () => reject(new Error("Failed to read file"));
                reader.readAsArrayBuffer(file);
            });
        }

        if (!(arrayBuffer instanceof ArrayBuffer)) {
            return { error: "Failed to read file as ArrayBuffer", success: false };
        }

        if (arrayBuffer.byteLength === 0) {
            return { error: "Selected file appears to be empty", success: false };
        }

        if (arrayBuffer.byteLength > MAX_FIT_FILE_BYTES) {
            return { error: "File size exceeds 100MB limit", success: false };
        }

        if (!arrayBuffer || !globalThis.electronAPI?.decodeFitFile) {
            return { error: "No file data or decoder not available", success: false };
        }

        const fitData = await globalThis.electronAPI.decodeFitFile(/** @type {ArrayBuffer} */ (arrayBuffer));
        if (!fitData || fitData.error) {
            return { error: fitData?.error || "Failed to parse FIT file", success: false };
        }

        // Validate that file has at least one valid coordinate without allocating/filtering
        // the entire record set (which can be large).
        const records = Array.isArray(fitData.recordMesgs) ? fitData.recordMesgs : null;
        let hasValidLocation = false;
        if (records) {
            for (const r of records) {
                if (r && typeof r === "object") {
                    const lat = /** @type {any} */ (r).positionLat;
                    const lon = /** @type {any} */ (r).positionLong;
                    if (typeof lat === "number" && typeof lon === "number") {
                        hasValidLocation = true;
                        break;
                    }
                }
            }
        }

        if (!records || records.length === 0 || !hasValidLocation) {
            return { error: "No valid location data found in file", success: false };
        }

        return { data: fitData, success: true };
    } catch (error) {
        console.error("[loadSingleOverlayFile] Error processing file:", file?.name, error);
        const anyErr = /** @type {any} */ (error);
        return { error: anyErr?.message || "Unknown error processing file", success: false };
    }
}
