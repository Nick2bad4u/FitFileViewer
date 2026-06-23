/**
 * Inline Zone Color Selector Utility Creates an inline color selector that
 * shows all zone colors in a compact format
 */

import { getRegisteredChartInstances } from "../../charts/core/chartInstanceRegistry.js";
import { getRegisteredChartStateManager } from "../../charts/core/chartStateManagerRegistry.js";
// Avoid direct import to prevent circular dependency during SSR; use event-based request
import {
    applyZoneColors,
    clearChartColorScheme,
    DEFAULT_HR_ZONE_COLORS,
    DEFAULT_POWER_ZONE_COLORS,
    getChartColorScheme,
    getChartSpecificZoneColor,
    getChartZoneColors,
    getStoredChartSpecificZoneColor,
    getStoredZoneColor,
    getZoneTypeFromField,
    removeChartSpecificZoneColor,
    removeZoneColor,
    resetChartSpecificZoneColors,
    resetZoneColors,
    saveChartSpecificZoneColor,
    saveZoneColor,
    setChartColorScheme,
} from "../../data/zones/chartZoneColorUtils.js";
import {
    getHeartRateZones,
    getPowerZones,
} from "../../data/zones/zoneDataState.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { showNotification } from "../notifications/showNotification.js";
import {
    getCreateInlineZoneColorSelectorRuntime,
    type CreateInlineZoneColorSelectorRuntime,
} from "./createInlineZoneColorSelectorRuntime.js";

type ZoneType = "hr" | "power";

interface ZoneDataItem {
    readonly color?: string;
    readonly label?: string;
    readonly time?: number;
    readonly value?: number;
    readonly zone?: number;
}

interface ChartDataset {
    backgroundColor?: unknown;
    label?: string;
}

interface ChartLike {
    data?: {
        datasets?: ChartDataset[];
    };
    update?: (mode?: string) => void;
}

type ZoneColorSelectorElement = HTMLElement & {
    _updateDisplay?: () => void;
};

type ZoneSelectorConfig = {
    defaultColors: string[];
    zoneData: ZoneDataItem[];
    zoneType: ZoneType;
};

const zoneColorSelectorTimers = new Set<ReturnType<typeof setTimeout>>();

function dispatchChartRenderRequest(
    reason: string,
    runtime: CreateInlineZoneColorSelectorRuntime = getCreateInlineZoneColorSelectorRuntime()
): void {
    runtime.dispatchEvent(
        runtime.createCustomEvent("ffv:request-render-charts", {
            detail: { reason },
        })
    );
}

function requestDirectChartRender(
    reason: string,
    runtime: CreateInlineZoneColorSelectorRuntime = getCreateInlineZoneColorSelectorRuntime()
): void {
    void import("../../charts/core/renderChartJS.js")
        .then(({ renderChartJS }) => {
            void renderChartJS();
        })
        .catch((error: unknown) => {
            console.warn(
                "[ZoneColorSelector] Direct chart render import failed; dispatching render request event",
                error
            );
            dispatchChartRenderRequest(reason, runtime);
        });
}

function requestManagedChartRerender(
    reason: string,
    fallbackReason: string,
    runtime: CreateInlineZoneColorSelectorRuntime
): void {
    const registeredChartStateManager = getRegisteredChartStateManager();
    if (typeof registeredChartStateManager?.debouncedRender === "function") {
        registeredChartStateManager.debouncedRender(reason);
        return;
    }

    requestDirectChartRender(fallbackReason, runtime);
}

function isChartLike(value: unknown): value is ChartLike {
    const chartData =
        value !== null && typeof value === "object"
            ? (value as { data?: unknown }).data
            : undefined;

    return (
        chartData !== null &&
        typeof chartData === "object" &&
        Array.isArray((chartData as { datasets?: unknown }).datasets)
    );
}

function scheduleZoneColorSelectorTimer(
    callback: () => void,
    delay: number,
    runtime: CreateInlineZoneColorSelectorRuntime = getCreateInlineZoneColorSelectorRuntime()
): void {
    const timeout = runtime.setTimeout(() => {
        zoneColorSelectorTimers.delete(timeout);
        callback();
    }, delay);

    zoneColorSelectorTimers.add(timeout);
}

function normalizeZoneIndex(value: unknown): number {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return 0;
    }
    return Math.max(0, Math.floor(numericValue));
}

function getDefaultZoneColor(
    defaultColors: string[],
    zoneIndex: number
): string {
    if (defaultColors.length === 0) {
        return "#000000";
    }
    const normalizedIndex = normalizeZoneIndex(zoneIndex);
    return (
        defaultColors[normalizedIndex] ||
        defaultColors[normalizedIndex % defaultColors.length] ||
        "#000000"
    );
}

function getDisplayZoneColor(
    activeSchemeColors: null | string[],
    defaultColors: string[],
    field: string,
    activeZoneIndex: number
): string {
    return activeSchemeColors
        ? activeSchemeColors[activeZoneIndex] ||
              getDefaultZoneColor(defaultColors, activeZoneIndex)
        : getChartSpecificZoneColor(field, activeZoneIndex) ||
              getDefaultZoneColor(defaultColors, activeZoneIndex);
}

function getZoneSelectorConfig(field: string): null | ZoneSelectorConfig {
    if (isHeartRateZoneField(field)) {
        return {
            defaultColors: DEFAULT_HR_ZONE_COLORS,
            zoneData: getHeartRateZones(),
            zoneType: "hr",
        };
    }

    if (isPowerZoneField(field)) {
        return {
            defaultColors: DEFAULT_POWER_ZONE_COLORS,
            zoneData: getPowerZones(),
            zoneType: "power",
        };
    }

    return null;
}

function getZoneTypeForField(field: string): ZoneType {
    return isHeartRateZoneField(field) ? "hr" : "power";
}

function isHeartRateZoneField(field: string): boolean {
    return (
        field.includes("hr_zone") ||
        field.includes("hr_lap_zone") ||
        field === "hr_zone"
    );
}

function isPowerZoneField(field: string): boolean {
    return (
        field.includes("power_zone") ||
        field.includes("power_lap_zone") ||
        field === "power_zone"
    );
}

/**
 * Clears all saved zone color data for a specific field
 */
export function clearZoneColorData(field: string, zoneCount: number): void {
    try {
        console.log(
            `[ZoneColorSelector] Clearing all zone color data for ${field}`
        );

        // Clear color scheme preference
        clearChartColorScheme(field);

        // Clear chart-specific colors
        for (let i = 0; i < zoneCount; i += 1) {
            removeChartSpecificZoneColor(field, i);
        }

        // Clear generic zone colors
        const zoneType = getZoneTypeForField(field);
        for (let i = 0; i < zoneCount; i += 1) {
            removeZoneColor(zoneType, i);
        }

        console.log(
            `[ZoneColorSelector] Cleared all zone color data for ${field}`
        );
    } catch (error) {
        console.error(
            "[ZoneColorSelector] Error clearing zone color data:",
            error
        );
    }
}

/**
 * Creates an inline zone color selector
 */
export function createInlineZoneColorSelector(
    field: string,
    container: HTMLElement
): HTMLElement | null {
    try {
        console.log(
            `[ZoneColorSelector] Creating inline selector for field: ${field}`
        );
        const runtime = getCreateInlineZoneColorSelectorRuntime();

        const zoneConfig = getZoneSelectorConfig(field);
        if (!zoneConfig) {
            console.warn(
                `[ZoneColorSelector] Unknown zone field type: ${field}`
            );
            return null;
        }

        const { defaultColors, zoneType } = zoneConfig;
        let zoneData = zoneConfig.zoneData;
        if (zoneType === "power") {
            console.log(
                `[ZoneColorSelector] Creating power zone selector with ${zoneData.length} zones`
            );
        }

        if (zoneData.length === 0) {
            console.warn(
                `[ZoneColorSelector] No zone data available for ${field}`
            );
            return null;
        }

        // Create main container
        const selectorContainer = runtime.createElement("div");
        selectorContainer.className = "inline-zone-color-selector";
        selectorContainer.style.cssText = `
            background: var(--color-glass);
            border: 1px solid var(--color-border);
            border-radius: var(--border-radius);
            padding: 16px;
            margin: 8px 0;
            backdrop-filter: var(--backdrop-blur);
        `; // Header
        const header = runtime.createElement("div");
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--color-border);
        `;

        const title = runtime.createElement("h4");
        title.textContent = `${zoneType.toUpperCase()} Zone Colors`;
        title.style.cssText = `
            margin: 0;
            color: var(--color-fg);
            font-size: 14px;
            font-weight: 600;
        `; // Track current scheme state via settings state manager
        let currentScheme = getChartColorScheme(field);

        console.log(
            `[ZoneColorSelector] Loaded color scheme '${currentScheme}' for ${field}`
        );

        // Zone colors grid (needs to be declared early for function references)
        const zoneGrid = runtime.createElement("div");
        zoneGrid.className = "zone-colors-grid";
        zoneGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 8px;
            margin-bottom: 12px;
        `; // Define update functions early (before they're used in callbacks)
        function updateZoneColorDisplay(): void {
            // Get current color scheme from storage
            const schemeSelector =
                selectorContainer.querySelector<HTMLSelectElement>("select");
            const storedScheme = getChartColorScheme(field);
            if (schemeSelector && schemeSelector.value !== storedScheme) {
                schemeSelector.value = storedScheme;
                currentScheme = storedScheme;
                console.log(
                    `[ZoneColorSelector] Updated scheme selector to '${storedScheme}' for ${field}`
                );
            }

            const zoneCount = Array.isArray(zoneData) ? zoneData.length : 0;
            const schemeColors =
                currentScheme === "custom" || zoneCount === 0
                    ? null
                    : getChartZoneColors(zoneType, zoneCount, currentScheme);
            const activeSchemeColors =
                schemeColors && schemeColors.length > 0 ? schemeColors : null;
            const typedZoneData = zoneData || [];

            const zoneItems = zoneGrid.children;
            let zoneItemIndex = 0;
            for (const child of zoneItems) {
                if (!runtime.isHTMLElement(child)) {
                    continue;
                }
                const item = child;
                const zoneIndex =
                    (typedZoneData[zoneItemIndex]?.zone || zoneItemIndex + 1) -
                    1;
                const activeZoneIndex = normalizeZoneIndex(zoneIndex);

                const colorToShow = getDisplayZoneColor(
                    activeSchemeColors,
                    defaultColors,
                    field,
                    activeZoneIndex
                );

                const colorInput =
                    item.querySelector<HTMLInputElement>(".zone-color-input");
                const colorPreview = item.querySelector<HTMLElement>(
                    ".zone-color-preview"
                );
                if (colorInput) {
                    const colorForInput =
                        colorToShow &&
                        colorToShow.length === 9 &&
                        colorToShow.startsWith("#")
                            ? colorToShow.slice(0, 7)
                            : colorToShow;
                    colorInput.value = colorForInput;
                }
                if (colorPreview) {
                    colorPreview.style.backgroundColor = colorToShow;
                }
                zoneItemIndex += 1;
            }

            // Debounced visual update
            scheduleZoneColorSelectorTimer(
                () => {
                    const zoneElems =
                        zoneGrid.querySelectorAll(".zone-color-item");
                    for (const item of zoneElems) {
                        if (!runtime.isHTMLElement(item)) {
                            continue;
                        }
                        const el = item;
                        el.style.transform = "scale(1.02)";
                    }

                    scheduleZoneColorSelectorTimer(
                        () => {
                            for (const item of zoneElems) {
                                if (!runtime.isHTMLElement(item)) {
                                    continue;
                                }
                                const el = item;
                                el.style.transform = "scale(1)";
                            }
                        },
                        100,
                        runtime
                    );
                },
                50,
                runtime
            );
        }

        // Update function for zone editability
        function updateZoneEditability(): void {
            const isCustom = currentScheme === "custom",
                zoneItems = zoneGrid.querySelectorAll(".zone-color-item");

            for (const item of zoneItems) {
                if (!runtime.isHTMLElement(item)) {
                    continue;
                }
                const el = item,
                    colorPreview = el.querySelector<HTMLElement>(
                        ".zone-color-preview"
                    );

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
                        colorPreview.title =
                            "Switch to Custom scheme to edit colors";
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
                console.log(
                    `[ZoneColorSelector] Scheme change callback triggered for ${field}`
                );
                updateZoneColorDisplay();
                updateZoneEditability();
            },
            (scheme: string) => {
                console.log(
                    `[ZoneColorSelector] Scheme selected: ${scheme} for ${field}`
                );
                currentScheme = scheme;
                updateZoneEditability();
            },
            currentScheme,
            runtime
        );

        header.append(title);
        header.append(schemeSelector);

        // Create zone color items
        const getCurrentScheme = () => currentScheme; // stable reference for callbacks (avoid no-loop-func)
        if (Array.isArray(zoneData)) {
            for (const [index, zone] of zoneData.entries()) {
                const zoneIndex = ((zone && zone.zone) || index + 1) - 1, // Convert to 0-based index
                    zoneItem = createZoneColorItem(
                        field,
                        zone,
                        zoneIndex,
                        getCurrentScheme,
                        runtime
                    );
                zoneGrid.append(zoneItem);
            }
        }

        // Action buttons
        const actions = runtime.createElement("div");
        actions.style.cssText = `
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            padding-top: 8px;
            border-top: 1px solid var(--color-border);
        `;

        // Reset all button
        const resetButton = createResetButton(
            field,
            zoneType,
            zoneData,
            () => {
                updateZoneColorDisplay();
            },
            runtime
        );
        actions.append(resetButton);

        // Assemble selector
        selectorContainer.append(header);
        selectorContainer.append(zoneGrid);
        selectorContainer.append(actions);

        // Sync any existing chart-specific colors to generic zone storage for chart rendering
        const zoneTypeForStorage = getZoneTypeForField(field);

        // Ensure comprehensive color persistence
        ensureZoneColorPersistence(field, zoneTypeForStorage, zoneData.length);

        const zoneArray = Array.isArray(zoneData) ? zoneData : [];
        const defaultPalette =
            zoneTypeForStorage === "hr"
                ? DEFAULT_HR_ZONE_COLORS
                : DEFAULT_POWER_ZONE_COLORS;
        const paletteLength = defaultPalette.length;
        const resolveDefaultColor = (idx: number): string => {
            if (!paletteLength) {
                return "#000000";
            }
            return (
                defaultPalette[idx] ||
                defaultPalette[idx % paletteLength] ||
                "#000000"
            );
        };

        if (zoneArray.length > 0) {
            for (const [index, zone] of zoneArray.entries()) {
                const zoneIndex = ((zone && zone.zone) || index + 1) - 1,
                    chartSpecificColor = getChartSpecificZoneColor(
                        field,
                        zoneIndex
                    ),
                    defaultColor = resolveDefaultColor(zoneIndex);

                if (chartSpecificColor !== defaultColor) {
                    saveZoneColor(
                        zoneTypeForStorage,
                        zoneIndex,
                        chartSpecificColor
                    );
                }
            }
        }
        // Store update function for external access
        (selectorContainer as ZoneColorSelectorElement)._updateDisplay =
            updateZoneColorDisplay;

        // Initialize with loaded scheme editability and colors
        scheduleZoneColorSelectorTimer(
            () => {
                updateZoneEditability();

                // If a non-custom scheme is loaded, apply its colors if they haven't been customized
                if (currentScheme !== "custom") {
                    const hasCustomColors = zoneArray.some((zone, index) => {
                        const zoneIndex =
                                ((zone && zone.zone) || index + 1) - 1,
                            chartSpecificColor = getChartSpecificZoneColor(
                                field,
                                zoneIndex
                            ),
                            defaultColor = resolveDefaultColor(zoneIndex);
                        return chartSpecificColor !== defaultColor;
                    });

                    // If no custom colors are saved, apply the scheme colors
                    if (!hasCustomColors) {
                        const schemeColors = getChartZoneColors(
                            zoneType,
                            zoneArray.length,
                            currentScheme
                        );
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
            },
            10,
            runtime
        );

        // Apply saved zone colors during initialization
        const detectedZoneType = getZoneTypeFromField(field);
        if (detectedZoneType && zoneArray.length > 0) {
            zoneData = applyZoneColors(zoneArray, detectedZoneType);
        }

        if (runtime.isHTMLElement(container)) {
            container.append(selectorContainer);
        }

        console.log(
            `[ZoneColorSelector] Inline selector created for ${zoneType} zones`
        );
        return selectorContainer;
    } catch (error) {
        console.error(
            "[ZoneColorSelector] Error creating inline selector:",
            error
        );
        void showNotification("Failed to create zone color selector", "error");
        return null;
    }
}

/**
 * Gets the current color scheme for a field
 */
export function getCurrentColorScheme(field: string): string {
    return getChartColorScheme(field);
}

/**
 * Removes existing inline zone color selectors from a container
 */
export function removeInlineZoneColorSelectors(container: HTMLElement): void {
    if (!container) {
        return;
    }

    const selectors = container.querySelectorAll(".inline-zone-color-selector");
    for (const selector of selectors) selector.remove();
}

/**
 * Updates all inline zone color selectors in a container
 */
export function updateInlineZoneColorSelectors(container: HTMLElement): void {
    const runtime = getCreateInlineZoneColorSelectorRuntime();
    if (!runtime.isHTMLElement(container)) {
        return;
    }
    const selectors = container.querySelectorAll(".inline-zone-color-selector");
    for (const selector of selectors) {
        const zoneSelector = selector as ZoneColorSelectorElement;
        if (typeof zoneSelector._updateDisplay === "function") {
            zoneSelector._updateDisplay();
        }
    }
}

/**
 * Creates a color scheme selector dropdown
 */
function createColorSchemeSelector(
    field: string,
    zoneType: ZoneType,
    zoneCount: number,
    defaultColors: string[],
    onSchemeChange: () => void,
    onSchemeSelect: (scheme: string) => void,
    initialScheme = "custom",
    runtime: CreateInlineZoneColorSelectorRuntime = getCreateInlineZoneColorSelectorRuntime()
): HTMLElement {
    const container = runtime.createElement("div");
    container.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const label = runtime.createElement("label");
    label.textContent = "Scheme:";
    label.style.cssText = `
        font-size: 12px;
        color: var(--color-fg-alt);
        font-weight: 500;
    `;

    const select = runtime.createElement("select");
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
    const schemes: Record<string, string> = {
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
        const option = runtime.createElement("option");
        option.value = value;
        option.textContent = text;
        select.append(option);
    }

    // Set initial scheme value
    select.value =
        initialScheme && Object.hasOwn(schemes, initialScheme)
            ? initialScheme
            : "custom";
    console.log(
        `[ZoneColorSelector] Set initial scheme to '${select.value}' for ${field}`
    );
    const schemeListenerController = runtime.createAbortController();
    select.addEventListener(
        "change",
        (e) => {
            if (!runtime.isHTMLSelectElement(e.target)) {
                return;
            }
            const scheme = e.target.value;
            setChartColorScheme(field, scheme);
            if (onSchemeSelect) {
                onSchemeSelect(scheme);
            }

            if (scheme === "custom") {
                // Restore custom colors from chart-specific storage or fallback
                for (let i = 0; i < zoneCount; i += 1) {
                    const colorToUse =
                        getStoredChartSpecificZoneColor(field, i) ||
                        getStoredZoneColor(zoneType, i) ||
                        defaultColors[i] ||
                        defaultColors[i % defaultColors.length];
                    // Restore both storages for consistency
                    if (colorToUse) {
                        saveChartSpecificZoneColor(field, i, colorToUse);
                        saveZoneColor(zoneType, i, colorToUse);
                    }
                }
                void showNotification(
                    "Switched to custom color scheme",
                    "info"
                );
            } else {
                // Only apply scheme colors for display/chart, do NOT persist as custom
                const schemeColors = getChartZoneColors(
                    zoneType,
                    zoneCount,
                    scheme
                );
                for (let i = 0; i < zoneCount; i += 1) {
                    // Only update generic zone color for chart rendering
                    const c =
                        schemeColors[i] ||
                        schemeColors[i % schemeColors.length];
                    if (c) {
                        saveZoneColor(zoneType, i, c);
                    }
                }
                if (scheme in schemes) {
                    void showNotification(
                        `Applied ${schemes[scheme] || scheme} color scheme`,
                        "success"
                    );
                }
            }
            // Always update UI and chart after scheme change
            if (onSchemeChange) {
                onSchemeChange();
            }
            try {
                runtime.dispatchEvent(
                    runtime.createCustomEvent("fieldToggleChanged", {
                        detail: {
                            field,
                            scheme,
                            type: "zone-scheme",
                            value: scheme,
                        },
                    })
                );

                requestManagedChartRerender(
                    `Zone scheme change: ${scheme}`,
                    "zone-scheme-change",
                    runtime
                );
            } catch (error) {
                console.error(
                    "[ZoneColorSelector] Error during scheme change re-render:",
                    error
                );
            }
        },
        { signal: schemeListenerController.signal }
    );

    container.append(label);
    container.append(select);
    return container;
}

/**
 * Creates a reset button for resetting all zone colors
 */
/**/
function createResetButton(
    field: string,
    zoneType: ZoneType,
    zoneData: ZoneDataItem[],
    onReset: () => void,
    runtime: CreateInlineZoneColorSelectorRuntime = getCreateInlineZoneColorSelectorRuntime()
): HTMLElement {
    const button = runtime.createElement("button");
    button.type = "button";
    button.textContent = "↻ Reset";
    button.setAttribute("aria-label", "Reset all zone colors to defaults");
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
    const buttonListenerController = runtime.createAbortController();
    button.addEventListener(
        "click",
        () => {
            // Reset chart-specific colors
            resetChartSpecificZoneColors(field, zoneData.length);

            // Also reset generic zone colors for chart rendering
            resetZoneColors(zoneType, zoneData.length);

            onReset();
            void showNotification(
                `${zoneType.toUpperCase()} zone colors reset to defaults`,
                "success"
            );

            // Update all inline zone color selector UIs to reflect the scheme change to custom
            const body = runtime.getBody();
            if (body) {
                updateInlineZoneColorSelectors(body);
            }

            // Use the exact same mechanism as metrics color changes
            try {
                console.log(
                    `[ZoneColorSelector] Triggering chart re-render for reset (same mechanism as metrics)`
                );

                // Dispatch custom event for field toggle change (same as metrics)
                runtime.dispatchEvent(
                    runtime.createCustomEvent("fieldToggleChanged", {
                        detail: { field, type: "zone-reset", value: "reset" },
                    })
                );

                requestManagedChartRerender(
                    `Zone colors reset for ${zoneType}`,
                    "zone-reset",
                    runtime
                );

                console.log(
                    `[ZoneColorSelector] Chart re-render triggered for ${field} reset using unified mechanism`
                );
            } catch (error) {
                console.error(
                    "[ZoneColorSelector] Error during reset re-render:",
                    error
                );
            }
        },
        { signal: buttonListenerController.signal }
    );

    button.addEventListener(
        "mouseenter",
        () => {
            button.style.background = "var(--color-btn-hover)";
            button.style.transform = "translateY(-1px)";
            button.style.boxShadow = "var(--color-box-shadow-light)";
        },
        { signal: buttonListenerController.signal }
    );

    button.addEventListener(
        "mouseleave",
        () => {
            button.style.background = "var(--color-btn-bg)";
            button.style.transform = "translateY(0)";
            button.style.boxShadow = "none";
        },
        { signal: buttonListenerController.signal }
    );

    return button;
}

/**
 * Creates a zone color item with preview and picker
 */
function createZoneColorItem(
    field: string,
    zone: ZoneDataItem,
    zoneIndex: number,
    getCurrentScheme: () => string,
    runtime: CreateInlineZoneColorSelectorRuntime = getCreateInlineZoneColorSelectorRuntime()
): HTMLElement {
    const currentColor = getChartSpecificZoneColor(field, zoneIndex),
        item = runtime.createElement("div");
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
    const label = runtime.createElement("div");
    label.className = "zone-label";
    label.style.cssText = `
        flex: 1;
        font-size: 12px;
        color: var(--color-fg);
        font-weight: 500;
    `;

    const zoneName = zone.label || `Zone ${zone.zone || zoneIndex + 1}`,
        zoneTime = zone.time ? formatTime(zone.time, true) : "";

    // Security: do not use innerHTML with zone labels/times (these can be derived from file data).
    // Build DOM nodes and use textContent to prevent injection.
    label.replaceChildren();
    const nameLine = runtime.createElement("div");
    nameLine.textContent = String(zoneName);
    label.append(nameLine);
    if (zoneTime) {
        const timeLine = runtime.createElement("div");
        timeLine.textContent = String(zoneTime);
        timeLine.style.fontSize = "10px";
        timeLine.style.color = "var(--color-fg-alt)";
        timeLine.style.marginTop = "2px";
        label.append(timeLine);
    }

    // Color preview
    const colorPreview = runtime.createElement("div");
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
     * Normalize stored zone colors into a format accepted by <input
     * type="color">. Stored tokens may be #RRGGBBAA for alpha; the input only
     * supports #RRGGBB.
     */
    const toColorInputHex6 = (value: string): string => {
        const v = String(value).trim();
        if (/^#[\da-f]{6}$/iu.test(v)) return v;
        if (/^#[\da-f]{8}$/iu.test(v)) return v.slice(0, 7);
        if (/^#[\da-f]{3}$/iu.test(v)) {
            const r = v.charAt(1),
                g = v.charAt(2),
                b = v.charAt(3);
            return `#${r}${r}${g}${g}${b}${b}`;
        }
        if (/^#[\da-f]{4}$/iu.test(v)) {
            const r = v.charAt(1),
                g = v.charAt(2),
                b = v.charAt(3);
            return `#${r}${r}${g}${g}${b}${b}`;
        }
        return "#000000";
    };

    // Hidden color input
    const colorInput = runtime.createElement("input");
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

    const itemListenerController = runtime.createAbortController();

    // Color change handler
    colorInput.addEventListener(
        "change",
        (e) => {
            if (!runtime.isHTMLInputElement(e.target)) {
                return;
            }
            const newColor = e.target.value;
            console.log(
                `[ZoneColorSelector] Color changed for ${field} zone ${zoneIndex + 1}: ${newColor}`
            );

            colorPreview.style.backgroundColor = newColor;

            // Set color scheme to custom when manually changing a zone color
            setChartColorScheme(field, "custom");

            // Save color to both chart-specific and generic zone storage
            // Chart-specific storage (for the inline selector consistency)
            saveChartSpecificZoneColor(field, zoneIndex, newColor);

            // Generic zone storage (for chart rendering functions to read)
            const zoneType = getZoneTypeForField(field);
            saveZoneColor(zoneType, zoneIndex, newColor);

            updateZoneColorPreview(field, zoneIndex, newColor);

            // Update all inline zone color selector UIs to reflect the scheme change to custom
            const body = runtime.getBody();
            if (body) {
                updateInlineZoneColorSelectors(body);
            }

            // Use the exact same mechanism as metrics color changes
            try {
                console.log(
                    `[ZoneColorSelector] Triggering chart re-render (same mechanism as metrics)`
                );

                // Dispatch custom event for field toggle change (same as metrics)
                runtime.dispatchEvent(
                    runtime.createCustomEvent("fieldToggleChanged", {
                        detail: {
                            field,
                            type: "zone-color",
                            value: newColor,
                            zoneIndex,
                        },
                    })
                );

                requestManagedChartRerender(
                    `Zone color change: zone ${zoneIndex}`,
                    "zone-color",
                    runtime
                );
            } catch (error) {
                console.error(
                    "[ZoneColorSelector] Error triggering chart re-render:",
                    error
                );
            }
        },
        { signal: itemListenerController.signal }
    );

    // Click preview to open color picker (only if custom scheme)
    colorPreview.addEventListener(
        "click",
        () => {
            if (getCurrentScheme() === "custom") {
                colorInput.click();
            }
        },
        { signal: itemListenerController.signal }
    );

    // Hover effects
    item.addEventListener(
        "mouseenter",
        () => {
            item.style.background = "var(--color-accent-hover)";
            colorPreview.style.transform = "scale(1.1)";
            colorPreview.style.boxShadow = "var(--color-box-shadow-light)";
        },
        { signal: itemListenerController.signal }
    );

    item.addEventListener(
        "mouseleave",
        () => {
            item.style.background = "var(--color-bg-alt)";
            colorPreview.style.transform = "scale(1)";
            colorPreview.style.boxShadow = "none";
        },
        { signal: itemListenerController.signal }
    );

    item.append(label);
    item.append(colorPreview);
    item.append(colorInput);

    return item;
}

/**
 * Ensures zone colors are properly persisted through settings state manager
 */
function ensureZoneColorPersistence(
    field: string,
    zoneType: ZoneType,
    zoneCount: number
): void {
    try {
        console.log(
            `[ZoneColorSelector] Ensuring color persistence for ${field}`
        );

        if (!zoneCount) {
            return;
        }

        for (let i = 0; i < zoneCount; i += 1) {
            const chartSpecificColor = getChartSpecificZoneColor(field, i),
                genericColor = getStoredZoneColor(zoneType, i);

            // Sync colors between chart-specific and generic storage
            if (chartSpecificColor && !genericColor) {
                saveZoneColor(zoneType, i, chartSpecificColor);
                console.log(
                    `[ZoneColorSelector] Synced chart-specific color to generic storage for zone ${i + 1}`
                );
            } else if (genericColor && chartSpecificColor !== genericColor) {
                // If generic color exists but chart-specific is different, use the more recent one
                // In this case, we'll prefer chart-specific as it's more targeted
                saveZoneColor(zoneType, i, chartSpecificColor);
                console.log(
                    `[ZoneColorSelector] Updated generic storage with chart-specific color for zone ${i + 1}`
                );
            }
        }
    } catch (error) {
        console.warn(
            "[ZoneColorSelector] Error ensuring color persistence:",
            error
        );
    }
}

function chartMatchesZoneField(
    field: string,
    datasets: ChartDataset[]
): boolean {
    const isHRZoneChart =
            field.includes("hr_zone") &&
            datasets.some(
                (dataset) =>
                    dataset.label &&
                    (dataset.label.includes("Heart Rate") ||
                        dataset.label.includes("HR Zone") ||
                        dataset.label.toLowerCase().includes("heart"))
            ),
        isPowerZoneChart =
            field.includes("power_zone") &&
            datasets.some(
                (dataset) =>
                    dataset.label &&
                    (dataset.label.includes("Power") ||
                        dataset.label.includes("Power Zone") ||
                        dataset.label.toLowerCase().includes("watt"))
            );

    return isHRZoneChart || isPowerZoneChart;
}

function updateChartZoneDatasetColors(
    chart: ChartLike,
    field: string,
    zoneIndex: number,
    newColor: string
): number {
    const datasets = chart.data?.datasets;
    if (!datasets || !chartMatchesZoneField(field, datasets)) {
        return 0;
    }

    let updatedCount = 0;
    for (const dataset of datasets) {
        if (
            Array.isArray(dataset.backgroundColor) &&
            dataset.backgroundColor[zoneIndex]
        ) {
            dataset.backgroundColor[zoneIndex] = newColor;
            updatedCount += 1;
        }
    }

    chart.update?.("none");
    return updatedCount;
}

/**
 * Updates zone color preview in real-time (if chart is visible)
 */
function updateZoneColorPreview(
    field: string,
    zoneIndex: number,
    newColor: string
): void {
    try {
        // Find all charts that might be affected by this zone color change
        const charts = getRegisteredChartInstances().filter(isChartLike);
        if (charts.length > 0) {
            let chartsUpdated = 0;

            for (const chart of charts) {
                chartsUpdated += updateChartZoneDatasetColors(
                    chart,
                    field,
                    zoneIndex,
                    newColor
                );
            }

            if (chartsUpdated > 0) {
                console.log(
                    `[ZoneColorSelector] Updated ${chartsUpdated} chart datasets for ${field} zone ${zoneIndex + 1}`
                );
            }
        }
    } catch (error) {
        console.error(
            "[ZoneColorSelector] Error updating zone color preview:",
            error
        );
    }
}
