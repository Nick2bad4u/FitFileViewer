import { getThemeColors } from "./getThemeColors.js";
import { openFileSelector } from "./openFileSelector.js";
import { showNotification } from "./showNotification.js";

/**
 * Creates a button to add FIT files as overlays to the map
 * @returns {HTMLButtonElement} The configured add file button
 */

export function createAddFitFileToMapButton() {
    try {
        const addOverlayBtn = document.createElement("button");
        addOverlayBtn.className = "map-action-btn";

        const themeColors = getThemeColors();
        addOverlayBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 20 20" width="18" height="18">
                <path d="M10 2v16M2 10h16" stroke="${themeColors.primary}" stroke-width="2" fill="none"/>
            </svg> 
            <span>Add FIT File(s) to Map</span>
        `;

        addOverlayBtn.title = "Overlay one or more FIT files on the map (points and tooltips will be shown)";
        addOverlayBtn.setAttribute("aria-label", "Add FIT files as map overlays");

        addOverlayBtn.addEventListener("click", () => {
            try {
                openFileSelector();
            } catch (error) {
                console.error("[MapActions] Failed to open file selector:", error);
                showNotification("Failed to open file selector", "error");
            }
        });

        return addOverlayBtn;
    } catch (error) {
        console.error("[MapActions] Failed to create add file button:", error);
        throw error;
    }
}
