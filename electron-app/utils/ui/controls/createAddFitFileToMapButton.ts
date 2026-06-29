import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { openFileSelector } from "../../files/import/openFileSelector.js";
import { hasActiveFitRouteData } from "../../state/domain/fitRouteDataState.js";
import { showNotification } from "../notifications/showNotification.js";
import { registerAddFitOverlayButtonAvailabilityUpdater } from "./addFitOverlayButtonState.js";
import { getCreateAddFitFileToMapButtonRuntime } from "./createAddFitFileToMapButtonRuntime.js";

/**
 * Creates a button to add FIT files as overlays to the map.
 *
 * @throws Error If required DOM or state setup fails while building the button.
 */
export function createAddFitFileToMapButton(): HTMLButtonElement {
    try {
        const runtime = getCreateAddFitFileToMapButtonRuntime();
        const runningInTest = runtime.isTestEnvironment();

        const addOverlayBtn = runtime.createButton();
        const listenerController = runtime.createAbortController();
        addOverlayBtn.className = "map-action-btn";
        addOverlayBtn.disabled = true;
        addOverlayBtn.setAttribute("aria-disabled", "true");

        const themeColors = getThemeColors();

        // Avoid innerHTML. While themeColors.primary is not user-controlled, using DOM APIs is safer and consistent.
        const svg = runtime.createSvgElement("svg");
        svg.classList.add("icon");
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");

        const path = runtime.createSvgElement("path");
        path.setAttribute("d", "M10 2v16M2 10h16");
        path.setAttribute(
            "stroke",
            typeof themeColors["primary"] === "string" && themeColors["primary"]
                ? themeColors["primary"]
                : "currentColor"
        );
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
        svg.append(path);

        const label = runtime.createElement("span");
        label.textContent = "Add FIT File(s) to Map";

        addOverlayBtn.replaceChildren(svg, label);

        addOverlayBtn.title =
            "Overlay one or more FIT files on the map (points and tooltips will be shown)";
        addOverlayBtn.setAttribute(
            "aria-label",
            "Add FIT files as map overlays"
        );

        const updateAvailability = (): void => {
            try {
                const hasMainFile = hasActiveFitRouteData();
                addOverlayBtn.disabled = !hasMainFile;
                addOverlayBtn.setAttribute(
                    "aria-disabled",
                    String(!hasMainFile)
                );
            } catch (error) {
                console.warn(
                    "[MapActions] Unable to determine overlay availability:",
                    error
                );
                addOverlayBtn.disabled = true;
                addOverlayBtn.setAttribute("aria-disabled", "true");
            }
        };

        updateAvailability();

        registerAddFitOverlayButtonAvailabilityUpdater(updateAvailability);

        addOverlayBtn.addEventListener(
            "click",
            () => {
                void handleAddOverlayClick(addOverlayBtn, runningInTest);
            },
            { signal: listenerController.signal }
        );

        return addOverlayBtn;
    } catch (error) {
        console.error("[MapActions] Failed to create add file button:", error);
        throw error;
    }
}

async function handleAddOverlayClick(
    addOverlayBtn: HTMLButtonElement,
    runningInTest: boolean
): Promise<void> {
    try {
        if (addOverlayBtn.disabled) {
            void showNotification(
                "Open a primary FIT file before adding overlays.",
                "info"
            );
            return;
        }

        await openFileSelector();
    } catch (error) {
        if (!runningInTest) {
            console.error("[MapActions] Failed to open file selector:", error);
        }
        void showNotification("Failed to open file selector", "error");
    }
}
