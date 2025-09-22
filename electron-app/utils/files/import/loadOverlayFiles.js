import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { loadSingleOverlayFile } from "./loadSingleOverlayFile.js";

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
        if (!globalThis.loadedFitFiles || globalThis.loadedFitFiles.length === 0) {
            globalThis.loadedFitFiles =
                globalThis.globalData && globalThis.globalData.recordMesgs
                    ? [
                          {
                              data: globalThis.globalData,
                              filePath: globalThis.globalData?.cachedFilePath,
                          },
                      ]
                    : [];
        }

        // Process each file
        for (const file of files) {
            try {
                LoadingOverlay.show(`Loading ${loaded + 1} / ${files.length} files...`, file.name);

                // We intentionally process files sequentially to keep progress updates ordered and
                // to avoid spiking memory/CPU by parsing multiple large FIT files at once.
                // eslint-disable-next-line no-await-in-loop
                const result = await loadSingleOverlayFile(file);
                if (result.success) {
                    if (
                        globalThis.loadedFitFiles.some((f) => {
                            const loadedBase = f.filePath ? f.filePath.split(/[/\\]/).pop() : "";
                            return loadedBase === file.name;
                        })
                    ) {
                        showNotification(/** @type {any} */ (`${file.name} is already shown on the map`), "warning");
                    } else {
                        globalThis.loadedFitFiles.push({
                            data: result.data,
                            filePath: file.name,
                        });

                        // UI update deferred until after all files are processed
                    }
                } else {
                    invalidFiles.push(file.name);
                    showNotification(/** @type {any} */ (`Failed to load ${file.name}: ${result.error}`), "error");
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
        if (globalThis.renderMap) {
            globalThis.renderMap();
        }
        if (/** @type {any} */ (globalThis).updateShownFilesList) {
            /** @type {any} */ globalThis.updateShownFilesList();
        }

        // Show summary notification
        if (invalidFiles.length === files.length) {
            // All files failed
            showNotification(/** @type {any} */ (`Failed to load any of the ${files.length} files.`), "error");
        } else if (invalidFiles.length > 0) {
            // Some files failed
            const message = `${files.length - invalidFiles.length} files loaded successfully. ${invalidFiles.length} files failed.`;
            showNotification(/** @type {any} */ (message), "warning");
        } else {
            // All files succeeded
            showNotification(/** @type {any} */ (`Successfully loaded ${files.length} files`), "success");
        }
    } catch (error) {
        console.error("[loadOverlayFiles] Error in loadOverlayFiles:", error);
        LoadingOverlay.hide();
        showNotification("Failed to load overlay files", "error");
    }
}
