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

        // Security/robustness: avoid innerHTML for UI components.
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "icon");
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");

        const primary = themeColors.primary || "#3b82f6";
        const primaryAlpha = themeColors.primaryAlpha || "rgba(59, 130, 246, 0.2)";
        const surface = themeColors.surface || "#ffffff";

        const rect1 = document.createElementNS(svgNS, "rect");
        rect1.setAttribute("x", "3");
        rect1.setAttribute("y", "6");
        rect1.setAttribute("width", "14");
        rect1.setAttribute("height", "7");
        rect1.setAttribute("rx", "2");
        rect1.setAttribute("fill", surface);
        rect1.setAttribute("stroke", primary);
        rect1.setAttribute("stroke-width", "1.5");

        const rect2 = document.createElementNS(svgNS, "rect");
        rect2.setAttribute("x", "5");
        rect2.setAttribute("y", "2.5");
        rect2.setAttribute("width", "10");
        rect2.setAttribute("height", "3");
        rect2.setAttribute("rx", "1");
        rect2.setAttribute("fill", primaryAlpha);
        rect2.setAttribute("stroke", primary);
        rect2.setAttribute("stroke-width", "1");

        const rect3 = document.createElementNS(svgNS, "rect");
        rect3.setAttribute("x", "6");
        rect3.setAttribute("y", "14");
        rect3.setAttribute("width", "8");
        rect3.setAttribute("height", "2.5");
        rect3.setAttribute("rx", "1");
        rect3.setAttribute("fill", primary);

        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", "15.5");
        dot.setAttribute("cy", "10");
        dot.setAttribute("r", "0.9");
        dot.setAttribute("fill", primary);

        svg.append(rect1, rect2, rect3, dot);

        const label = document.createElement("span");
        label.textContent = "Print";

        printBtn.replaceChildren(svg, label);

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
