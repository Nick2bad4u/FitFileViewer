/**
 * Inline Zone Color Selector Utility
 * Creates an inline color selector that shows all zone colors in a compact format
 */

import { formatTime } from "../../formatting/formatters/formatTime.js";
import { renderChartJS } from "../../charts/core/renderChartJS.js";
import { showNotification } from "../notifications/showNotification.js";
import { chartStateManager } from "../../charts/core/chartStateManager.js";
import {
    DEFAULT_HR_ZONE_COLORS,
    DEFAULT_POWER_ZONE_COLORS,
    getChartSpecificZoneColor,
    saveChartSpecificZoneColor,
    resetChartSpecificZoneColors,
    getChartZoneColors,
    saveZoneColor,
    resetZoneColors,
    applyZoneColors,
    getZoneTypeFromField,
} from "../../data/zones/chartZoneColorUtils.js";

/**
 * Creates an inline zone color selector
 * @param {string} field - The chart field (e.g., "hr_zone", "power_zone")
 * @param {HTMLElement} container - Container to append the selector to
 * @returns {HTMLElement} The created selector element
 */
export function createInlineZoneColorSelector(field, container) {
    try {
        console.log(`[ZoneColorSelector] Creating inline selector for field: ${field}`);

        // Determine zone type and data
        let zoneData = null;
        let zoneType = "";
        let defaultColors = [];
        if (field.includes("hr_zone") || field.includes("hr_lap_zone") || field === "hr_zone") {
            zoneType = "hr";
            zoneData = window.heartRateZones;
            defaultColors = DEFAULT_HR_ZONE_COLORS;
        } else if (field.includes("power_zone") || field.includes("power_lap_zone") || field === "power_zone") {
            zoneType = "power";
            zoneData = window.powerZones;
            defaultColors = DEFAULT_POWER_ZONE_COLORS;
            console.log(`[ZoneColorSelector] Creating power zone selector with ${zoneData?.length || 0} zones`);
        } else {
            console.warn(`[ZoneColorSelector] Unknown zone field type: ${field}`);
            return null;
        }

        if (!zoneData || !Array.isArray(zoneData) || zoneData.length === 0) {
            console.warn(`[ZoneColorSelector] No zone data available for ${field}`);
            return null;
        }

        // Create main container
        const selectorContainer = document.createElement("div");
        selectorContainer.className = "inline-zone-color-selector";
        selectorContainer.style.cssText = `
            background: var(--color-glass);
            border: 1px solid var(--color-border);
            border-radius: var(--border-radius);
            padding: 16px;
            margin: 8px 0;
            backdrop-filter: var(--backdrop-blur);
        `; // Header
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--color-border);
        `;

        const title = document.createElement("h4");
        title.textContent = `${zoneType.toUpperCase()} Zone Colors`;
        title.style.cssText = `
            margin: 0;
            color: var(--color-fg);
            font-size: 14px;
            font-weight: 600;
        `; // Track current scheme state - load from localStorage if available
        const savedScheme = localStorage.getItem(`chartjs_${field}_color_scheme`);
        let currentScheme = savedScheme || "custom";

        console.log(`[ZoneColorSelector] Loaded color scheme '${currentScheme}' for ${field}`);

        // Zone colors grid (needs to be declared early for function references)
        const zoneGrid = document.createElement("div");
        zoneGrid.className = "zone-colors-grid";
        zoneGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 8px;
            margin-bottom: 12px;
        `; // Define update functions early (before they're used in callbacks)
        function updateZoneColorDisplay() {
            // Get current color scheme from storage
            const storedScheme = localStorage.getItem(`chartjs_${field}_color_scheme`) || "custom";

            // Update the scheme selector if it exists and doesn't match
            const schemeSelector = selectorContainer.querySelector("select");
            if (schemeSelector && schemeSelector.value !== storedScheme) {
                schemeSelector.value = storedScheme;
                currentScheme = storedScheme;
                console.log(`[ZoneColorSelector] Updated scheme selector to '${storedScheme}' for ${field}`);
            }

            // Update all zone color items
            const zoneItems = zoneGrid.querySelectorAll(".zone-color-item");
            zoneItems.forEach((item, index) => {
                const zoneIndex = (zoneData[index].zone || index + 1) - 1;
                let colorToShow;
                if (currentScheme === "custom") {
                    colorToShow = getChartSpecificZoneColor(field, zoneIndex);
                } else {
                    // Show the scheme color in the UI
                    const schemeColors = getChartZoneColors(zoneType, zoneData.length, currentScheme);
                    colorToShow =
                        schemeColors[zoneIndex] ||
                        defaultColors[zoneIndex] ||
                        defaultColors[zoneIndex % defaultColors.length];
                }
                // Fallback to default if needed
                if (!colorToShow)
                    colorToShow =
                        defaultColors[zoneIndex] || defaultColors[zoneIndex % defaultColors.length] || "#000000";
                // Update UI
                const colorInput = item.querySelector(".zone-color-input");
                const colorPreview = item.querySelector(".zone-color-preview");
                if (colorInput) colorInput.value = colorToShow;
                if (colorPreview) colorPreview.style.backgroundColor = colorToShow;
            });

            // Debounced visual update
            setTimeout(() => {
                const zoneItems = zoneGrid.querySelectorAll(".zone-color-item");
                zoneItems.forEach((item) => {
                    item.style.transform = "scale(1.02)";
                });

                setTimeout(() => {
                    zoneItems.forEach((item) => {
                        item.style.transform = "scale(1)";
                    });
                }, 100);
            }, 50);
        }

        // Update function for zone editability
        function updateZoneEditability() {
            const isCustom = currentScheme === "custom";
            const zoneItems = zoneGrid.querySelectorAll(".zone-color-item");

            zoneItems.forEach((item) => {
                const colorPreview = item.querySelector(".zone-color-preview");

                if (isCustom) {
                    // Enable editing
                    item.style.opacity = "1";
                    item.style.cursor = "pointer";
                    colorPreview.style.cursor = "pointer";
                    colorPreview.title = "Click to change color";
                } else {
                    // Disable editing
                    item.style.opacity = "0.6";
                    item.style.cursor = "not-allowed";
                    colorPreview.style.cursor = "not-allowed";
                    colorPreview.title = "Switch to Custom scheme to edit colors";
                }
            });
        } // Color scheme selector
        const schemeSelector = createColorSchemeSelector(
            field,
            zoneType,
            zoneData.length,
            defaultColors,
            () => {
                // This callback is called after scheme changes to update the display
                console.log(`[ZoneColorSelector] Scheme change callback triggered for ${field}`);
                updateZoneColorDisplay();
                updateZoneEditability();
            },
            (scheme) => {
                console.log(`[ZoneColorSelector] Scheme selected: ${scheme} for ${field}`);
                currentScheme = scheme;
                updateZoneEditability();
            },
            currentScheme
        );

        header.appendChild(title);
        header.appendChild(schemeSelector);

        // Create zone color items
        zoneData.forEach((zone, index) => {
            const zoneIndex = (zone.zone || index + 1) - 1; // Convert to 0-based index
            const zoneItem = createZoneColorItem(field, zone, zoneIndex, () => currentScheme);
            zoneGrid.appendChild(zoneItem);
        });

        // Action buttons
        const actions = document.createElement("div");
        actions.style.cssText = `
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            padding-top: 8px;
            border-top: 1px solid var(--color-border);
        `;

        // Reset all button
        const resetButton = createResetButton(field, zoneType, zoneData, defaultColors, () => {
            updateZoneColorDisplay();
        });
        actions.appendChild(resetButton);

        // Assemble selector
        selectorContainer.appendChild(header);
        selectorContainer.appendChild(zoneGrid);
        selectorContainer.appendChild(actions);

        // Sync any existing chart-specific colors to generic zone storage for chart rendering
        const zoneTypeForStorage =
            field.includes("hr_zone") || field.includes("hr_lap_zone") || field === "hr_zone" ? "hr" : "power";

        // Ensure comprehensive color persistence
        ensureZoneColorPersistence(field, zoneTypeForStorage, zoneData.length);

        zoneData.forEach((zone, index) => {
            const zoneIndex = (zone.zone || index + 1) - 1;
            const chartSpecificColor = getChartSpecificZoneColor(field, zoneIndex);

            // Save to generic storage if it's different from default
            const defaultColors = zoneTypeForStorage === "hr" ? DEFAULT_HR_ZONE_COLORS : DEFAULT_POWER_ZONE_COLORS;
            const defaultColor = defaultColors[zoneIndex] || defaultColors[zoneIndex % defaultColors.length];

            if (chartSpecificColor !== defaultColor) {
                saveZoneColor(zoneTypeForStorage, zoneIndex, chartSpecificColor);
            }
        }); // Store update function for external access
        selectorContainer._updateDisplay = updateZoneColorDisplay;

        // Initialize with loaded scheme editability and colors
        setTimeout(() => {
            updateZoneEditability();

            // If a non-custom scheme is loaded, apply its colors if they haven't been customized
            if (currentScheme !== "custom") {
                const hasCustomColors = zoneData.some((zone, index) => {
                    const zoneIndex = (zone.zone || index + 1) - 1;
                    const chartSpecificColor = getChartSpecificZoneColor(field, zoneIndex);
                    const defaultColors =
                        zoneTypeForStorage === "hr" ? DEFAULT_HR_ZONE_COLORS : DEFAULT_POWER_ZONE_COLORS;
                    const defaultColor = defaultColors[zoneIndex] || defaultColors[zoneIndex % defaultColors.length];
                    return chartSpecificColor !== defaultColor;
                });

                // If no custom colors are saved, apply the scheme colors
                if (!hasCustomColors) {
                    const schemeColors = getChartZoneColors(zoneType, zoneData.length, currentScheme);
                    schemeColors.forEach((color, index) => {
                        saveChartSpecificZoneColor(field, index, color);
                        saveZoneColor(zoneTypeForStorage, index, color);
                    });
                    updateZoneColorDisplay();
                    console.log(
                        `[ZoneColorSelector] Applied ${currentScheme} scheme colors on initialization for ${field}`
                    );
                }
            }
        }, 10);

        // Apply saved zone colors during initialization
        const detectedZoneType = getZoneTypeFromField(field);
        if (detectedZoneType) {
            zoneData = applyZoneColors(zoneData, detectedZoneType);
        }

        if (container) {
            container.appendChild(selectorContainer);
        }

        console.log(`[ZoneColorSelector] Inline selector created for ${zoneType} zones`);
        return selectorContainer;
    } catch (error) {
        console.error("[ZoneColorSelector] Error creating inline selector:", error);
        showNotification("Failed to create zone color selector", "error");
        return null;
    }
}

/**
 * Creates a zone color item with preview and picker
 * @param {string} field - Chart field
 * @param {Object} zone - Zone data object
 * @param {number} zoneIndex - 0-based zone index
 * @param {Function} getCurrentScheme - Function that returns current scheme
 * @returns {HTMLElement} Zone color item element
 */
function createZoneColorItem(field, zone, zoneIndex, getCurrentScheme) {
    const currentColor = getChartSpecificZoneColor(field, zoneIndex);

    const item = document.createElement("div");
    item.className = "zone-color-item";
    item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: var(--color-bg-alt);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-small);
        transition: var(--transition-smooth);
    `;

    // Zone label
    const label = document.createElement("div");
    label.className = "zone-label";
    label.style.cssText = `
        flex: 1;
        font-size: 12px;
        color: var(--color-fg);
        font-weight: 500;
    `;

    const zoneName = zone.label || `Zone ${zone.zone || zoneIndex + 1}`;
    const zoneTime = zone.time ? formatTime(zone.time, true) : "";
    label.innerHTML = `
        <div>${zoneName}</div>
        ${zoneTime ? `<div style="font-size: 10px; color: var(--color-fg-alt); margin-top: 2px;">${zoneTime}</div>` : ""}
    `;

    // Color preview
    const colorPreview = document.createElement("div");
    colorPreview.className = "zone-color-preview";
    colorPreview.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background-color: ${currentColor};
        border: 2px solid var(--color-border);
        cursor: pointer;
        transition: var(--transition-smooth);
    `; // Hidden color input
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = currentColor;
    colorInput.className = "zone-color-input";
    colorInput.style.cssText = `
        opacity: 0;
        position: absolute;
        width: 0;
        height: 0;
        pointer-events: none;
    `;

    // Color change handler
    colorInput.addEventListener("change", (e) => {
        const newColor = e.target.value;
        console.log(`[ZoneColorSelector] Color changed for ${field} zone ${zoneIndex + 1}: ${newColor}`);

        colorPreview.style.backgroundColor = newColor;

        // Set color scheme to custom when manually changing a zone color
        localStorage.setItem(`chartjs_${field}_color_scheme`, "custom");

        // Save color to both chart-specific and generic zone storage
        // Chart-specific storage (for the inline selector consistency)
        saveChartSpecificZoneColor(field, zoneIndex, newColor);

        // Generic zone storage (for chart rendering functions to read)
        const zoneType =
            field.includes("hr_zone") || field.includes("hr_lap_zone") || field === "hr_zone" ? "hr" : "power";
        saveZoneColor(zoneType, zoneIndex, newColor);

        updateZoneColorPreview(field, zoneIndex, newColor);

        // Update all inline zone color selector UIs to reflect the scheme change to custom
        updateInlineZoneColorSelectors(document.body);

        // Use the exact same mechanism as metrics color changes
        try {
            console.log(`[ZoneColorSelector] Triggering chart re-render (same mechanism as metrics)`);

            // Dispatch custom event for field toggle change (same as metrics)
            window.dispatchEvent(
                new CustomEvent("fieldToggleChanged", {
                    detail: { field, type: "zone-color", zoneIndex, value: newColor },
                })
            );

            // Trigger chart re-render through modern state management
            if (chartStateManager) {
                chartStateManager.debouncedRender(`Zone color change: zone ${zoneIndex}`);
            } else if (typeof window.renderChartJS === "function") {
                window.renderChartJS();
            } else if (typeof renderChartJS === "function") {
                renderChartJS();
            } else {
                // Import and call renderChartJS if not available globally
                import("./renderChartJS.js")
                    .then(({ renderChartJS }) => {
                        renderChartJS();
                    })
                    .catch((error) => {
                        console.error("[ZoneColorSelector] Error importing renderChartJS:", error);
                    });
            }
        } catch (error) {
            console.error("[ZoneColorSelector] Error triggering chart re-render:", error);
        }
    });

    // Click preview to open color picker (only if custom scheme)
    colorPreview.addEventListener("click", () => {
        if (getCurrentScheme() === "custom") {
            colorInput.click();
        }
    });

    // Hover effects
    item.addEventListener("mouseenter", () => {
        item.style.background = "var(--color-accent-hover)";
        colorPreview.style.transform = "scale(1.1)";
        colorPreview.style.boxShadow = "var(--color-box-shadow-light)";
    });

    item.addEventListener("mouseleave", () => {
        item.style.background = "var(--color-bg-alt)";
        colorPreview.style.transform = "scale(1)";
        colorPreview.style.boxShadow = "none";
    });

    item.appendChild(label);
    item.appendChild(colorPreview);
    item.appendChild(colorInput);

    return item;
}

/**
 * Creates a color scheme selector dropdown
 * @param {string} field - Chart field
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @param {Array} defaultColors - Default color array for the zone type
 * @param {Function} onSchemeChange - Callback when scheme changes
 * @param {Function} onSchemeSelect - Callback when scheme is selected (gets scheme name)
 * @param {string} initialScheme - Initial scheme to select
 * @returns {HTMLElement} Scheme selector element
 */
function createColorSchemeSelector(
    field,
    zoneType,
    zoneCount,
    defaultColors,
    onSchemeChange,
    onSchemeSelect,
    initialScheme = "custom"
) {
    const container = document.createElement("div");
    container.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const label = document.createElement("label");
    label.textContent = "Scheme:";
    label.style.cssText = `
        font-size: 12px;
        color: var(--color-fg-alt);
        font-weight: 500;
    `;

    const select = document.createElement("select");
    select.style.cssText = `
        padding: 4px 8px;
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-small);
        background: var(--color-bg-solid);
        color: var(--color-fg);
        font-size: 12px;
        cursor: pointer;
        outline: none;
    `;

    // Add scheme options
    const schemes = {
        custom: "Custom",
        classic: "Classic",
        vibrant: "Vibrant",
        monochrome: "Monochrome",
        pastel: "Pastel",
        dark: "Dark",
        rainbow: "Rainbow",
        ocean: "Ocean",
        earth: "Earth",
        fire: "Fire",
        forest: "Forest",
        sunset: "Sunset",
        grayscale: "Grayscale",
        neon: "Neon",
        autumn: "Autumn",
        spring: "Spring",
        cycling: "Cycling (Power)",
        runner: "Runner (Power)",
    };

    Object.entries(schemes).forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        select.appendChild(option);
    });

    // Set initial scheme value
    select.value = initialScheme && schemes[initialScheme] ? initialScheme : "custom";
    console.log(`[ZoneColorSelector] Set initial scheme to '${select.value}' for ${field}`);
    select.addEventListener("change", (e) => {
        const scheme = e.target.value;
        localStorage.setItem(`chartjs_${field}_color_scheme`, scheme);
        if (onSchemeSelect) onSchemeSelect(scheme);

        if (scheme !== "custom") {
            // Only apply scheme colors for display/chart, do NOT persist as custom
            const schemeColors = getChartZoneColors(zoneType, zoneCount, scheme);
            for (let i = 0; i < zoneCount; i++) {
                // Only update generic zone color for chart rendering
                saveZoneColor(zoneType, i, schemeColors[i]);
            }
            showNotification(`Applied ${schemes[scheme]} color scheme`, "success");
        } else {
            // Restore custom colors from chart-specific storage or fallback
            for (let i = 0; i < zoneCount; i++) {
                let colorToUse = localStorage.getItem(`chartjs_${field}_zone_${i + 1}_color`);
                if (!colorToUse) {
                    // fallback to generic or default
                    colorToUse =
                        localStorage.getItem(`chartjs_${zoneType}_zone_${i + 1}_color`) ||
                        defaultColors[i] ||
                        defaultColors[i % defaultColors.length];
                }
                // Restore both storages for consistency
                saveChartSpecificZoneColor(field, i, colorToUse);
                saveZoneColor(zoneType, i, colorToUse);
            }
            showNotification("Switched to custom color scheme", "info");
        }
        // Always update UI and chart after scheme change
        if (onSchemeChange) onSchemeChange();
        try {
            window.dispatchEvent(
                new CustomEvent("fieldToggleChanged", {
                    detail: { field, type: "zone-scheme", scheme, value: scheme },
                })
            );

            // Trigger chart re-render through modern state management
            if (chartStateManager) {
                chartStateManager.debouncedRender(`Zone scheme change: ${scheme}`);
            } else if (typeof window.renderChartJS === "function") {
                window.renderChartJS();
            } else if (typeof renderChartJS === "function") {
                renderChartJS();
            }
        } catch (error) {
            console.error("[ZoneColorSelector] Error during scheme change re-render:", error);
        }
    });

    container.appendChild(label);
    container.appendChild(select);
    return container;
}

/**
 * Creates a reset button for resetting all zone colors
 * @param {string} field - Chart field
 * @param {string} zoneType - "hr" or "power"
 * @param {Array} zoneData - Zone data array
 * @param {string[]} defaultColors - Default colors array
 * @param {Function} onReset - Callback when reset is clicked
 * @returns {HTMLElement} Reset button element
 */
function createResetButton(field, zoneType, zoneData, defaultColors, onReset) {
    const button = document.createElement("button");
    button.innerHTML = "↻ Reset";
    button.title = "Reset all zone colors to defaults";
    button.style.cssText = `
        padding: 6px 12px;
        background: var(--color-btn-bg);
        color: var(--color-fg);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-small);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition-smooth);
        display: flex;
        align-items: center;
        gap: 4px;
    `;
    button.addEventListener("click", () => {
        // Reset chart-specific colors
        resetChartSpecificZoneColors(field, zoneData.length);

        // Also reset generic zone colors for chart rendering
        resetZoneColors(zoneType, zoneData.length);

        onReset();
        showNotification(`${zoneType.toUpperCase()} zone colors reset to defaults`, "success");

        // Update all inline zone color selector UIs to reflect the scheme change to custom
        updateInlineZoneColorSelectors(document.body);

        // Use the exact same mechanism as metrics color changes
        try {
            console.log(`[ZoneColorSelector] Triggering chart re-render for reset (same mechanism as metrics)`);

            // Dispatch custom event for field toggle change (same as metrics)
            window.dispatchEvent(
                new CustomEvent("fieldToggleChanged", {
                    detail: { field, type: "zone-reset", value: "reset" },
                })
            );

            // Trigger chart re-render through modern state management
            if (chartStateManager) {
                chartStateManager.debouncedRender(`Zone colors reset for ${zoneType}`);
            } else if (typeof window.renderChartJS === "function") {
                window.renderChartJS();
            } else if (typeof renderChartJS === "function") {
                renderChartJS();
            } else {
                // Import and call renderChartJS if not available globally
                import("./renderChartJS.js")
                    .then(({ renderChartJS }) => {
                        renderChartJS();
                    })
                    .catch((error) => {
                        console.error("[ZoneColorSelector] Error importing renderChartJS:", error);
                    });
            }

            console.log(`[ZoneColorSelector] Chart re-render triggered for ${field} reset using unified mechanism`);
        } catch (error) {
            console.error("[ZoneColorSelector] Error during reset re-render:", error);
        }
    });

    button.addEventListener("mouseenter", () => {
        button.style.background = "var(--color-btn-hover)";
        button.style.transform = "translateY(-1px)";
        button.style.boxShadow = "var(--color-box-shadow-light)";
    });

    button.addEventListener("mouseleave", () => {
        button.style.background = "var(--color-btn-bg)";
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "none";
    });

    return button;
}

/**
 * Updates zone color preview in real-time (if chart is visible)
 * @param {string} field - The field name
 * @param {number} zoneIndex - Zone index (0-based)
 * @param {string} newColor - New color value
 */
function updateZoneColorPreview(field, zoneIndex, newColor) {
    try {
        // Find all charts that might be affected by this zone color change
        if (window._chartjsInstances && Array.isArray(window._chartjsInstances)) {
            let chartsUpdated = 0;

            window._chartjsInstances.forEach((chart) => {
                if (!chart || !chart.data || !chart.data.datasets) return;

                // Check if this chart contains zone data that matches our field
                const isHRZoneChart =
                    field.includes("hr_zone") &&
                    chart.data.datasets.some(
                        (dataset) =>
                            dataset.label &&
                            (dataset.label.includes("Heart Rate") ||
                                dataset.label.includes("HR Zone") ||
                                dataset.label.toLowerCase().includes("heart"))
                    );

                const isPowerZoneChart =
                    field.includes("power_zone") &&
                    chart.data.datasets.some(
                        (dataset) =>
                            dataset.label &&
                            (dataset.label.includes("Power") ||
                                dataset.label.includes("Power Zone") ||
                                dataset.label.toLowerCase().includes("watt"))
                    );

                if (isHRZoneChart || isPowerZoneChart) {
                    // Update all datasets that might have zone colors
                    chart.data.datasets.forEach((dataset) => {
                        if (Array.isArray(dataset.backgroundColor) && dataset.backgroundColor[zoneIndex]) {
                            dataset.backgroundColor[zoneIndex] = newColor;
                            chartsUpdated++;
                        }
                    });

                    // Update the chart
                    chart.update("none");
                }
            });

            if (chartsUpdated > 0) {
                console.log(
                    `[ZoneColorSelector] Updated ${chartsUpdated} chart datasets for ${field} zone ${zoneIndex + 1}`
                );
            }
        }
    } catch (error) {
        console.warn("[ZoneColorSelector] Could not update zone color preview:", error);
    }
}

/**
 * Removes existing inline zone color selectors from a container
 * @param {HTMLElement} container - Container to clean up
 */
export function removeInlineZoneColorSelectors(container) {
    if (!container) return;

    const selectors = container.querySelectorAll(".inline-zone-color-selector");
    selectors.forEach((selector) => selector.remove());
}

/**
 * Updates all inline zone color selectors in a container
 * @param {HTMLElement} container - Container with selectors
 */
export function updateInlineZoneColorSelectors(container) {
    if (!container) return;

    const selectors = container.querySelectorAll(".inline-zone-color-selector");
    selectors.forEach((selector) => {
        if (selector._updateDisplay) {
            selector._updateDisplay();
        }
    });
}

/**
 * Ensures zone colors are properly persisted to localStorage
 * @param {string} field - Chart field
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 */
function ensureZoneColorPersistence(field, zoneType, zoneCount) {
    try {
        console.log(`[ZoneColorSelector] Ensuring color persistence for ${field}`);

        for (let i = 0; i < zoneCount; i++) {
            const chartSpecificColor = getChartSpecificZoneColor(field, i);
            const genericColor = localStorage.getItem(`chartjs_${zoneType}_zone_${i + 1}_color`);

            // Sync colors between chart-specific and generic storage
            if (chartSpecificColor && !genericColor) {
                saveZoneColor(zoneType, i, chartSpecificColor);
                console.log(`[ZoneColorSelector] Synced chart-specific color to generic storage for zone ${i + 1}`);
            } else if (genericColor && chartSpecificColor !== genericColor) {
                // If generic color exists but chart-specific is different, use the more recent one
                // In this case, we'll prefer chart-specific as it's more targeted
                saveZoneColor(zoneType, i, chartSpecificColor);
                console.log(`[ZoneColorSelector] Updated generic storage with chart-specific color for zone ${i + 1}`);
            }
        }
    } catch (error) {
        console.warn("[ZoneColorSelector] Error ensuring color persistence:", error);
    }
}

/**
 * Clears all saved zone color data for a specific field
 * @param {string} field - Chart field
 * @param {number} zoneCount - Number of zones
 */
export function clearZoneColorData(field, zoneCount) {
    try {
        console.log(`[ZoneColorSelector] Clearing all zone color data for ${field}`);

        // Clear color scheme preference
        localStorage.removeItem(`chartjs_${field}_color_scheme`);

        // Clear chart-specific colors
        for (let i = 0; i < zoneCount; i++) {
            localStorage.removeItem(`chartjs_${field}_zone_${i + 1}_color`);
        }

        // Clear generic zone colors
        const zoneType =
            field.includes("hr_zone") || field.includes("hr_lap_zone") || field === "hr_zone" ? "hr" : "power";
        for (let i = 0; i < zoneCount; i++) {
            localStorage.removeItem(`chartjs_${zoneType}_zone_${i + 1}_color`);
        }

        console.log(`[ZoneColorSelector] Cleared all zone color data for ${field}`);
    } catch (error) {
        console.error("[ZoneColorSelector] Error clearing zone color data:", error);
    }
}

/**
 * Gets the current color scheme for a field
 * @param {string} field - Chart field
 * @returns {string} Current color scheme ("custom", "classic", "vibrant", "monochrome")
 */
export function getCurrentColorScheme(field) {
    return localStorage.getItem(`chartjs_${field}_color_scheme`) || "custom";
}
