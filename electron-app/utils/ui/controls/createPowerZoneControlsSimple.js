/**
 * Creates a separate power zone controls section that extracts existing power zone controls
 * @fileoverview Dedicated power zone chart controls section
 */

/**
 * Creates the power zone controls section by extracting existing controls
 * @param {HTMLElement} parentContainer - Parent container to append controls to
 * @returns {HTMLElement} The created power zone controls section
 */
export function createPowerZoneControls(parentContainer) {
    // Check if power zone controls already exist
    let existingControls = document.getElementById("power-zone-controls");
    if (existingControls) {
        return existingControls;
    }

    // Create main container
    const powerZoneSection = document.createElement("div");
    powerZoneSection.id = "power-zone-controls";
    powerZoneSection.className = "power-zone-controls-section";
    powerZoneSection.style.cssText = `
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
    header.className = "power-zone-header";
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid var(--color-border);
        padding-bottom: 12px;
    `;

    const title = document.createElement("h3");
    title.textContent = "⚡ Power Zone Charts";
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
    collapseBtn.className = "power-zone-collapse-btn";
    collapseBtn.textContent = "▼";
    collapseBtn.setAttribute("aria-label", "Toggle power zone controls");
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
    content.className = "power-zone-content";
    content.id = "power-zone-content";
    content.style.cssText = `
        transition: var(--transition-smooth);
        overflow: hidden;
    `;

    // Add collapse functionality
    let isCollapsed = localStorage.getItem("power-zone-controls-collapsed") === "true";
    updateCollapseState();

    collapseBtn.addEventListener("click", () => {
        isCollapsed = !isCollapsed;
        localStorage.setItem("power-zone-controls-collapsed", isCollapsed.toString());
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
    powerZoneSection.appendChild(header);
    powerZoneSection.appendChild(content);

    // Add hover effects
    powerZoneSection.addEventListener("mouseenter", () => {
        powerZoneSection.style.borderColor = "var(--color-primary-alpha)";
        powerZoneSection.style.boxShadow = "var(--color-box-shadow)";
    });

    powerZoneSection.addEventListener("mouseleave", () => {
        powerZoneSection.style.borderColor = "var(--color-border)";
        powerZoneSection.style.boxShadow = "var(--color-box-shadow-light)";
    });

    parentContainer.appendChild(powerZoneSection);
    return powerZoneSection;
}

/**
 * Moves existing power zone controls to the dedicated power zone section
 * This should be called after the field toggles are created
 */
export function movePowerZoneControlsToSection() {
    const powerZoneContent = document.getElementById("power-zone-content");
    if (!powerZoneContent) {
        console.warn("[PowerZoneControls] Power zone content container not found");
        return;
    }

    // Find existing power zone controls in the field toggles section
    const powerZoneFields = ["power_zone_doughnut"];
    const movedControls = [];

    powerZoneFields.forEach((fieldName) => {
        // Look for the toggle by ID
        const toggle = document.getElementById(`field-toggle-${fieldName}`);
        if (toggle && toggle.parentElement) {
            const controlContainer = toggle.parentElement;

            // Move the entire control container to the power zone section
            powerZoneContent.appendChild(controlContainer);
            movedControls.push(fieldName);

            console.log(`[PowerZoneControls] Moved ${fieldName} control to power zone section`);
        }
    });

    if (movedControls.length > 0) {
        console.log(`[PowerZoneControls] Successfully moved ${movedControls.length} power zone controls`);

        // Add some spacing between the controls
        const controls = powerZoneContent.children;
        for (let i = 0; i < controls.length; i++) {
            if (i > 0) {
                const el = /** @type {any} */ (controls[i]);
                if (el && el.style) {
                    el.style.marginTop = "12px";
                }
            }
        }
    }
}

/**
 * Updates power zone controls visibility based on data availability
 * @param {boolean} hasData - Whether power zone data is available
 */
export function updatePowerZoneControlsVisibility(hasData) {
    const controls = document.getElementById("power-zone-controls");
    if (!controls) return;

    if (hasData) {
        controls.style.display = "block";
        controls.style.opacity = "1";
    } else {
        controls.style.display = "none";
        controls.style.opacity = "0.5";
    }
}

/**
 * Gets current power zone chart visibility settings
 * @returns {Object} Visibility settings for power zone charts
 */
export function getPowerZoneVisibilitySettings() {
    return {
        doughnutVisible: localStorage.getItem("chartjs_field_power_zone_doughnut") !== "hidden",
    };
}
