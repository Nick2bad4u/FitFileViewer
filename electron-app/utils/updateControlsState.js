import { setState, getState, subscribe } from "./stateManager.js";

/**
 * Synchronizes the controls state with DOM - useful for fixing state inconsistencies
 */
export function updateControlsState() {
    const wrapper = document.getElementById("chartjs-settings-wrapper");
    const toggleBtn = document.getElementById("chart-controls-toggle");

    if (!wrapper || !toggleBtn) {
        return;
    }

    // Get the actual visibility from the DOM
    const computedStyle = window.getComputedStyle(wrapper);
    const isActuallyVisible =
        wrapper.style.display !== "none" && computedStyle.display !== "none" && wrapper.offsetParent !== null;

    // Update centralized state to match DOM reality
    setState("charts.controlsVisible", isActuallyVisible, {
        source: "updateControlsState",
        silent: true,
    });

    // Update toggle button to reflect actual state
    toggleBtn.textContent = isActuallyVisible ? "▼ Hide Controls" : "▶ Show Controls";
    toggleBtn.setAttribute("aria-expanded", isActuallyVisible.toString());

    // Ensure wrapper display matches internal state
    wrapper.style.display = isActuallyVisible ? "block" : "none";

    console.log(`[ChartJS] State synchronized - controls are ${isActuallyVisible ? "visible" : "hidden"}`);
}

/**
 * Initialize chart controls state management
 */
export function initializeControlsState() {
    // Subscribe to state changes to keep DOM in sync
    subscribe("charts.controlsVisible", (isVisible) => {
        const wrapper = document.getElementById("chartjs-settings-wrapper");
        const toggleBtn = document.getElementById("chart-controls-toggle");

        if (wrapper && toggleBtn) {
            wrapper.style.display = isVisible ? "block" : "none";
            toggleBtn.textContent = isVisible ? "▼ Hide Controls" : "▶ Show Controls";
            toggleBtn.setAttribute("aria-expanded", isVisible.toString());
        }
    });

    // Set initial state
    updateControlsState();
}

/**
 * Toggle chart controls visibility using centralized state
 */
export function toggleChartControls() {
    const currentState = getState("charts.controlsVisible");
    setState("charts.controlsVisible", !currentState, {
        source: "toggleChartControls",
    });
}
