import { showNotification } from "../../ui/notifications/showNotification.js";

/**
 * Creates a print/export button for the map
 * @returns {HTMLButtonElement} The configured print button
 */
export function createPrintButton() {
    try {
        const printBtn = document.createElement("button");
        printBtn.className = "map-action-btn";
        printBtn.innerHTML = `
            <iconify-icon icon="flat-color-icons:print" width="18" height="18"></iconify-icon>
            <span>Print</span>
        `;
        printBtn.title = "Print or export the current map view";
        printBtn.setAttribute("aria-label", "Print or export map");

        printBtn.addEventListener("click", () => {
            try {
                globalThis.print();
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
