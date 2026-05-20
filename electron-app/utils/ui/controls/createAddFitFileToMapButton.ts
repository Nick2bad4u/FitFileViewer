import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { openFileSelector } from "../../files/import/openFileSelector.js";
import { getState, subscribe } from "../../state/core/stateManager.js";
import { showNotification } from "../notifications/showNotification.js";

const SVG_NS = "http://www.w3.org/2000/svg";

type AddFitOverlayGlobal = typeof globalThis & {
    __ffvAddFitOverlayButtonUnsubscribe?: unknown;
    __ffvAddFitOverlayButtonUpdate?: unknown;
    process?: {
        env?: {
            NODE_ENV?: string;
        };
    };
};

type FitRecordData = {
    readonly recordMesgs?: readonly unknown[];
};

/**
 * Creates a button to add FIT files as overlays to the map.
 *
 * @throws Error If required DOM or state setup fails while building the button.
 */
export function createAddFitFileToMapButton(): HTMLButtonElement {
    try {
        const globalRef = globalThis as AddFitOverlayGlobal;

        const isTestEnvironment =
            globalRef.process !== undefined &&
            Boolean(globalRef.process.env) &&
            globalRef.process.env?.NODE_ENV === "test";

        const addOverlayBtn = document.createElement("button");
        const listenerController = new AbortController();
        addOverlayBtn.className = "map-action-btn";
        addOverlayBtn.disabled = true;
        addOverlayBtn.setAttribute("aria-disabled", "true");

        const themeColors = getThemeColors();

        // Avoid innerHTML. While themeColors.primary is not user-controlled, using DOM APIs is safer and consistent.
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.classList.add("icon");
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");

        const path = document.createElementNS(SVG_NS, "path");
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

        const label = document.createElement("span");
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
                const data = getState("globalData");
                const recordMesgs =
                    data && typeof data === "object"
                        ? (data as FitRecordData).recordMesgs
                        : undefined;
                const hasMainFile = Boolean(
                    Array.isArray(recordMesgs) && recordMesgs.length > 0
                );
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

        // Prevent subscription leaks: renderMap clears and recreates controls, so this button can be destroyed.
        // Install a single subscription and always point it at the current button's updater.
        globalRef.__ffvAddFitOverlayButtonUpdate = updateAvailability;
        if (
            typeof globalRef.__ffvAddFitOverlayButtonUnsubscribe !== "function"
        ) {
            globalRef.__ffvAddFitOverlayButtonUnsubscribe = subscribe(
                "globalData",
                () => {
                    try {
                        const fn = globalRef.__ffvAddFitOverlayButtonUpdate;
                        if (typeof fn === "function") {
                            fn();
                        }
                    } catch {
                        /* ignore */
                    }
                }
            );
        }

        addOverlayBtn.addEventListener(
            "click",
            () => {
                void handleAddOverlayClick(addOverlayBtn, isTestEnvironment);
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
    isTestEnvironment: boolean
): Promise<void> {
    try {
        if (addOverlayBtn.disabled) {
            showNotification(
                "Open a primary FIT file before adding overlays.",
                "info"
            );
            return;
        }

        await openFileSelector();
    } catch (error) {
        if (!isTestEnvironment) {
            console.error("[MapActions] Failed to open file selector:", error);
        }
        showNotification("Failed to open file selector", "error");
    }
}
