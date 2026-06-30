import {
    type ChartSettings,
    getCurrentSettings,
    getDefaultSettings,
} from "../../app/initialization/getCurrentSettings.js";
import { setupChartStatusUpdates } from "../../charts/components/chartStatusIndicator.js";
import {
    getChartControlsToggle,
    getChartRenderContainer,
    getChartSettingsWrapper,
    resolveChartContainer,
} from "../../charts/dom/chartDomUtils.js";
import { updateControlsState } from "../../rendering/helpers/updateControlsState.js";
import {
    areRendererChartControlsVisible,
    ensureRendererChartControlsVisibleState,
    markRendererChartControlsInitialized,
    toggleRendererChartControlsVisible,
} from "../../state/domain/rendererChartControlsState.js";
import {
    createHRZoneControls,
    moveHRZoneControlsToSection,
} from "../controls/createHRZoneControls.js";
import {
    createPowerZoneControls,
    movePowerZoneControlsToSection,
} from "../controls/createPowerZoneControls.js";
import {
    applySettingsPanelStyles,
    createControlsSection,
    createExportSection,
    createSettingsHeader,
} from "./createSettingsHeader.js";
import { createFieldTogglesSection } from "./createFieldTogglesSection.js";
import {
    getEnsureChartSettingsDropdownsRuntime,
    type EnsureChartSettingsDropdownsRuntime,
} from "./ensureChartSettingsDropdownsRuntime.js";

/**
 * Ensures chart settings dropdowns exist and applies styling.
 *
 * @param targetContainer - Container element or ID.
 *
 * @returns Current settings object.
 */
export function ensureChartSettingsDropdowns(
    targetContainer?: Element | string
): ChartSettings {
    const runtime = getEnsureChartSettingsDropdownsRuntime();
    ensureRendererChartControlsVisibleState({
        source: "ensureChartSettingsDropdowns.init",
    });

    const chartContainer = resolveChartContainer(
        runtime.document,
        targetContainer
    );

    if (!chartContainer) {
        return getDefaultSettings();
    }

    // Create toggle button if it doesn't exist
    const toggleParent = runtime.isHTMLElement(chartContainer.parentNode)
        ? chartContainer.parentNode
        : runtime.getBody();
    createControlsToggleButton(runtime, toggleParent);

    // Create main settings wrapper only if it doesn't exist
    let wrapper = getChartSettingsWrapper(runtime.document);
    if (!wrapper) {
        wrapper = runtime.createElement("div");
        wrapper.id = "chartjs-settings-wrapper";
        wrapper.className = "chart-settings-panel";
        wrapper.style.display = "none"; // Hidden by default
        applySettingsPanelStyles(wrapper);

        const toggleBtn = getChartControlsToggle(runtime.document);
        if (toggleBtn && runtime.isHTMLElement(toggleBtn.parentNode)) {
            toggleBtn.parentNode.insertBefore(wrapper, toggleBtn.nextSibling);
        } else if (runtime.isHTMLElement(chartContainer.parentNode)) {
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

        // Move zone controls after a short delay to ensure field toggles are rendered.
        scheduleDeferredZoneControlMove(runtime);

        // Setup chart status indicator automatic updates
        setupChartStatusUpdates();

        // Record chart control initialization in managed state.
        markRendererChartControlsInitialized(wrapper.id, {
            source: "ensureChartSettingsDropdowns",
        });

        console.log("[ChartJS] Controls panel created and hidden by default");
    }

    // Ensure state synchronization - sync internal state with actual DOM state
    updateControlsState();

    return getCurrentSettings();
}

/**
 * Creates a toggle button for the chart controls panel.
 *
 * @param container - Container for fallback insertion.
 *
 * @returns Existing or newly created toggle button.
 */
function createControlsToggleButton(
    runtime: EnsureChartSettingsDropdownsRuntime,
    container: HTMLElement
): HTMLElement {
    let toggleBtn = getChartControlsToggle(runtime.document);
    if (toggleBtn) {
        return toggleBtn; // Already exists
    }

    toggleBtn = runtime.createElement("button");
    toggleBtn.id = "chart-controls-toggle";
    toggleBtn.className = "chart-controls-toggle-btn";

    // Set initial text based on current state
    const controlsVisible = areRendererChartControlsVisible();
    toggleBtn.textContent = controlsVisible
        ? "▼ Hide Controls"
        : "▶ Show Controls";
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
    const listenerController = runtime.createAbortController();
    toggleBtn.addEventListener(
        "mouseenter",
        () => {
            toggleBtn.style.transform = "translateY(-2px)";
            toggleBtn.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.4)";
        },
        { signal: listenerController.signal }
    );

    toggleBtn.addEventListener(
        "mouseleave",
        () => {
            toggleBtn.style.transform = "translateY(0)";
            toggleBtn.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
        },
        { signal: listenerController.signal }
    );

    toggleBtn.addEventListener("click", toggleChartControls, {
        signal: listenerController.signal,
    });

    // Insert before the chart container
    const chartContainer = getChartRenderContainer(runtime.document);
    if (chartContainer && chartContainer.parentNode) {
        chartContainer.parentNode.insertBefore(toggleBtn, chartContainer);
    } else {
        container.append(toggleBtn);
    }

    return toggleBtn;
}

/**
 * Schedules zone control relocation after dynamically generated field toggles
 * have been added to the settings panel.
 */
function scheduleDeferredZoneControlMove(
    runtime: EnsureChartSettingsDropdownsRuntime
): void {
    runtime.setTimeout(() => {
        movePowerZoneControlsToSection();
        moveHRZoneControlsToSection();
    }, 100);
}

/**
 * Toggles the visibility of the chart controls panel.
 */
function toggleChartControls(): void {
    const runtime = getEnsureChartSettingsDropdownsRuntime();
    const wrapper = getChartSettingsWrapper(runtime.document);
    if (!wrapper) {
        console.warn("[ChartJS] Controls panel not found, creating it...");
        ensureChartSettingsDropdowns("chartjs_chart_container");
        return;
    }

    // First sync to ensure we're starting from the correct state
    updateControlsState();

    const newVisibility = toggleRendererChartControlsVisible({
        source: "toggleChartControls",
    });
    wrapper.style.display = newVisibility ? "block" : "none";

    // Update toggle button text if it exists
    const toggleBtn = getChartControlsToggle(runtime.document);
    if (toggleBtn) {
        toggleBtn.textContent = newVisibility
            ? "▼ Hide Controls"
            : "▶ Show Controls";
        toggleBtn.setAttribute("aria-expanded", newVisibility.toString());
    }

    console.log(
        `[ChartJS] Controls panel ${newVisibility ? "shown" : "hidden"}`
    );
}
