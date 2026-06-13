import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import type { ThemeColorMap } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { getCreatePrintButtonRuntime } from "./createPrintButtonRuntime.js";

function getThemeColorToken(
    themeColors: ThemeColorMap,
    key: string,
    fallback: string
): string {
    const value = themeColors[key];
    return typeof value === "string" && value ? value : fallback;
}

/**
 * Creates a print/export button for the map.
 *
 * @throws When the DOM button cannot be created.
 */
export function createPrintButton(): HTMLButtonElement {
    try {
        const runtime = getCreatePrintButtonRuntime();
        const printBtn = runtime.createButton();
        printBtn.className = "map-action-btn print-button";

        const themeColors = getThemeColors();

        const svg = runtime.createSvgElement("svg");
        svg.setAttribute("class", "icon");
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");

        const primary = getThemeColorToken(themeColors, "primary", "#3b82f6");
        const primaryAlpha = getThemeColorToken(
            themeColors,
            "primaryAlpha",
            "rgba(59, 130, 246, 0.2)"
        );
        const surface = getThemeColorToken(themeColors, "surface", "#ffffff");

        const rect1 = runtime.createSvgElement("rect");
        rect1.setAttribute("x", "3");
        rect1.setAttribute("y", "6");
        rect1.setAttribute("width", "14");
        rect1.setAttribute("height", "7");
        rect1.setAttribute("rx", "2");
        rect1.setAttribute("fill", surface);
        rect1.setAttribute("stroke", primary);
        rect1.setAttribute("stroke-width", "1.5");

        const rect2 = runtime.createSvgElement("rect");
        rect2.setAttribute("x", "5");
        rect2.setAttribute("y", "2.5");
        rect2.setAttribute("width", "10");
        rect2.setAttribute("height", "3");
        rect2.setAttribute("rx", "1");
        rect2.setAttribute("fill", primaryAlpha);
        rect2.setAttribute("stroke", primary);
        rect2.setAttribute("stroke-width", "1");

        const rect3 = runtime.createSvgElement("rect");
        rect3.setAttribute("x", "6");
        rect3.setAttribute("y", "14");
        rect3.setAttribute("width", "8");
        rect3.setAttribute("height", "2.5");
        rect3.setAttribute("rx", "1");
        rect3.setAttribute("fill", primary);

        const dot = runtime.createSvgElement("circle");
        dot.setAttribute("cx", "15.5");
        dot.setAttribute("cy", "10");
        dot.setAttribute("r", "0.9");
        dot.setAttribute("fill", primary);

        svg.append(rect1, rect2, rect3, dot);

        const label = runtime.createElement("span");
        label.textContent = "Print";

        printBtn.replaceChildren(svg, label);
        printBtn.title = "Print or export the current map view";
        printBtn.setAttribute("aria-label", "Print or export map");

        const printButtonController = runtime.createAbortController();
        printBtn.addEventListener(
            "click",
            () => {
                try {
                    runtime.print();
                } catch (error) {
                    console.error("[MapActions] Print failed:", error);
                    showNotification(
                        "Print failed. Please try again.",
                        "error"
                    );
                }
            },
            { signal: printButtonController.signal }
        );

        return printBtn;
    } catch (error) {
        console.error(
            "[MapActions][createPrintButton] Failed to create print button:",
            error
        );
        throw error;
    }
}
