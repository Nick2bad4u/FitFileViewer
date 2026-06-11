/**
 * Creates a separate heart rate zone controls section that extracts existing HR
 * zone controls.
 */

import { getChartFieldVisibility } from "../../state/domain/settingsStateManager.js";
import { createInlineZoneColorSelector } from "./createInlineZoneColorSelector.js";
import { getHRZoneControlsRuntime } from "./createHRZoneControlsRuntime.js";

/**
 * Current visibility state for heart rate zone charts.
 */
export type HRZoneVisibilitySettings = {
    readonly doughnutVisible: boolean;
    readonly lapIndividualVisible: boolean;
    readonly lapStackedVisible: boolean;
};

/**
 * Creates the heart rate zone controls section by extracting existing controls.
 *
 * @param parentContainer - Parent container to append controls to.
 *
 * @returns The created heart rate zone controls section.
 */
export function createHRZoneControls(
    parentContainer: HTMLElement
): HTMLElement {
    const runtime = getHRZoneControlsRuntime();
    // Check if HR zone controls already exist
    const existingControls = runtime.querySelector("#hr-zone-controls");
    if (runtime.isHTMLElement(existingControls)) {
        return existingControls;
    }

    // Create main container
    const hrZoneSection = runtime.createElement("div");
    hrZoneSection.id = "hr-zone-controls";
    hrZoneSection.className = "hr-zone-controls-section";
    hrZoneSection.style.cssText = `
        background: var(--color-glass);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        padding: 20px;
        margin: 16px 0;
        backdrop-filter: blur(10px);
        box-shadow: var(--color-box-shadow-light);
        transition: var(--transition-smooth);
    `;

    // Create header
    const header = runtime.createElement("div");
    header.className = "hr-zone-header";
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid var(--color-border);
        padding-bottom: 12px;
    `;
    const title = runtime.createElement("h3");
    title.textContent = "❤️ Heart Rate Zone Charts";
    title.style.cssText = `
        margin: 0;
        color: var(--color-fg-alt);
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    // Create collapse toggle button
    const collapseBtn = runtime.createElement("button");
    collapseBtn.className = "hr-zone-collapse-btn";
    collapseBtn.textContent = "▼";
    collapseBtn.setAttribute("aria-label", "Toggle heart rate zone controls");
    collapseBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--color-fg-alt);
        font-size: 16px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: var(--transition-smooth);
    `;

    header.append(title);
    header.append(collapseBtn);

    // Create content container that will hold the moved controls
    const content = runtime.createElement("div");
    content.className = "hr-zone-content";
    content.id = "hr-zone-content";
    content.style.cssText = `
        transition: var(--transition-smooth);
        overflow: hidden;
    `;

    // Add collapse functionality
    let isCollapsed =
        runtime.getStorageItem("hr-zone-controls-collapsed") === "true";
    updateCollapseState();

    const listenerController = runtime.createAbortController();
    collapseBtn.addEventListener(
        "click",
        () => {
            isCollapsed = !isCollapsed;
            runtime.setStorageItem(
                "hr-zone-controls-collapsed",
                isCollapsed.toString()
            );
            updateCollapseState();
        },
        { signal: listenerController.signal }
    );

    function updateCollapseState(): void {
        if (isCollapsed) {
            content.style.maxHeight = "0";
            content.style.opacity = "0";
            content.style.marginTop = "0";
            collapseBtn.textContent = "▶";
            collapseBtn.setAttribute("aria-expanded", "false");
        } else {
            content.style.maxHeight = "500px";
            content.style.opacity = "1";
            content.style.marginTop = "0";
            collapseBtn.textContent = "▼";
            collapseBtn.setAttribute("aria-expanded", "true");
        }
    }

    // Assemble the section
    hrZoneSection.append(header);
    hrZoneSection.append(content);

    // Add hover effects
    hrZoneSection.addEventListener(
        "mouseenter",
        () => {
            hrZoneSection.style.borderColor = "var(--color-primary-alpha)";
            hrZoneSection.style.boxShadow = "var(--color-box-shadow)";
        },
        { signal: listenerController.signal }
    );

    hrZoneSection.addEventListener(
        "mouseleave",
        () => {
            hrZoneSection.style.borderColor = "var(--color-border)";
            hrZoneSection.style.boxShadow = "var(--color-box-shadow-light)";
        },
        { signal: listenerController.signal }
    );

    parentContainer.append(hrZoneSection);
    return hrZoneSection;
}

/**
 * Gets current heart rate zone chart visibility settings.
 *
 * @returns Visibility settings for HR zone charts.
 */
export function getHRZoneVisibilitySettings(): HRZoneVisibilitySettings {
    return {
        doughnutVisible:
            getChartFieldVisibility("hr_zone_doughnut") !== "hidden",
        lapIndividualVisible:
            getChartFieldVisibility("hr_lap_zone_individual") !== "hidden",
        lapStackedVisible:
            getChartFieldVisibility("hr_lap_zone_stacked") !== "hidden",
    };
}

/**
 * Moves existing heart rate zone controls to the dedicated HR zone section This
 * should be called after the field toggles are created
 */
export function moveHRZoneControlsToSection(): void {
    const runtime = getHRZoneControlsRuntime();
    const hrZoneContent = runtime.querySelector("#hr-zone-content");
    if (!runtime.isHTMLElement(hrZoneContent)) {
        console.warn("[HRZoneControls] HR zone content container not found");
        return;
    } // Find existing HR zone controls in the field toggles section
    const hrZoneFields = [
            "hr_zone_doughnut",
            "hr_lap_zone_stacked",
            "hr_lap_zone_individual",
        ],
        movedControls: string[] = [];

    for (const fieldName of hrZoneFields) {
        // Look for the toggle by ID
        const toggle = runtime.querySelector(`#field-toggle-${fieldName}`);
        if (toggle && toggle.parentElement) {
            const controlContainer = toggle.parentElement;

            // Move the entire control container to the HR zone section
            hrZoneContent.append(controlContainer);
            movedControls.push(fieldName);

            console.log(
                `[HRZoneControls] Moved ${fieldName} control to HR zone section`
            );
        }
    }
    if (movedControls.length > 0) {
        console.log(
            `[HRZoneControls] Successfully moved ${movedControls.length} HR zone controls`
        );

        // Add some spacing between the controls
        const controls = [...hrZoneContent.children];
        for (const [i, control] of controls.entries()) {
            if (i > 0 && runtime.isHTMLElement(control)) {
                control.style.marginTop = "12px";
            }
        }

        // Add unified zone color picker button
        addUnifiedHRZoneColorPicker(hrZoneContent);
    }
}

/**
 * Updates HR zone controls visibility based on data availability.
 *
 * @param hasData - Whether HR zone data is available.
 */
export function updateHRZoneControlsVisibility(hasData: boolean): void {
    const runtime = getHRZoneControlsRuntime();
    const controls = runtime.querySelector("#hr-zone-controls");
    if (!runtime.isHTMLElement(controls)) {
        return;
    }

    if (hasData) {
        controls.style.display = "block";
        controls.style.opacity = "1";
    } else {
        controls.style.display = "none";
        controls.style.opacity = "0.5";
    }
}

/**
 * Adds a unified color picker button for all HR zone charts.
 *
 * @param container - Container to add the button to.
 */
function addUnifiedHRZoneColorPicker(container: HTMLElement): void {
    const runtime = getHRZoneControlsRuntime();
    // Create separator
    const separator = runtime.createElement("div");
    separator.style.cssText = `
        height: 1px;
        background: var(--color-border);
        margin: 16px 0 12px 0;
        opacity: 0.5;
    `;

    // Create inline zone color selector
    const colorSelectorContainer = runtime.createElement("div");
    colorSelectorContainer.style.cssText = `
        margin-top: 8px;
    `;

    // Create the inline selector
    if (createInlineZoneColorSelector("hr_zone", colorSelectorContainer)) {
        container.append(separator);
        container.append(colorSelectorContainer);
    }
}
