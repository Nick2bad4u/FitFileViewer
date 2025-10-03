import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { showNotification } from "../notifications/showNotification.js";
/**
 * @typedef {ReturnType<typeof getThemeColors>} ThemeColors
 */
/**
 * Creates a marker count selector for controlling data point density on the map
 * @param {Function} onChange - Callback function when marker count changes
 * @returns {HTMLElement} The configured marker count selector container
 */

/**
 * Creates a marker count selector for controlling data point density on the map.
 * Adds wheel support and persists a global `window.mapMarkerCount` value used by map rendering.
 *
 * Contract:
 *  - onChange(number) is called with 0 to mean "all" markers, else the numeric limit.
 *  - Global window.mapMarkerCount is always kept in sync (0 => all).
 *  - Returned element is a container div with a label + select.
 *
 * @param {(count:number)=>void} [onChange] callback invoked when selection changes
 * @returns {HTMLDivElement} container element
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
        label.innerHTML = `
        <svg class="icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <rect x="1.5" y="8" width="2" height="7" rx="1" fill="${themeColors.surface}" stroke="${themeColors.primary}" stroke-width="1.5"/>
            <rect x="5" y="5" width="2" height="11" rx="1" fill="${themeColors.surface}" stroke="${themeColors.primary}" stroke-width="1.5"/>
            <rect x="8.5" y="2.5" width="2" height="14" rx="1" fill="${themeColors.surface}" stroke="${themeColors.primary}" stroke-width="1.5"/>
            <rect x="12" y="11" width="2" height="5" rx="1" fill="${themeColors.surface}" stroke="${themeColors.primary}" stroke-width="1.5"/>
        </svg>
        <span>Data Points:</span>
        `;
        label.setAttribute("for", "marker-count-select");
        label.className = "marker-count-label";

        /** @type {HTMLSelectElement} */
        const select = document.createElement("select");
        select.id = "marker-count-select";
        select.className = "marker-count-select";

        const options = [10, 25, 50, 100, 200, 500, 1000, "All"];
        for (const val of options) {
            /** @type {HTMLOptionElement} */
            const opt = document.createElement("option");
            opt.value = val === "All" ? "all" : String(val);
            opt.textContent = String(val);
            select.append(opt);
        }

        // Set initial value from global or default
        const validOptions = [10, 25, 50, 100, 200, 500, 1000, "all"];
        /** @type {string} */
        let initial;
        /** @type {any} */
        const g = globalThis,
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
                console.error("[mapActionButtons] Error in marker count change:", error);
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
                            new Event("change", { bubbles: false, cancelable: true, composed: false })
                        );
                    } else if (e.deltaY < 0 && idx > 0) {
                        select.selectedIndex = idx - 1;
                        select.dispatchEvent(
                            new Event("change", { bubbles: false, cancelable: true, composed: false })
                        );
                    }
                } catch (error) {
                    console.error("[mapActionButtons] Error in wheel event:", error);
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
        console.error("[mapActionButtons] Error creating marker count selector:", error);
        showNotification("Failed to create marker count selector", "error");
        return /** @type {HTMLDivElement} */ (document.createElement("div")); // Return empty div as fallback
    }
}
