import { getState, setState, updateState } from "../../state/core/stateManager.js";
import { updateControlsState } from "../../rendering/helpers/updateControlsState.js";
import { getDefaultSettings, getCurrentSettings } from "../../app/initialization/getCurrentSettings.js";
import { applySettingsPanelStyles } from "./createSettingsHeader.js";
import {
    createSettingsHeader,
    createControlsSection,
    createExportSection,
    createFieldTogglesSection,
} from "./createSettingsHeader.js";
import { createPowerZoneControls, movePowerZoneControlsToSection } from "../controls/createPowerZoneControls.js";
import { createHRZoneControls, moveHRZoneControlsToSection } from "../controls/createHRZoneControls.js";
import { setupChartStatusUpdates } from "../../charts/components/chartStatusIndicator.js";

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
    updateControlsState();

    // Use state management system to toggle controls visibility
    const currentVisibility = getState("charts.controlsVisible");
    const newVisibility = !currentVisibility;

    setState("charts.controlsVisible", newVisibility, { source: "toggleChartControls" });
    wrapper.style.display = newVisibility ? "block" : "none";

    // Update toggle button text if it exists
    const toggleBtn = document.getElementById("chart-controls-toggle");
    if (toggleBtn) {
        toggleBtn.textContent = newVisibility ? "▼ Hide Controls" : "▶ Show Controls";
        toggleBtn.setAttribute("aria-expanded", newVisibility.toString());
    }

    console.log(`[ChartJS] Controls panel ${newVisibility ? "shown" : "hidden"}`);
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

    // Set initial text based on current state
    const controlsVisible = getState("charts.controlsVisible") !== false; // Default to true
    toggleBtn.textContent = controlsVisible ? "▼ Hide Controls" : "▶ Show Controls";
    toggleBtn.setAttribute("aria-expanded", controlsVisible.toString());
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
    // Initialize chart controls state if not already set
    if (getState("charts.controlsVisible") === undefined) {
        setState("charts.controlsVisible", true, { source: "ensureChartSettingsDropdowns.init" });
    }

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
        } // Initialize settings sections only once
        createSettingsHeader(wrapper);
        createControlsSection(wrapper);
        createExportSection(wrapper);
        createFieldTogglesSection(wrapper);
        // Create power zone controls section and move existing controls to it
        createPowerZoneControls(wrapper);

        // Create heart rate zone controls section and move existing controls to it
        createHRZoneControls(wrapper);

        // Move zone controls after a short delay to ensure field toggles are rendered
        setTimeout(function () {
            movePowerZoneControlsToSection();
            moveHRZoneControlsToSection();
        }, 100);

        // Setup chart status indicator automatic updates
        setupChartStatusUpdates();

        // Update state management system instead of chartControlsState
        updateState(
            "charts",
            {
                controlsInitialized: true,
                controlsWrapper: wrapper.id, // Store wrapper ID instead of DOM reference
            },
            { source: "ensureChartSettingsDropdowns", merge: true }
        );

        console.log("[ChartJS] Controls panel created and hidden by default");
    }

    // Ensure state synchronization - sync internal state with actual DOM state
    updateControlsState();

    return getCurrentSettings();
}
