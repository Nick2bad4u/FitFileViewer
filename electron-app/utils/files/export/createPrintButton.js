import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

/**
 * Creates a print/export button for the map
 * @returns {HTMLButtonElement} The configured print button
 */

export function createPrintButton() {
    try {
        const printBtn = document.createElement("button");
        printBtn.className = "map-action-btn print-button";

        const themeColors = getThemeColors();
        printBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
          <rect x="3" y="6" width="14" height="7" rx="2" fill="${themeColors["surface"]}" stroke="${themeColors["primary"]}" stroke-width="1.5"/>
          <rect x="5" y="2.5" width="10" height="3" rx="1" fill="${themeColors["primaryAlpha"]}" stroke="${themeColors["primary"]}" stroke-width="1"/>
          <rect x="6" y="14" width="8" height="2.5" rx="1" fill="${themeColors["primary"]}"/>
          <circle cx="15.5" cy="10" r="0.9" fill="${themeColors["primary"]}"/>
        </svg>
            <span>Print</span>
                `;

        printBtn.title = "Print or export the current map view";
        printBtn.setAttribute("aria-label", "Print or export map");

        printBtn.addEventListener("click", () => {
            try {
                window.print();
            } catch (error) {
                console.error("[MapActions] Print failed:", error);
                showNotification("Print failed. Please try again.", "error");
            }
        });

        return printBtn;
    } catch (error) {
        console.error("[MapActions][createPrintButton] Failed to create print button:", error);
        throw error;
    }
}
