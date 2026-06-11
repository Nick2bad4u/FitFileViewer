/**
 * Creates a separate power zone controls section that extracts existing power
 * zone controls
 */

import { getChartFieldVisibility } from "../../state/domain/settingsStateManager.js";
import { getPowerZoneControlsSimpleRuntime } from "./createPowerZoneControlsSimpleRuntime.js";

/** Current visibility state for the simple power zone chart controls. */
export type SimplePowerZoneVisibilitySettings = {
    readonly doughnutVisible: boolean;
};

/**
 * Creates the power zone controls section by extracting existing controls.
 */
export function createPowerZoneControls(
    parentContainer: HTMLElement
): HTMLElement {
    const runtime = getPowerZoneControlsSimpleRuntime();
    // Check if power zone controls already exist
    const existingControls = runtime.querySelector("#power-zone-controls");
    if (runtime.isHTMLElement(existingControls)) {
        return existingControls;
    }

    // Create main container
    const powerZoneSection = runtime.createElement("div");
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
    const header = runtime.createElement("div");
    header.className = "power-zone-header";
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid var(--color-border);
        padding-bottom: 12px;
    `;

    const title = runtime.createElement("h3");
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
    const collapseBtn = runtime.createElement("button");
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

    header.append(title);
    header.append(collapseBtn);

    // Create content container that will hold the moved controls
    const content = runtime.createElement("div");
    content.className = "power-zone-content";
    content.id = "power-zone-content";
    content.style.cssText = `
        transition: var(--transition-smooth);
        overflow: hidden;
    `;

    // Add collapse functionality
    let isCollapsed =
        runtime.getStorageItem("power-zone-controls-collapsed") === "true";
    updateCollapseState();

    const listenerController = runtime.createAbortController();
    collapseBtn.addEventListener(
        "click",
        () => {
            isCollapsed = !isCollapsed;
            runtime.setStorageItem(
                "power-zone-controls-collapsed",
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
    powerZoneSection.append(header);
    powerZoneSection.append(content);

    // Add hover effects
    powerZoneSection.addEventListener(
        "mouseenter",
        () => {
            powerZoneSection.style.borderColor = "var(--color-primary-alpha)";
            powerZoneSection.style.boxShadow = "var(--color-box-shadow)";
        },
        { signal: listenerController.signal }
    );

    powerZoneSection.addEventListener(
        "mouseleave",
        () => {
            powerZoneSection.style.borderColor = "var(--color-border)";
            powerZoneSection.style.boxShadow = "var(--color-box-shadow-light)";
        },
        { signal: listenerController.signal }
    );

    parentContainer.append(powerZoneSection);
    return powerZoneSection;
}

/** Gets current power zone chart visibility settings. */
export function getPowerZoneVisibilitySettings(): SimplePowerZoneVisibilitySettings {
    return {
        doughnutVisible:
            getChartFieldVisibility("power_zone_doughnut") !== "hidden",
    };
}

/**
 * Moves existing power zone controls to the dedicated power zone section This
 * should be called after the field toggles are created
 */
export function movePowerZoneControlsToSection(): void {
    const runtime = getPowerZoneControlsSimpleRuntime();
    const powerZoneContent = runtime.querySelector("#power-zone-content");
    if (!runtime.isHTMLElement(powerZoneContent)) {
        console.warn(
            "[PowerZoneControls] Power zone content container not found"
        );
        return;
    }

    // Find existing power zone controls in the field toggles section
    const movedControls: string[] = [],
        powerZoneFields = ["power_zone_doughnut"];

    for (const fieldName of powerZoneFields) {
        // Look for the toggle by ID
        const toggle = runtime.querySelector(`#field-toggle-${fieldName}`);
        if (toggle && toggle.parentElement) {
            const controlContainer = toggle.parentElement;

            // Move the entire control container to the power zone section
            powerZoneContent.append(controlContainer);
            movedControls.push(fieldName);

            console.log(
                `[PowerZoneControls] Moved ${fieldName} control to power zone section`
            );
        }
    }

    if (movedControls.length > 0) {
        console.log(
            `[PowerZoneControls] Successfully moved ${movedControls.length} power zone controls`
        );

        // Add some spacing between the controls
        const controls = [...powerZoneContent.children];
        for (const [index, el] of controls.entries()) {
            if (index > 0 && runtime.isHTMLElement(el)) {
                el.style.marginTop = "12px";
            }
        }
    }
}

/**
 * Updates power zone controls visibility based on data availability
 *
 * @param hasData - Whether power zone data is available.
 */
export function updatePowerZoneControlsVisibility(hasData: boolean): void {
    const runtime = getPowerZoneControlsSimpleRuntime();
    const controls = runtime.querySelector("#power-zone-controls");
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
