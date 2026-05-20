import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { showNotification } from "../notifications/showNotification.js";
/**
 * @typedef {ReturnType<typeof getThemeColors>} ThemeColors
 */
/**
 * @typedef {typeof globalThis & {
 *     mapMarkerCount?: number;
 *     updateShownFilesList?: () => void;
 * }} MarkerCountGlobal
 */
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * @param {ThemeColors} themeColors
 *
 * @returns {SVGSVGElement}
 */
function createMarkerCountIcon(themeColors) {
    const icon = document.createElementNS(SVG_NS, "svg");
    icon.classList.add("icon");
    icon.setAttribute("viewBox", "0 0 20 20");
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");

    const bars = [
        { height: "7", x: "1.5", y: "8" },
        { height: "11", x: "5", y: "5" },
        { height: "14", x: "8.5", y: "2.5" },
        { height: "5", x: "12", y: "11" },
    ];
    for (const { height, x, y } of bars) {
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", "2");
        rect.setAttribute("height", height);
        rect.setAttribute("rx", "1");
        rect.setAttribute("fill", themeColors.surface);
        rect.setAttribute("stroke", themeColors.primary);
        rect.setAttribute("stroke-width", "1.5");
        icon.append(rect);
    }

    return icon;
}

/**
 * Creates a marker count selector for controlling data point density on the map
 *
 * @param {Function} onChange - Callback function when marker count changes
 *
 * @returns {HTMLElement} The configured marker count selector container
 */

/**
 * Creates a marker count selector for controlling data point density on the
 * map. Adds wheel support and persists a global `window.mapMarkerCount` value
 * used by map rendering.
 *
 * Contract:
 *
 * - OnChange(number) is called with 0 to mean "all" markers, else the numeric
 *   limit.
 * - Global window.mapMarkerCount is always kept in sync (0 => all).
 * - Returned element is a container div with a label + select.
 *
 * @param {(count: number) => void} [onChange] Callback invoked when selection
 *   changes
 *
 * @returns {HTMLDivElement} Container element
 */
export function createMarkerCountSelector(onChange) {
    try {
        /** @type {ThemeColors} */
        const /** @type {HTMLDivElement} */
            container = document.createElement("div"),
            themeColors = getThemeColors(); // Theming values (index signature access is fine at runtime)
        container.className = "map-action-btn marker-count-container";

        /** @type {HTMLLabelElement} */
        const label = document.createElement("label");
        const labelText = document.createElement("span");
        labelText.textContent = "Data Points:";
        label.append(createMarkerCountIcon(themeColors), labelText);
        label.setAttribute("for", "marker-count-select");
        label.className = "marker-count-label";

        /** @type {HTMLSelectElement} */
        const select = document.createElement("select");
        select.id = "marker-count-select";
        select.className = "marker-count-select";

        const options = [
            10,
            25,
            50,
            100,
            200,
            500,
            1000,
            "All",
        ];
        for (const val of options) {
            /** @type {HTMLOptionElement} */
            const opt = document.createElement("option");
            opt.value = val === "All" ? "all" : String(val);
            opt.textContent = String(val);
            select.append(opt);
        }

        // Set initial value from global or default
        const validOptions = [
            10,
            25,
            50,
            100,
            200,
            500,
            1000,
            "all",
        ];
        /** @type {string} */
        let initial;
        /** @type {MarkerCountGlobal} */
        const g = globalThis, // Legacy global usage wrapper
            current = g.mapMarkerCount;
        if (typeof current !== "number") {
            g.mapMarkerCount = 50;
            initial = "50";
        } else if (current === 0) {
            initial = "all";
        } else if (validOptions.includes(current)) {
            initial = String(current);
        } else {
            g.mapMarkerCount = 50; // Fallback to default
            initial = "50";
        }
        select.value = initial;

        // Handle selection changes
        select.addEventListener("change", () => {
            try {
                const val = select.value;
                g.mapMarkerCount = val === "all" ? 0 : Number.parseInt(val, 10);

                if (typeof onChange === "function") {
                    onChange(g.mapMarkerCount);
                }

                if (typeof g.updateShownFilesList === "function") {
                    g.updateShownFilesList();
                }
            } catch (error) {
                console.error(
                    "[mapActionButtons] Error in marker count change:",
                    error
                );
                showNotification("Failed to update marker count", "error");
            }
        });

        // Add mouse wheel support for changing marker count
        select.addEventListener(
            "wheel",
            (e) => {
                try {
                    e.preventDefault();
                    e.stopPropagation();

                    const idx = select.selectedIndex,
                        optionElements = [...select.options];

                    if (e.deltaY > 0 && idx < optionElements.length - 1) {
                        select.selectedIndex = idx + 1;
                        select.dispatchEvent(
                            new Event("change", {
                                bubbles: false,
                                cancelable: true,
                                composed: false,
                            })
                        );
                    } else if (e.deltaY < 0 && idx > 0) {
                        select.selectedIndex = idx - 1;
                        select.dispatchEvent(
                            new Event("change", {
                                bubbles: false,
                                cancelable: true,
                                composed: false,
                            })
                        );
                    }
                } catch (error) {
                    console.error(
                        "[mapActionButtons] Error in wheel event:",
                        error
                    );
                }
            },
            { passive: false }
        );

        // Apply CSS classes for proper theming - no need for inline styles
        // The CSS already handles theming through .map-action-btn and theme-specific selectors
        container.append(label);
        container.append(select);

        return container;
    } catch (error) {
        console.error(
            "[mapActionButtons] Error creating marker count selector:",
            error
        );
        showNotification("Failed to create marker count selector", "error");
        return /** @type {HTMLDivElement} */ (document.createElement("div")); // Return empty div as fallback
    }
}
