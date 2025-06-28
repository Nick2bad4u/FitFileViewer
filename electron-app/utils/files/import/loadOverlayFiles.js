import { loadSingleOverlayFile } from "./loadSingleOverlayFile.js";
import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

/**
 * Loads FIT files as overlays.
 * @param {File[]} files - Array of files to load
 * @returns {Promise<void>} Resolves when all files have been processed
 */
export async function loadOverlayFiles(files) {
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

                const result = await loadSingleOverlayFile(file);
                if (result.success) {
                    if (
                        !window.loadedFitFiles.some((f) => {
                            const loadedBase = f.filePath ? f.filePath.split(/[\\/]/).pop() : "";
                            return loadedBase === file.name;
                        })
                    ) {
                        window.loadedFitFiles.push({
                            data: result.data,
                            filePath: file.name,
                        });

                        // UI update deferred until after all files are processed
                    } else {
                        showNotification("File already loaded", `${file.name} is already shown on the map`, "warning");
                    }
                } else {
                    invalidFiles.push(file.name);
                    showNotification("File load failed", `Failed to load ${file.name}: ${result.error}`, "error");
                }

                loaded++;
            } catch (error) {
                console.error("[loadOverlayFiles] Error loading overlay file:", file.name, error);
                invalidFiles.push(file.name);
                loaded++;
            }
        }

        LoadingOverlay.hide();

        // Batch update UI after all files are processed
        if (window.renderMap) window.renderMap();
        if (window.updateShownFilesList) window.updateShownFilesList();

        // Show summary notification
        if (invalidFiles.length === files.length) {
            // All files failed
            showNotification("Load failed", `Failed to load any of the ${files.length} files.`, "error");
        } else if (invalidFiles.length > 0) {
            // Some files failed
            const message = `${files.length - invalidFiles.length} files loaded successfully. ${invalidFiles.length} files failed.`;
            showNotification("Load complete with errors", message, "warning");
        } else {
            // All files succeeded
            showNotification("Load complete", `Successfully loaded ${files.length} files`, "success");
        }
    } catch (error) {
        console.error("[loadOverlayFiles] Error in loadOverlayFiles:", error);
        LoadingOverlay.hide();
        showNotification("Load failed", "Failed to load overlay files", "error");
    }
}
