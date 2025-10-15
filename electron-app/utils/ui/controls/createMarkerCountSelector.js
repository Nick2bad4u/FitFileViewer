import { getOverlayMarkerCount, setOverlayMarkerCount } from "../../state/domain/overlayState.js";
import { showNotification } from "../notifications/showNotification.js";

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
        /** @type {HTMLDivElement} */
        const container = document.createElement("div");
        container.className = "map-action-btn marker-count-container";

        /** @type {HTMLLabelElement} */
        const label = document.createElement("label");
        label.innerHTML = `
            <iconify-icon aria-hidden="true" height="18" icon="flat-color-icons:bar-chart" width="18"></iconify-icon>
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
        const validOptions = new Set([0, 10, 25, 50, 100, 200, 500, 1000]);
        let current = getOverlayMarkerCount();
        const globalMarkerCount = typeof /** @type {any} */ (globalThis).mapMarkerCount === "number"
            ? Number.parseInt(String(/** @type {any} */(globalThis).mapMarkerCount), 10)
            : undefined;

        if (current === 0 && typeof globalMarkerCount === "number" && Number.isFinite(globalMarkerCount)) {
            if (validOptions.has(globalMarkerCount) && globalMarkerCount !== 0) {
                current = globalMarkerCount;
                setOverlayMarkerCount(globalMarkerCount, "createMarkerCountSelector.hydrateFromGlobal");
            } else if (globalMarkerCount > 0 && !validOptions.has(globalMarkerCount)) {
                current = 50;
                setOverlayMarkerCount(50, "createMarkerCountSelector.normalizeInvalidGlobal");
            }
        }

        if (
            !validOptions.has(current) ||
            (current === 0 && (globalMarkerCount === undefined || Number.isNaN(globalMarkerCount)))
        ) {
            current = 50;
            setOverlayMarkerCount(50, "createMarkerCountSelector.initialize");
        }

        const initial = current === 0 ? "all" : String(current);
        select.value = initial;

        // Handle selection changes
        select.addEventListener("change", () => {
            try {
                const val = select.value;
                const newCount = val === "all" ? 0 : Number.parseInt(val, 10);
                setOverlayMarkerCount(newCount, "createMarkerCountSelector.change");

                console.log(`[MarkerCountSelector] Changed to: ${val} (${newCount})`);

                if (typeof onChange === "function") {
                    onChange(newCount);
                }

                if (typeof globalThis.updateShownFilesList === "function") {
                    globalThis.updateShownFilesList();
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
