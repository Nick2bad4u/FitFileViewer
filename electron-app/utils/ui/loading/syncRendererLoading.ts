import {
    isRendererLoading,
    normalizeRendererLoading,
    setRendererLoading,
} from "../../state/domain/rendererLoadingState.js";
import { querySelectorByIdFlexible } from "../dom/elementIdUtils.js";

/**
 * Get current loading state.
 */
export function isLoading(): boolean {
    return isRendererLoading();
}

/**
 * Shows or hides the loading overlay and updates the cursor style.
 */
export function setLoading(loading: boolean): void {
    setRendererLoading(loading, { source: "setLoading" });

    const overlay = querySelectorByIdFlexible(document, "#loading_overlay");

    if (!overlay) {
        console.warn("[RendererUtils] Loading overlay element not found");
        return;
    }

    overlay.style.display = loading ? "flex" : "none";
    document.body.style.cursor = loading ? "wait" : "";
    overlay.setAttribute("aria-hidden", String(!loading));
    document.body.setAttribute("aria-busy", String(loading));

    console.log(`[RendererUtils] Loading state: ${String(loading)}`);
}

export function updateLoadingFromState(loading: unknown): void {
    updateLoadingUI(normalizeRendererLoading(loading));
}

function updateLoadingUI(loading: boolean): void {
    const overlay = querySelectorByIdFlexible(document, "#loading_overlay");

    if (overlay) {
        overlay.style.display = loading ? "flex" : "none";
        overlay.setAttribute("aria-hidden", String(!loading));
    }

    document.body.style.cursor = loading ? "wait" : "";
    document.body.setAttribute("aria-busy", String(loading));

    const interactiveElements = document.querySelectorAll(
        "button, input, select, textarea"
    );

    for (const element of interactiveElements) {
        if (element.id === "open_file_btn") {
            continue;
        }

        if (element.classList.contains("tab-button")) {
            continue;
        }

        if (isDisableableFormControl(element)) {
            if (loading) {
                element.dataset["wasDisabled"] = String(element.disabled);
                element.disabled = true;
            } else {
                element.disabled = element.dataset["wasDisabled"] === "true";
                delete element.dataset["wasDisabled"];
            }
        }
    }
}

function isDisableableFormControl(
    element: Element
): element is
    | HTMLButtonElement
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement {
    return (
        element instanceof HTMLButtonElement ||
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
    );
}
