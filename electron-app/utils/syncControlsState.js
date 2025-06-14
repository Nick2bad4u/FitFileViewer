import { chartControlsState } from "./renderChartJS.js";

/**
 * Synchronizes the controls state with DOM - useful for fixing state inconsistencies
 */

export function syncControlsState() {
    const wrapper = document.getElementById("chartjs-settings-wrapper");
    const toggleBtn = document.getElementById("chart-controls-toggle");

    if (!wrapper || !toggleBtn) {
        return;
    }

    // Get the actual visibility from the DOM
    const computedStyle = window.getComputedStyle(wrapper);
    const isActuallyVisible = wrapper.style.display !== "none" && computedStyle.display !== "none" && wrapper.offsetParent !== null;

    // Update internal state to match DOM reality
    chartControlsState.isVisible = isActuallyVisible;

    // Update toggle button to reflect actual state
    toggleBtn.textContent = chartControlsState.isVisible ? "▼ Hide Controls" : "▶ Show Controls";
    toggleBtn.setAttribute("aria-expanded", chartControlsState.isVisible.toString());

    // Ensure wrapper display matches internal state
    wrapper.style.display = chartControlsState.isVisible ? "block" : "none";

    console.log(`[ChartJS] State synchronized - controls are ${chartControlsState.isVisible ? "visible" : "hidden"}`);
}
