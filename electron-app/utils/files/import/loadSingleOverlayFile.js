/**
 * Internal function to load a single FIT file as overlay
 * @param {File} file - File to load
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} Load result
 * @private
 */
export async function loadSingleOverlayFile(file) {
    // Prefer modern File.arrayBuffer when available for better testability
    try {
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
                reader.addEventListener('load', (event) => resolve(/** @type {any} */(event.target)?.result));
                reader.onerror = () => reject(new Error("Failed to read file"));
                reader.readAsArrayBuffer(file);
            });
        }

        if (!arrayBuffer || !globalThis.electronAPI?.decodeFitFile) {
            return { error: "No file data or decoder not available", success: false };
        }

        const fitData = await globalThis.electronAPI.decodeFitFile(/** @type {ArrayBuffer} */(arrayBuffer));
        if (!fitData || fitData.error) {
            return { error: fitData?.error || "Failed to parse FIT file", success: false };
        }

        // Validate that file has location data
        const validLocationCount = Array.isArray(fitData.recordMesgs)
            ? fitData.recordMesgs.filter(
                (/** @type {any} */ r) => typeof r.positionLat === "number" && typeof r.positionLong === "number"
            ).length
            : 0;

        if (!Array.isArray(fitData.recordMesgs) || fitData.recordMesgs.length === 0 || validLocationCount === 0) {
            return { error: "No valid location data found in file", success: false };
        }

        return { data: fitData, success: true };
    } catch (error) {
        console.error("[mapActionButtons] Error processing file:", file.name, error);
        const anyErr = /** @type {any} */ (error);
        return { error: anyErr?.message || "Unknown error processing file", success: false };
    }
}
