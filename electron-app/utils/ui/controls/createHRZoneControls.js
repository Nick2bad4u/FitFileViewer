/**
 * Creates a separate heart rate zone controls section that extracts existing HR zone controls
 * @fileoverview Dedicated heart rate zone chart controls section
 */

import { createInlineZoneColorSelector } from "./createInlineZoneColorSelector.js";

/**
 * Creates the heart rate zone controls section by extracting existing controls
 * @param {HTMLElement} parentContainer - Parent container to append controls to
 * @returns {HTMLElement} The created heart rate zone controls section
 */
export function createHRZoneControls(parentContainer) {
    // Check if HR zone controls already exist
    const existingControls = document.getElementById("hr-zone-controls");
    if (existingControls) {
        return existingControls;
    }

    // Create main container
    const hrZoneSection = document.createElement("div");
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
    const header = document.createElement("div");
    header.className = "hr-zone-header";
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid var(--color-border);
        padding-bottom: 12px;
    `;
    const title = document.createElement("h3");
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
    const collapseBtn = document.createElement("button");
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

    header.appendChild(title);
    header.appendChild(collapseBtn);

    // Create content container that will hold the moved controls
    const content = document.createElement("div");
    content.className = "hr-zone-content";
    content.id = "hr-zone-content";
    content.style.cssText = `
        transition: var(--transition-smooth);
        overflow: hidden;
    `;

    // Add collapse functionality
    let isCollapsed = localStorage.getItem("hr-zone-controls-collapsed") === "true";
    updateCollapseState();

    collapseBtn.addEventListener("click", () => {
        isCollapsed = !isCollapsed;
        localStorage.setItem("hr-zone-controls-collapsed", isCollapsed.toString());
        updateCollapseState();
    });

    function updateCollapseState() {
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
    hrZoneSection.appendChild(header);
    hrZoneSection.appendChild(content);

    // Add hover effects
    hrZoneSection.addEventListener("mouseenter", () => {
        hrZoneSection.style.borderColor = "var(--color-primary-alpha)";
        hrZoneSection.style.boxShadow = "var(--color-box-shadow)";
    });

    hrZoneSection.addEventListener("mouseleave", () => {
        hrZoneSection.style.borderColor = "var(--color-border)";
        hrZoneSection.style.boxShadow = "var(--color-box-shadow-light)";
    });

    parentContainer.appendChild(hrZoneSection);
    return hrZoneSection;
}

/**
 * Moves existing heart rate zone controls to the dedicated HR zone section
 * This should be called after the field toggles are created
 */
export function moveHRZoneControlsToSection() {
    const hrZoneContent = document.getElementById("hr-zone-content");
    if (!hrZoneContent) {
        console.warn("[HRZoneControls] HR zone content container not found");
        return;
    } // Find existing HR zone controls in the field toggles section
    const hrZoneFields = ["hr_zone_doughnut", "hr_lap_zone_stacked", "hr_lap_zone_individual"],
        movedControls = [];

    hrZoneFields.forEach((fieldName) => {
        // Look for the toggle by ID
        const toggle = document.getElementById(`field-toggle-${fieldName}`);
        if (toggle && toggle.parentElement) {
            const controlContainer = toggle.parentElement;

            // Move the entire control container to the HR zone section
            hrZoneContent.appendChild(controlContainer);
            movedControls.push(fieldName);

            console.log(`[HRZoneControls] Moved ${fieldName} control to HR zone section`);
        }
    });
    if (movedControls.length > 0) {
        console.log(`[HRZoneControls] Successfully moved ${movedControls.length} HR zone controls`);

        // Add some spacing between the controls
        const controls = hrZoneContent.children;
        for (let i = 0; i < controls.length; i++) {
            if (i > 0) {
                /** @type {HTMLElement} */ (controls[i]).style.marginTop = "12px";
            }
        }

        // Add unified zone color picker button
        addUnifiedHRZoneColorPicker(hrZoneContent);
    }
}

/**
 * Adds a unified color picker button for all HR zone charts
 * @param {HTMLElement} container - Container to add the button to
 */
function addUnifiedHRZoneColorPicker(container) {
    // Create separator
    const separator = document.createElement("div");
    separator.style.cssText = `
        height: 1px;
        background: var(--color-border);
        margin: 16px 0 12px 0;
        opacity: 0.5;
    `;

    // Create inline zone color selector
    const colorSelectorContainer = document.createElement("div");
    colorSelectorContainer.style.cssText = `
        margin-top: 8px;
    `;

    // Create the inline selector
    const inlineSelector = createInlineZoneColorSelector("hr_zone", colorSelectorContainer);

    if (inlineSelector) {
        container.appendChild(separator);
        container.appendChild(colorSelectorContainer);
    }
}

/**
 * Updates HR zone controls visibility based on data availability
 * @param {boolean} hasData - Whether HR zone data is available
 */
export function updateHRZoneControlsVisibility(hasData) {
    const controls = document.getElementById("hr-zone-controls");
    if (!controls) {
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
 * Gets current heart rate zone chart visibility settings
 * @returns {Object} Visibility settings for HR zone charts
 */
export function getHRZoneVisibilitySettings() {
    return {
        doughnutVisible: localStorage.getItem("chartjs_field_hr_zone_doughnut") !== "hidden",
        lapStackedVisible: localStorage.getItem("chartjs_field_hr_lap_zone_stacked") !== "hidden",
        lapIndividualVisible: localStorage.getItem("chartjs_field_hr_lap_zone_individual") !== "hidden",
    };
}
