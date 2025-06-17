import { _loadSingleOverlayFile } from "./_loadSingleOverlayFile.js";
import { LoadingOverlay } from "./LoadingOverlay.js";
import { showNotification } from "./showNotification.js";

/**
 * Internal function to load FIT files as overlays
 * @param {File[]} files - Array of files to load
 * @private
 */

export async function _loadOverlayFiles(files) {
    try {
        LoadingOverlay.show(`Loading 0 / ${files.length} files...`);

        let loaded = 0;
        const invalidFiles = [];

        // Initialize loaded files array if needed
        if (!window.loadedFitFiles || window.loadedFitFiles.length === 0) {
            if (window.globalData && window.globalData.recordMesgs) {
                window.loadedFitFiles = [
                    {
                        data: window.globalData,
                        filePath: window.globalData?.cachedFilePath,
                    },
                ];
            } else {
                window.loadedFitFiles = [];
            }
        }

        // Process each file
        for (const file of files) {
            try {
                LoadingOverlay.show(`Loading ${loaded + 1} / ${files.length} files...`, file.name);

                const result = await _loadSingleOverlayFile(file);
                if (result.success) {
                    if (!window.loadedFitFiles.some((f) => f.filePath?.toLowerCase() === file.name.toLowerCase())) {
                        window.loadedFitFiles.push({
                            data: result.data,
                            filePath: file.name,
                        });

                        // Update UI
                        if (window.renderMap) window.renderMap();
                        if (window.updateShownFilesList) window.updateShownFilesList();
                    } else {
                        showNotification("File already loaded", `${file.name} is already shown on the map`, "warning");
                    }
                } else {
                    invalidFiles.push(file.name);
                    showNotification("File load failed", `Failed to load ${file.name}: ${result.error}`, "error");
                }

                loaded++;
            } catch (error) {
                console.error("[mapActionButtons] Error loading overlay file:", file.name, error);
                invalidFiles.push(file.name);
                loaded++;
            }
        }

        LoadingOverlay.hide();

        // Show summary notification
        if (invalidFiles.length > 0) {
            const message = `${files.length - invalidFiles.length} files loaded successfully. ${invalidFiles.length} files failed.`;
            showNotification("Load complete with errors", message, "warning");
        } else {
            showNotification("Load complete", `Successfully loaded ${files.length} files`, "success");
        }
    } catch (error) {
        console.error("[mapActionButtons] Error in _loadOverlayFiles:", error);
        LoadingOverlay.hide();
        showNotification("Load failed", "Failed to load overlay files", "error");
    }
}
