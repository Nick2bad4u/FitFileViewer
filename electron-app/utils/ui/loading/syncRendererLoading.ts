import {
    isRendererLoading,
    normalizeRendererLoading,
    setRendererLoading,
} from "../../state/domain/rendererLoadingState.js";
import { getSyncRendererLoadingRuntime } from "./syncRendererLoadingRuntime.js";

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

    const runtime = getSyncRendererLoadingRuntime();
    const overlay = runtime.getLoadingOverlay();

    if (!overlay) {
        console.warn("[RendererUtils] Loading overlay element not found");
        return;
    }

    overlay.style.display = loading ? "flex" : "none";
    overlay.setAttribute("aria-hidden", String(!loading));
    runtime.setBodyLoading(loading);

    console.log(`[RendererUtils] Loading state: ${String(loading)}`);
}

export function updateLoadingFromState(loading: unknown): void {
    updateLoadingUI(normalizeRendererLoading(loading));
}

function updateLoadingUI(loading: boolean): void {
    const runtime = getSyncRendererLoadingRuntime();
    const overlay = runtime.getLoadingOverlay();

    if (overlay) {
        overlay.style.display = loading ? "flex" : "none";
        overlay.setAttribute("aria-hidden", String(!loading));
    }

    runtime.setBodyLoading(loading);

    for (const element of runtime.getInteractiveElements()) {
        if (element.id === "open_file_btn") {
            continue;
        }

        if (element.classList.contains("tab-button")) {
            continue;
        }

        if (runtime.isDisableableFormControl(element)) {
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
