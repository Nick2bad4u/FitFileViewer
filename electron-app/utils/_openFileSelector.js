import { LoadingOverlay } from "./LoadingOverlay.js";
import { _loadOverlayFiles } from "./_loadOverlayFiles.js";
import { showNotification } from "./showNotification.js";

/**
 * Internal function to handle file selection for overlay
 * @private
 */

export function _openFileSelector() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".fit";
    input.multiple = true;
    input.style.display = "none";

    input.addEventListener("change", async (e) => {
        try {
            if (!e.target.files?.length) return;

            const files = Array.from(e.target.files);
            await _loadOverlayFiles(files);
        } catch (error) {
            console.error("[MapActions] File loading failed:", error);
            showNotification("Failed to load FIT files", "error");
        } finally {
            LoadingOverlay.hide();
        }
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}
