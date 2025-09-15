/**
 * Internal function to load a single FIT file as overlay
 * @param {File} file - File to load
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>} Load result
 * @private
 */
export async function loadSingleOverlayFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = async function (event) {
            try {
                const target = /** @type {FileReader|null} */ (event.target),
                    arrayBuffer = target && target.result;

                if (!arrayBuffer || !window.electronAPI?.decodeFitFile) {
                    resolve({ success: false, error: "No file data or decoder not available" });
                    return;
                }

                const fitData = await window.electronAPI.decodeFitFile(/** @type {ArrayBuffer} */ (arrayBuffer));

                if (!fitData || fitData.error) {
                    resolve({ success: false, error: fitData?.error || "Failed to parse FIT file" });
                    return;
                }

                // Validate that file has location data
                const validLocationCount = Array.isArray(fitData.recordMesgs)
                    ? fitData.recordMesgs.filter(
                          (/** @type {any} */ r) =>
                              typeof r.positionLat === "number" && typeof r.positionLong === "number"
                      ).length
                    : 0;

                if (
                    !Array.isArray(fitData.recordMesgs) ||
                    fitData.recordMesgs.length === 0 ||
                    validLocationCount === 0
                ) {
                    resolve({ success: false, error: "No valid location data found in file" });
                    return;
                }

                resolve({ success: true, data: fitData });
            } catch (error) {
                console.error("[mapActionButtons] Error processing file:", file.name, error);
                const anyErr = /** @type {any} */ (error);
                resolve({ success: false, error: anyErr?.message || "Unknown error processing file" });
            }
        };

        reader.onerror = () => {
            resolve({ success: false, error: "Failed to read file" });
        };

        reader.readAsArrayBuffer(file);
    });
}
