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
        /** @type {any} */
        const globalRef = globalThis;

        const isTestEnvironment =
            globalThis.process !== undefined &&
            Boolean(globalThis.process?.env) &&
            /** @type {any} */ (globalThis.process.env).NODE_ENV === "test";

        const addOverlayBtn = document.createElement("button");
        addOverlayBtn.className = "map-action-btn";
        addOverlayBtn.disabled = true;
        addOverlayBtn.setAttribute("aria-disabled", "true");

        const themeColors = getThemeColors();

        // Avoid innerHTML. While themeColors.primary is not user-controlled, using DOM APIs is safer and consistent.
        const svg = /** @type {SVGElement} */ (document.createElementNS("http://www.w3.org/2000/svg", "svg"));
        svg.classList.add("icon");
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");

        const path = /** @type {SVGPathElement} */ (document.createElementNS("http://www.w3.org/2000/svg", "path"));
        path.setAttribute("d", "M10 2v16M2 10h16");
        path.setAttribute("stroke", themeColors.primary || "currentColor");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        svg.append(path);

        const label = document.createElement("span");
        label.textContent = "Add FIT File(s) to Map";

        addOverlayBtn.replaceChildren(svg, label);

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

        // Prevent subscription leaks: renderMap clears and recreates controls, so this button can be destroyed.
        // Install a single subscription and always point it at the current button's updater.
        globalRef.__ffvAddFitOverlayButtonUpdate = updateAvailability;
        if (typeof globalRef.__ffvAddFitOverlayButtonUnsubscribe !== "function") {
            globalRef.__ffvAddFitOverlayButtonUnsubscribe = subscribe("globalData", () => {
                try {
                    const fn = globalRef.__ffvAddFitOverlayButtonUpdate;
                    if (typeof fn === "function") {
                        fn();
                    }
                } catch {
                    /* ignore */
                }
            });
        }

        addOverlayBtn.addEventListener("click", async () => {
            try {
                if (addOverlayBtn.disabled) {
                    showNotification("Open a primary FIT file before adding overlays.", "info");
                    return;
                }
                await openFileSelector();
            } catch (error) {
                if (!isTestEnvironment) {
                    console.error("[MapActions] Failed to open file selector:", error);
                }
                showNotification("Failed to open file selector", "error");
            }
        });

        return addOverlayBtn;
    } catch (error) {
        console.error("[MapActions] Failed to create add file button:", error);
        throw error;
    }
}
