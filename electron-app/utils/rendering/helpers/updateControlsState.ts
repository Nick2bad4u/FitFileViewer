import {
    getChartControlsToggle,
    getChartSettingsWrapper,
} from "../../charts/dom/chartDomUtils.js";
import {
    getState,
    setState,
    subscribe,
} from "../../state/core/stateManager.js";

/**
 * Initialize chart controls state management.
 */
export function initializeControlsState(): void {
    // Subscribe to state changes to keep DOM in sync
    subscribe("charts.controlsVisible", (isVisible: unknown) => {
        const controlsVisible = isVisible === true;
        const toggleBtn = getChartControlsToggle(document),
            wrapper = getChartSettingsWrapper(document);

        if (wrapper && toggleBtn) {
            wrapper.style.display = controlsVisible ? "block" : "none";
            toggleBtn.textContent = controlsVisible
                ? "▼ Hide Controls"
                : "▶ Show Controls";
            toggleBtn.setAttribute("aria-expanded", controlsVisible.toString());
        }
    });

    // Set initial state
    updateControlsState();
}

/**
 * Toggle chart controls visibility using centralized state.
 */
export function toggleChartControls(): void {
    const currentState = getState<boolean>("charts.controlsVisible");
    setState("charts.controlsVisible", !currentState, {
        source: "toggleChartControls",
    });
}

/**
 * Synchronizes the controls state with DOM - useful for fixing state
 * inconsistencies.
 */
export function updateControlsState(): void {
    const toggleBtn = getChartControlsToggle(document),
        wrapper = getChartSettingsWrapper(document);

    if (!wrapper || !toggleBtn) {
        return;
    }

    // Get the actual visibility from the DOM
    const computedStyle = globalThis.getComputedStyle(wrapper),
        isActuallyVisible =
            wrapper.style.display !== "none" &&
            computedStyle.display !== "none" &&
            wrapper.offsetParent !== null;

    // Update centralized state to match DOM reality
    setState("charts.controlsVisible", isActuallyVisible, {
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
