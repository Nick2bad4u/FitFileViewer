import { chartControlsState } from "./renderChartJS.js";
import { syncControlsState } from "./syncControlsState.js";
import { getDefaultSettings, getCurrentSettings } from "./getCurrentSettings.js";
import { applySettingsPanelStyles } from "./createSettingsHeader.js";
import {
    createSettingsHeader,
    createControlsSection,
    createExportSection,
    createFieldTogglesSection,
} from "./createSettingsHeader.js";

/**
 * Toggles the visibility of the chart controls panel
 */
function toggleChartControls() {
    const wrapper = document.getElementById("chartjs-settings-wrapper");
    if (!wrapper) {
        console.warn("[ChartJS] Controls panel not found, creating it...");
        ensureChartSettingsDropdowns();
        return;
    }

    // First sync to ensure we're starting from the correct state
    syncControlsState();

    // Then toggle the state
    chartControlsState.isVisible = !chartControlsState.isVisible;
    wrapper.style.display = chartControlsState.isVisible ? "block" : "none";

    // Update toggle button text if it exists
    const toggleBtn = document.getElementById("chart-controls-toggle");
    if (toggleBtn) {
        toggleBtn.textContent = chartControlsState.isVisible ? "▼ Hide Controls" : "▶ Show Controls";
        toggleBtn.setAttribute("aria-expanded", chartControlsState.isVisible.toString());
    }

    console.log(`[ChartJS] Controls panel ${chartControlsState.isVisible ? "shown" : "hidden"}`);
}
/**
 * Creates a toggle button for the chart controls panel
 */
function createControlsToggleButton(container) {
    let toggleBtn = document.getElementById("chart-controls-toggle");
    if (toggleBtn) {
        return toggleBtn; // Already exists
    }

    toggleBtn = document.createElement("button");
    toggleBtn.id = "chart-controls-toggle";
    toggleBtn.className = "chart-controls-toggle-btn";
    toggleBtn.textContent = "▶ Show Controls";
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.setAttribute("aria-controls", "chartjs-settings-wrapper");
    toggleBtn.style.cssText = `
		background: linear-gradient(145deg, #3b82f665 0%, #2563eb 100%);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 12px 20px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		margin-bottom: 16px;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
		position: relative;
		z-index: 10;
	`;

    // Add hover and focus effects
    toggleBtn.addEventListener("mouseenter", () => {
        toggleBtn.style.transform = "translateY(-2px)";
        toggleBtn.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.4)";
    });

    toggleBtn.addEventListener("mouseleave", () => {
        toggleBtn.style.transform = "translateY(0)";
        toggleBtn.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
    });

    toggleBtn.addEventListener("click", toggleChartControls);

    // Insert before the chart container
    const chartContainer = document.getElementById("chartjs-chart-container");
    if (chartContainer && chartContainer.parentNode) {
        chartContainer.parentNode.insertBefore(toggleBtn, chartContainer);
    } else {
        container.appendChild(toggleBtn);
    }

    return toggleBtn;
}
/**
 * Ensures chart settings dropdowns exist and applies styling
 * @param {Element|string} targetContainer - Container element or ID
 * @returns {Object} Current settings object
 */
export function ensureChartSettingsDropdowns(targetContainer) {
    let chartContainer = targetContainer
        ? typeof targetContainer === "string"
            ? document.getElementById(targetContainer)
            : targetContainer
        : document.getElementById("chartjs-chart-container");

    if (!chartContainer) {
        return getDefaultSettings();
    }

    // Create toggle button if it doesn't exist
    createControlsToggleButton(chartContainer.parentNode || document.body);

    // Create main settings wrapper only if it doesn't exist
    let wrapper = document.getElementById("chartjs-settings-wrapper");
    if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.id = "chartjs-settings-wrapper";
        wrapper.className = "chart-settings-panel";
        wrapper.style.display = "none"; // Hidden by default
        applySettingsPanelStyles(wrapper);

        const toggleBtn = document.getElementById("chart-controls-toggle");
        if (toggleBtn && toggleBtn.parentNode) {
            toggleBtn.parentNode.insertBefore(wrapper, toggleBtn.nextSibling);
        } else {
            chartContainer.parentNode.insertBefore(wrapper, chartContainer);
        }

        // Initialize settings sections only once
        createSettingsHeader(wrapper);
        createControlsSection(wrapper);
        createExportSection(wrapper);
        createFieldTogglesSection(wrapper);
        chartControlsState.isInitialized = true;
        chartControlsState.wrapper = wrapper;
        console.log("[ChartJS] Controls panel created and hidden by default");
    }

    // Ensure state synchronization - sync internal state with actual DOM state
    syncControlsState();

    return getCurrentSettings();
}
