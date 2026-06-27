import {
    getChartControlsToggle,
    getChartSettingsWrapper,
} from "../../charts/dom/chartDomUtils.js";
import {
    setRendererChartControlsVisible,
    subscribeToRendererChartControlsVisible,
    toggleRendererChartControlsVisibleFromStoredState,
} from "../../state/domain/rendererChartControlsState.js";
import { getUpdateControlsStateRuntime } from "./updateControlsStateRuntime.js";

let controlsStateUnsubscribe: (() => void) | null = null;

/**
 * Initialize chart controls state management.
 */
export function initializeControlsState(): void {
    const runtime = getUpdateControlsStateRuntime();
    const runtimeDocument = runtime.getDocument();

    cleanupControlsState();

    // Subscribe to state changes to keep DOM in sync
    controlsStateUnsubscribe = subscribeToRendererChartControlsVisible(
        (controlsVisible) => {
            const toggleBtn = getChartControlsToggle(runtimeDocument),
                wrapper = getChartSettingsWrapper(runtimeDocument);

            if (wrapper && toggleBtn) {
                wrapper.style.display = controlsVisible ? "block" : "none";
                toggleBtn.textContent = controlsVisible
                    ? "▼ Hide Controls"
                    : "▶ Show Controls";
                toggleBtn.setAttribute(
                    "aria-expanded",
                    controlsVisible.toString()
                );
            }
        }
    );

    // Set initial state
    updateControlsState();
}

/**
 * Clean up chart controls state management.
 */
export function cleanupControlsState(): void {
    if (controlsStateUnsubscribe === null) {
        return;
    }

    try {
        controlsStateUnsubscribe();
    } catch {
        /* Ignore cleanup errors. */
    }
    controlsStateUnsubscribe = null;
}

/**
 * Toggle chart controls visibility using centralized state.
 */
export function toggleChartControls(): void {
    toggleRendererChartControlsVisibleFromStoredState({
        source: "toggleChartControls",
    });
}

/**
 * Synchronizes the controls state with DOM - useful for fixing state
 * inconsistencies.
 */
export function updateControlsState(): void {
    const runtime = getUpdateControlsStateRuntime();
    const runtimeDocument = runtime.getDocument();
    const toggleBtn = getChartControlsToggle(runtimeDocument),
        wrapper = getChartSettingsWrapper(runtimeDocument);

    if (!wrapper || !toggleBtn) {
        return;
    }

    // Get the actual visibility from the DOM
    const computedDisplay = runtime.getComputedDisplay(wrapper),
        isActuallyVisible =
            wrapper.style.display !== "none" &&
            computedDisplay !== "none" &&
            wrapper.offsetParent !== null;

    // Update centralized state to match DOM reality
    setRendererChartControlsVisible(isActuallyVisible, {
        silent: true,
        source: "updateControlsState",
    });

    // Update toggle button to reflect actual state
    toggleBtn.textContent = isActuallyVisible
        ? "▼ Hide Controls"
        : "▶ Show Controls";
    toggleBtn.setAttribute("aria-expanded", isActuallyVisible.toString());

    // Ensure wrapper display matches internal state
    wrapper.style.display = isActuallyVisible ? "block" : "none";

    console.log(
        `[ChartJS] State synchronized - controls are ${isActuallyVisible ? "visible" : "hidden"}`
    );
}
