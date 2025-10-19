import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { openFileSelector } from "../../files/import/openFileSelector.js";
import { getState, subscribe } from "../../state/core/stateManager.js";
import { showNotification } from "../notifications/showNotification.js";

/**
 * Creates a button to add FIT files as overlays to the map
 * @returns {HTMLButtonElement} The configured add file button
 */

export function createAddFitFileToMapButton() {
    try {
        const addOverlayBtn = document.createElement("button");
        addOverlayBtn.className = "map-action-btn";
        addOverlayBtn.disabled = true;
        addOverlayBtn.setAttribute("aria-disabled", "true");

        const themeColors = getThemeColors();
        addOverlayBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 20 20" width="18" height="18">
                <path d="M10 2v16M2 10h16" stroke="${themeColors.primary}" stroke-width="2" fill="none"/>
            </svg>
            <span>Add FIT File(s) to Map</span>
        `;

        addOverlayBtn.title = "Overlay one or more FIT files on the map (points and tooltips will be shown)";
        addOverlayBtn.setAttribute("aria-label", "Add FIT files as map overlays");

        const updateAvailability = () => {
            try {
                const data = getState("globalData");
                const hasMainFile = Boolean(
                    data &&
                        typeof data === "object" &&
                        Array.isArray(/** @type {any} */ (data).recordMesgs) &&
                        /** @type {any} */ (data).recordMesgs.length > 0
                );
                addOverlayBtn.disabled = !hasMainFile;
                addOverlayBtn.setAttribute("aria-disabled", String(!hasMainFile));
            } catch (error) {
                console.warn("[MapActions] Unable to determine overlay availability:", error);
                addOverlayBtn.disabled = true;
                addOverlayBtn.setAttribute("aria-disabled", "true");
            }
        };

        updateAvailability();
        subscribe("globalData", updateAvailability);

        addOverlayBtn.addEventListener("click", async () => {
            try {
                if (addOverlayBtn.disabled) {
                    showNotification("Open a primary FIT file before adding overlays.", "info");
                    return;
                }
                await openFileSelector();
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
