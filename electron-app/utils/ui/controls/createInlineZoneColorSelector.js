/**
 * Inline Zone Color Selector Utility
 * Creates an inline color selector that shows all zone colors in a compact format
 */

import { chartStateManager } from "../../charts/core/chartStateManager.js";
// Avoid direct import to prevent circular dependency during SSR; use event-based request
import {
    applyZoneColors,
    clearCachedChartZoneColor,
    clearCachedZoneColor,
    DEFAULT_HR_ZONE_COLORS,
    DEFAULT_POWER_ZONE_COLORS,
    getChartSpecificZoneColor,
    getChartZoneColors,
    getZoneTypeFromField,
    resetChartSpecificZoneColors,
    resetZoneColors,
    saveChartSpecificZoneColor,
    saveZoneColor,
} from "../../data/zones/chartZoneColorUtils.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { showNotification } from "../notifications/showNotification.js";

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
            clearCachedChartZoneColor(field, i);
        }

        // Clear generic zone colors
        const zoneType =
            field.includes("hr_zone") || field.includes("hr_lap_zone") || field === "hr_zone" ? "hr" : "power";
        for (let i = 0; i < zoneCount; i++) {
            localStorage.removeItem(`chartjs_${zoneType}_zone_${i + 1}_color`);
            clearCachedZoneColor(zoneType, i);
        }

        console.log(`[ZoneColorSelector] Cleared all zone color data for ${field}`);
    } catch (error) {
        console.error("[ZoneColorSelector] Error clearing zone color data:", error);
    }
}

/**
 * Creates an inline zone color selector
 * @param {string} field - The chart field (e.g., "hr_zone", "power_zone")
 * @param {HTMLElement} container - Container to append the selector to
 * @returns {HTMLElement} The created selector element
 */
/**
 * @typedef {Object} ZoneDataItem
 * @property {string} [label]
 * @property {number} [zone]
 * @property {number} [time]
 * @property {number} [value]
 * @property {string} [color]
 */
/**
 * @param {string} field
 * @param {HTMLElement} container
 */
export function createInlineZoneColorSelector(field, container) {
    try {
        console.log(`[ZoneColorSelector] Creating inline selector for field: ${field}`);

        // Determine zone type and data
        /** @type {ZoneDataItem[]|null} */
        let /** @type {string[]} */
            defaultColors = [],
            zoneData = null,
            zoneType = "";
        if (field.includes("hr_zone") || field.includes("hr_lap_zone") || field === "hr_zone") {
            zoneType = "hr";
            zoneData = /** @type {ZoneDataItem[]|null} */ (globalThis.heartRateZones || null);
            defaultColors = DEFAULT_HR_ZONE_COLORS;
        } else if (field.includes("power_zone") || field.includes("power_lap_zone") || field === "power_zone") {
            zoneType = "power";
            zoneData = /** @type {ZoneDataItem[]|null} */ (globalThis.powerZones || null);
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
            const schemeSelector = /** @type {HTMLSelectElement|null} */ (selectorContainer.querySelector("select"));
            const storedScheme = localStorage.getItem(`chartjs_${field}_color_scheme`) || "custom";
            if (schemeSelector && schemeSelector.value !== storedScheme) {
                schemeSelector.value = storedScheme;
                currentScheme = storedScheme;
                console.log(`[ZoneColorSelector] Updated scheme selector to '${storedScheme}' for ${field}`);
            }

            const zoneCount = Array.isArray(zoneData) ? zoneData.length : 0;
            const schemeColors =
                currentScheme === "custom" || zoneCount === 0
                    ? null
                    : getChartZoneColors(zoneType, zoneCount, currentScheme);
            const activeSchemeColors = schemeColors && schemeColors.length ? schemeColors : null;
            const typedZoneData = /** @type {any[]} */ (zoneData || []);
            const normalizeZoneIndex = (value) => {
                if (!Number.isFinite(value)) {
                    return 0;
                }
                return Math.max(0, Math.floor(value));
            };
            const getDefaultColor = (zoneIndex) => {
                if (!defaultColors.length) {
                    return "#000000";
                }
                const normalizedIndex = normalizeZoneIndex(zoneIndex);
                return (
                    defaultColors[normalizedIndex] || defaultColors[normalizedIndex % defaultColors.length] || "#000000"
                );
            };

            const zoneItems = zoneGrid.children;
            let zoneItemIndex = 0;
            for (const child of zoneItems) {
                const item = /** @type {HTMLElement} */ (child);
                const zoneIndex =
                    ((typedZoneData[zoneItemIndex] && typedZoneData[zoneItemIndex].zone) || zoneItemIndex + 1) - 1;
                const activeZoneIndex = normalizeZoneIndex(zoneIndex);

                let colorToShow;
                if (activeSchemeColors) {
                    colorToShow = activeSchemeColors[activeZoneIndex] || getDefaultColor(activeZoneIndex);
                } else {
                    colorToShow = getChartSpecificZoneColor(field, activeZoneIndex) || getDefaultColor(activeZoneIndex);
                }

                if (!colorToShow) {
                    colorToShow = getDefaultColor(activeZoneIndex);
                }

                const colorInput = /** @type {HTMLInputElement|null} */ (item.querySelector(".zone-color-input"));
                const colorPreview = /** @type {HTMLElement|null} */ (item.querySelector(".zone-color-preview"));
                if (colorInput) {
                    const colorForInput =
                        colorToShow && colorToShow.length === 9 && colorToShow.startsWith("#")
                            ? colorToShow.slice(0, 7)
                            : colorToShow;
                    colorInput.value = colorForInput;
                }
                if (colorPreview) {
                    colorPreview.style.backgroundColor = colorToShow;
                }
                zoneItemIndex++;
            }

            // Debounced visual update
            setTimeout(() => {
                const zoneElems = zoneGrid.querySelectorAll(".zone-color-item");
                for (const item of zoneElems) {
                    const el = /** @type {HTMLElement} */ (item);
                    el.style.transform = "scale(1.02)";
                }

                setTimeout(() => {
                    for (const item of zoneElems) {
                        const el = /** @type {HTMLElement} */ (item);
                        el.style.transform = "scale(1)";
                    }
                }, 100);
            }, 50);
        }

        // Update function for zone editability
        function updateZoneEditability() {
            const isCustom = currentScheme === "custom",
                zoneItems = zoneGrid.querySelectorAll(".zone-color-item");

            for (const item of zoneItems) {
                const el = /** @type {HTMLElement} */ (item),
                    colorPreview = /** @type {HTMLElement|null} */ (el.querySelector(".zone-color-preview"));

                if (isCustom) {
                    // Enable editing
                    el.style.opacity = "1";
                    el.style.cursor = "pointer";
                    if (colorPreview) {
                        colorPreview.style.cursor = "pointer";
                        colorPreview.title = "Click to change color";
                    }
                } else {
                    // Disable editing
                    el.style.opacity = "0.6";
                    el.style.cursor = "not-allowed";
                    if (colorPreview) {
                        colorPreview.style.cursor = "not-allowed";
                        colorPreview.title = "Switch to Custom scheme to edit colors";
                    }
                }
            }
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
            (/** @type {*} */ scheme) => {
                console.log(`[ZoneColorSelector] Scheme selected: ${scheme} for ${field}`);
                currentScheme = scheme;
                updateZoneEditability();
            },
            currentScheme
        );

        header.append(title);
        header.append(schemeSelector);

        // Create zone color items
        const getCurrentScheme = () => currentScheme; // stable reference for callbacks (avoid no-loop-func)
        if (Array.isArray(zoneData)) {
            for (const [index, zone] of zoneData.entries()) {
                const zoneIndex = ((zone && zone.zone) || index + 1) - 1, // Convert to 0-based index
                    zoneItem = createZoneColorItem(field, zone, zoneIndex, getCurrentScheme);
                zoneGrid.append(zoneItem);
            }
        }

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
        const resetButton = createResetButton(field, zoneType, zoneData, () => {
            updateZoneColorDisplay();
        });
        actions.append(resetButton);

        // Assemble selector
        selectorContainer.append(header);
        selectorContainer.append(zoneGrid);
        selectorContainer.append(actions);

        // Sync any existing chart-specific colors to generic zone storage for chart rendering
        const zoneTypeForStorage =
            field.includes("hr_zone") || field.includes("hr_lap_zone") || field === "hr_zone" ? "hr" : "power";

        // Ensure comprehensive color persistence
        ensureZoneColorPersistence(field, zoneTypeForStorage, zoneData.length);

        const zoneArray = Array.isArray(zoneData) ? zoneData : [];
        const defaultPalette = zoneTypeForStorage === "hr" ? DEFAULT_HR_ZONE_COLORS : DEFAULT_POWER_ZONE_COLORS;
        const paletteLength = defaultPalette.length;
        const resolveDefaultColor = (idx) => {
            if (!paletteLength) {
                return "#000000";
            }
            return defaultPalette[idx] || defaultPalette[idx % paletteLength] || "#000000";
        };

        if (zoneArray.length) {
            for (const [index, zone] of zoneArray.entries()) {
                const zoneIndex = ((zone && zone.zone) || index + 1) - 1,
                    chartSpecificColor = getChartSpecificZoneColor(field, zoneIndex),
                    defaultColor = resolveDefaultColor(zoneIndex);

                if (chartSpecificColor !== defaultColor) {
                    saveZoneColor(zoneTypeForStorage, zoneIndex, chartSpecificColor);
                }
            }
        }
        // Store update function for external access
        /** @type {any} */ (selectorContainer)._updateDisplay = updateZoneColorDisplay;

        // Initialize with loaded scheme editability and colors
        setTimeout(() => {
            updateZoneEditability();

            // If a non-custom scheme is loaded, apply its colors if they haven't been customized
            if (currentScheme !== "custom") {
                const hasCustomColors = zoneArray.some((zone, index) => {
                    const zoneIndex = ((zone && zone.zone) || index + 1) - 1,
                        chartSpecificColor = getChartSpecificZoneColor(field, zoneIndex),
                        defaultColor = resolveDefaultColor(zoneIndex);
                    return chartSpecificColor !== defaultColor;
                });

                // If no custom colors are saved, apply the scheme colors
                if (!hasCustomColors) {
                    const schemeColors = getChartZoneColors(zoneType, zoneArray.length, currentScheme);
                    for (const [index, color] of schemeColors.entries()) {
                        saveChartSpecificZoneColor(field, index, color);
                        saveZoneColor(zoneTypeForStorage, index, color);
                    }
                    updateZoneColorDisplay();
                    console.log(
                        `[ZoneColorSelector] Applied ${currentScheme} scheme colors on initialization for ${field}`
                    );
                }
            }
        }, 10);

        // Apply saved zone colors during initialization
        const detectedZoneType = getZoneTypeFromField(field);
        if (detectedZoneType && zoneArray.length) {
            zoneData = applyZoneColors(zoneArray, detectedZoneType);
        }

        if (container instanceof HTMLElement) {
            container.append(selectorContainer);
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
 * Gets the current color scheme for a field
 * @param {string} field - Chart field
 * @returns {string} Current color scheme ("custom", "classic", "vibrant", "monochrome")
 */
export function getCurrentColorScheme(field) {
    return localStorage.getItem(`chartjs_${field}_color_scheme`) || "custom";
}

/**
 * Removes existing inline zone color selectors from a container
 * @param {HTMLElement} container - Container to clean up
 */
export function removeInlineZoneColorSelectors(container) {
    if (!container) {
        return;
    }

    const selectors = container.querySelectorAll(".inline-zone-color-selector");
    for (const selector of selectors) selector.remove();
}

/**
 * Updates all inline zone color selectors in a container
 * @param {HTMLElement} container - Container with selectors
 */
export function updateInlineZoneColorSelectors(container) {
    if (!(container instanceof HTMLElement)) {
        return;
    }
    const selectors = container.querySelectorAll(".inline-zone-color-selector");
    for (const selector of selectors) {
        const anySel = /** @type {any} */ (selector);
        if (anySel && typeof anySel._updateDisplay === "function") {
            anySel._updateDisplay();
        }
    }
}

/**
 * Creates a color scheme selector dropdown
 * @param {string} field - Chart field
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @param {*} defaultColors - Default color array for the zone type
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
    /** @type {Record<string,string>} */
    const schemes = {
        autumn: "Autumn",
        classic: "Classic",
        custom: "Custom",
        cycling: "Cycling (Power)",
        dark: "Dark",
        earth: "Earth",
        fire: "Fire",
        forest: "Forest",
        grayscale: "Grayscale",
        monochrome: "Monochrome",
        neon: "Neon",
        ocean: "Ocean",
        pastel: "Pastel",
        rainbow: "Rainbow",
        runner: "Runner (Power)",
        spring: "Spring",
        sunset: "Sunset",
        vibrant: "Vibrant",
    };

    for (const [value, text] of Object.entries(schemes)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        select.append(option);
    }

    // Set initial scheme value
    select.value = initialScheme && Object.hasOwn(schemes, initialScheme) ? initialScheme : "custom";
    console.log(`[ZoneColorSelector] Set initial scheme to '${select.value}' for ${field}`);
    select.addEventListener("change", (e) => {
        const scheme = /** @type {HTMLSelectElement} */ (e.target).value;
        localStorage.setItem(`chartjs_${field}_color_scheme`, scheme);
        if (onSchemeSelect) {
            onSchemeSelect(scheme);
        }

        if (scheme === "custom") {
            // Restore custom colors from chart-specific storage or fallback
            for (let i = 0; i < zoneCount; i++) {
                let colorToUse = localStorage.getItem(`chartjs_${field}_zone_${i + 1}_color`);
                if (!colorToUse) {
                    // Fallback to generic or default
                    colorToUse =
                        localStorage.getItem(`chartjs_${zoneType}_zone_${i + 1}_color`) ||
                        defaultColors[i] ||
                        defaultColors[i % defaultColors.length];
                }
                // Restore both storages for consistency
                if (colorToUse) {
                    saveChartSpecificZoneColor(field, i, colorToUse);
                    saveZoneColor(zoneType, i, colorToUse);
                }
            }
            showNotification("Switched to custom color scheme", "info");
        } else {
            // Only apply scheme colors for display/chart, do NOT persist as custom
            const schemeColors = getChartZoneColors(zoneType, zoneCount, scheme);
            for (let i = 0; i < zoneCount; i++) {
                // Only update generic zone color for chart rendering
                const c = schemeColors[i] || schemeColors[i % schemeColors.length];
                if (c) {
                    saveZoneColor(zoneType, i, c);
                }
            }
            if (scheme in schemes) {
                showNotification(`Applied ${schemes[scheme] || scheme} color scheme`, "success");
            }
        }
        // Always update UI and chart after scheme change
        if (onSchemeChange) {
            onSchemeChange();
        }
        try {
            globalThis.dispatchEvent(
                new CustomEvent("fieldToggleChanged", {
                    detail: { field, scheme, type: "zone-scheme", value: scheme },
                })
            );

            // Trigger chart re-render through modern state management
            if (chartStateManager) {
                chartStateManager.debouncedRender(`Zone scheme change: ${scheme}`);
            } else if (typeof globalThis.renderChartJS === "function") {
                globalThis.renderChartJS();
            } else {
                globalThis.dispatchEvent(
                    new CustomEvent("ffv:request-render-charts", { detail: { reason: "zone-scheme-change" } })
                );
            }
        } catch (error) {
            console.error("[ZoneColorSelector] Error during scheme change re-render:", error);
        }
    });

    container.append(label);
    container.append(select);
    return container;
}

/**
 * Creates a reset button for resetting all zone colors
 * @param {string} field - Chart field
 * @param {string} zoneType - "hr" or "power"
 * @param {ZoneDataItem[]} zoneData - Zone data array
 * @param {string[]} defaultColors - Default colors array
 * @param {Function} onReset - Callback when reset is clicked
 * @returns {HTMLElement} Reset button element
 */
/**
 * @param {string} field
 * @param {string} zoneType
 * @param {ZoneDataItem[]} zoneData
 * @param {Function} onReset
 */
function createResetButton(field, zoneType, zoneData, onReset) {
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
            globalThis.dispatchEvent(
                new CustomEvent("fieldToggleChanged", {
                    detail: { field, type: "zone-reset", value: "reset" },
                })
            );

            // Trigger chart re-render through modern state management
            if (chartStateManager) {
                chartStateManager.debouncedRender(`Zone colors reset for ${zoneType}`);
            } else if (typeof globalThis.renderChartJS === "function") {
                globalThis.renderChartJS();
            } else {
                globalThis.dispatchEvent(
                    new CustomEvent("ffv:request-render-charts", { detail: { reason: "zone-reset" } })
                );
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
 * Creates a zone color item with preview and picker
 * @param {string} field - Chart field
 * @param {Object} zone - Zone data object
 * @param {number} zoneIndex - 0-based zone index
 * @param {Function} getCurrentScheme - Function that returns current scheme
 * @returns {HTMLElement} Zone color item element
 * Creates a zone color item with preview and picker
 * @param {string} field - Chart field
 * @param {Object} zone - Zone data object
 * @param {number} zoneIndex - 0-based zone index
 * @param {Function} getCurrentScheme - Function that returns current scheme
 * @returns {HTMLElement} Zone color item element
 */
function createZoneColorItem(field, zone, zoneIndex, getCurrentScheme) {
    const currentColor = getChartSpecificZoneColor(field, zoneIndex),
        item = document.createElement("div");
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

    const zoneName = /** @type {any} */ (zone).label || `Zone ${/** @type {any} */ (zone).zone || zoneIndex + 1}`,
        zoneTime = /** @type {any} */ (zone).time ? formatTime(/** @type {any} */ (zone).time, true) : "";

    // Security: do not use innerHTML with zone labels/times (these can be derived from file data).
    // Build DOM nodes and use textContent to prevent injection.
    label.replaceChildren();
    const nameLine = document.createElement("div");
    nameLine.textContent = String(zoneName);
    label.append(nameLine);
    if (zoneTime) {
        const timeLine = document.createElement("div");
        timeLine.textContent = String(zoneTime);
        timeLine.style.fontSize = "10px";
        timeLine.style.color = "var(--color-fg-alt)";
        timeLine.style.marginTop = "2px";
        label.append(timeLine);
    }

    // Color preview
    const colorPreview = document.createElement("div");
    colorPreview.className = "zone-color-preview";
    colorPreview.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 2px solid var(--color-border);
        cursor: pointer;
        transition: var(--transition-smooth);
    `;
    // Avoid embedding color strings into cssText.
    colorPreview.style.backgroundColor = currentColor;

    /**
     * Normalize stored zone colors into a format accepted by <input type="color">.
     * Stored tokens may be #RRGGBBAA for alpha; the input only supports #RRGGBB.
     * @param {string} value
     * @returns {string}
     */
    const toColorInputHex6 = (value) => {
        const v = String(value).trim();
        if (/^#[\da-f]{6}$/iu.test(v)) return v;
        if (/^#[\da-f]{8}$/iu.test(v)) return v.slice(0, 7);
        if (/^#[\da-f]{3}$/iu.test(v)) {
            const r = v[1],
                g = v[2],
                b = v[3];
            return `#${r}${r}${g}${g}${b}${b}`;
        }
        if (/^#[\da-f]{4}$/iu.test(v)) {
            const r = v[1],
                g = v[2],
                b = v[3];
            return `#${r}${r}${g}${g}${b}${b}`;
        }
        return "#000000";
    };

    // Hidden color input
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = toColorInputHex6(currentColor);
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
        const newColor = /** @type {HTMLInputElement} */ (e.target).value;
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
            globalThis.dispatchEvent(
                new CustomEvent("fieldToggleChanged", {
                    detail: { field, type: "zone-color", value: newColor, zoneIndex },
                })
            );

            // Trigger chart re-render through modern state management
            if (chartStateManager) {
                chartStateManager.debouncedRender(`Zone color change: zone ${zoneIndex}`);
            } else if (typeof globalThis.renderChartJS === "function") {
                globalThis.renderChartJS();
            } else {
                globalThis.dispatchEvent(
                    new CustomEvent("ffv:request-render-charts", { detail: { reason: "zone-color" } })
                );
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

    item.append(label);
    item.append(colorPreview);
    item.append(colorInput);

    return item;
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

        if (!zoneCount) {
            return;
        }

        for (let i = 0; i < zoneCount; i++) {
            const chartSpecificColor = getChartSpecificZoneColor(field, i),
                genericColor = localStorage.getItem(`chartjs_${zoneType}_zone_${i + 1}_color`);

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
 * Updates zone color preview in real-time (if chart is visible)
 * @param {string} field - The field name
 * @param {number} zoneIndex - Zone index (0-based)
 * @param {string} newColor - New color value
 */
function updateZoneColorPreview(field, zoneIndex, newColor) {
    try {
        // Find all charts that might be affected by this zone color change
        if (globalThis._chartjsInstances && Array.isArray(globalThis._chartjsInstances)) {
            let chartsUpdated = 0;

            for (const chart of globalThis._chartjsInstances) {
                if (!chart || !chart.data || !chart.data.datasets) {
                    continue;
                }

                // Check if this chart contains zone data that matches our field
                const isHRZoneChart =
                        field.includes("hr_zone") &&
                        chart.data.datasets.some(
                            (/** @type {any} */ dataset) =>
                                dataset.label &&
                                (dataset.label.includes("Heart Rate") ||
                                    dataset.label.includes("HR Zone") ||
                                    dataset.label.toLowerCase().includes("heart"))
                        ),
                    isPowerZoneChart =
                        field.includes("power_zone") &&
                        chart.data.datasets.some(
                            (/** @type {any} */ dataset) =>
                                dataset.label &&
                                (dataset.label.includes("Power") ||
                                    dataset.label.includes("Power Zone") ||
                                    dataset.label.toLowerCase().includes("watt"))
                        );

                if (isHRZoneChart || isPowerZoneChart) {
                    // Update all datasets that might have zone colors
                    for (const dataset of chart.data.datasets) {
                        if (Array.isArray(dataset.backgroundColor) && dataset.backgroundColor[zoneIndex]) {
                            dataset.backgroundColor[zoneIndex] = newColor;
                            chartsUpdated++;
                        }
                    }

                    // Update the chart
                    chart.update("none");
                }
            }

            if (chartsUpdated > 0) {
                console.log(
                    `[ZoneColorSelector] Updated ${chartsUpdated} chart datasets for ${field} zone ${zoneIndex + 1}`
                );
            }
        }
    } catch (error) {
        console.error("[ZoneColorSelector] Error updating zone color preview:", error);
    }
}
