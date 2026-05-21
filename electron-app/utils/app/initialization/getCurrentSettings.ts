/**
 * Chart settings management utility for FitFileViewer.
 *
 * Provides functions for getting, setting, and resetting chart configuration
 * settings. Handles centralized settings persistence and UI synchronization for
 * chart options including toggles, selects, ranges, and color settings.
 */

import { updateAllChartStatusIndicators } from "../../charts/components/chartStatusIndicator.js";
import { chartStateManager } from "../../charts/core/chartStateManager.js";
import {
    getChartRenderContainer,
    getChartSettingsWrapper,
} from "../../charts/dom/chartDomUtils.js";
import { chartOptionsConfig } from "../../charts/plugins/chartOptionsConfig.js";
import {
    isHTMLElement,
    query,
    queryAll,
    setChecked,
    setValue,
} from "../../dom/index.js";
import {
    fieldColors,
    formatChartFields,
} from "../../formatting/display/formatChartFields.js";
import { setState } from "../../state/core/stateManager.js";
import {
    getChartSettings,
    resetChartSettings,
} from "../../state/domain/settingsStateManager.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import {
    parseStoredValue,
    type StoredSettingValue,
} from "./getCurrentSettingsParsing.js";

/**
 * Element that exposes the legacy chart settings reset hook.
 */
export type ResettableElement = HTMLElement & {
    _updateFromReset: () => void;
};

type ChartActionsLike = {
    clearCharts?: () => unknown;
    requestRerender?: (reason: string) => unknown;
};

type ChartRenderManagerLike = {
    debouncedRender: (reason: string) => unknown;
};

type DestroyableChart = {
    destroy: () => unknown;
};

type ChartSettingsGlobal = typeof globalThis & {
    _chartjsInstances?: unknown;
    chartActions?: unknown;
    chartStateManager?: unknown;
    globalData?: null | { recordMesgs?: unknown };
    renderChartJS?: (target?: Element | null) => unknown;
};

/**
 * Chart option configuration. Supported type values include select, toggle,
 * range, and legacy custom controls.
 */
export type ChartOptionConfig = {
    default: unknown;
    id: string;
    label: string;
    max?: number;
    min?: number;
    type: string;
};

/**
 * Map of chart field names to CSS color strings.
 */
export type FieldColorMap = Record<string, string>;

/**
 * Current chart settings keyed by chart option id, with colors grouped
 * separately by field name.
 */
export type ChartSettings = Record<string, unknown> & {
    colors: FieldColorMap;
};

type ThemeConfigLike = {
    colors?: null | Record<string, string | undefined>;
};

/**
 * Type guard for elements that expose a custom _updateFromReset method
 */
function isResettable(el: Element | null | undefined): el is ResettableElement {
    if (!el || !isHTMLElement(el)) {
        return false;
    }

    return (
        typeof (el as Partial<ResettableElement>)._updateFromReset ===
        "function"
    );
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function getChartSettingsGlobal(): ChartSettingsGlobal {
    return globalThis as ChartSettingsGlobal;
}

function isChartActionsLike(value: unknown): value is ChartActionsLike {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate["clearCharts"] === "function" ||
        typeof candidate["requestRerender"] === "function"
    );
}

function isChartRenderManagerLike(
    value: unknown
): value is ChartRenderManagerLike {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate["debouncedRender"] === "function";
}

function isDestroyableChart(value: unknown): value is DestroyableChart {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    return typeof candidate["destroy"] === "function";
}

function isInputElement(value: unknown): value is HTMLInputElement {
    return value instanceof HTMLInputElement;
}

function isSelectElement(value: unknown): value is HTMLSelectElement {
    return value instanceof HTMLSelectElement;
}

function isStoredSettingValue(value: unknown): value is StoredSettingValue {
    return (
        value === null ||
        value === undefined ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    );
}

function getTypedThemeConfig(): ThemeConfigLike {
    const themeConfig = getThemeConfig();
    return typeof themeConfig === "object" && themeConfig !== null
        ? (themeConfig as ThemeConfigLike)
        : {};
}

// Storage/logging prefix
const LOG_PREFIX = "[ChartSettings]";
const resetTimerHandles = new Set<ReturnType<typeof setTimeout>>();

/**
 * Gets current settings from settings state and DOM
 *
 * Retrieves all chart settings from the settings state manager with fallbacks
 * to default values. Handles type conversion and validation for different
 * setting types (select, toggle, range, colors).
 *
 * @returns Current settings object.
 */
export function getCurrentSettings(): ChartSettings {
    try {
        const settings: ChartSettings = { colors: {} },
            themeConfig = getTypedThemeConfig();

        const chartSettings = getChartSettings();

        // Get chart option settings
        for (const opt of chartOptionsConfig || []) {
            const storedValue = chartSettings?.[opt.id];
            settings[opt.id] = parseStoredValue(
                isStoredSettingValue(storedValue) ? storedValue : undefined,
                opt
            );
        }

        // Get color settings
        settings.colors = {};
        const fields = Array.isArray(formatChartFields)
            ? formatChartFields.filter(
                  (field): field is string => typeof field === "string"
              )
            : [];
        const colorDefaults: FieldColorMap = fieldColors;
        const themePrimaryAlpha = themeConfig.colors?.["primaryAlpha"];
        const defaultThemeColor =
            typeof themePrimaryAlpha === "string"
                ? themePrimaryAlpha
                : "#3b82f6";
        for (const field of fields) {
            const stored = chartSettings?.[`color_${field}`];
            settings.colors[field] =
                (typeof stored === "string" && stored) ||
                colorDefaults[field] ||
                defaultThemeColor;
        }

        return settings;
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error getting current settings:`,
            getErrorMessage(error)
        );
        return getDefaultSettings();
    }
}

/**
 * Gets default settings object based on chart configuration
 *
 * Creates a settings object with all default values from the chart options
 * configuration and default field colors.
 *
 * @returns Default settings object.
 */
export function getDefaultSettings(): ChartSettings {
    try {
        const settings: ChartSettings = { colors: {} };

        // Get default values from chart options config
        for (const opt of chartOptionsConfig || []) {
            settings[opt.id] = opt.default;
        }

        // Add default field colors
        settings.colors = { ...fieldColors };

        return settings;
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error getting default settings:`,
            getErrorMessage(error)
        );
        return { colors: {} };
    }
}

/**
 * Re-renders charts after a setting change
 *
 * @param settingName - Name of the setting that changed.
 * @param newValue - New value of the setting.
 */
export function reRenderChartsAfterSettingChange(
    settingName: string,
    newValue: unknown
): void {
    try {
        const chartGlobal = getChartSettingsGlobal();
        // Check if chart data is available
        if (!chartGlobal.globalData || !chartGlobal.globalData.recordMesgs) {
            console.log(
                `${LOG_PREFIX} No chart data available for re-rendering after ${settingName} change`
            );
            return;
        }

        console.log(
            `${LOG_PREFIX} Re-rendering charts after ${settingName} changed to ${newValue}`
        );

        // CRITICAL: Clear cached settings from state management
        // This ensures the chart rendering will read fresh settings from state manager
        if (typeof setState === "function") {
            setState("settings.charts", null, {
                source: "reRenderChartsAfterSettingChange",
            });
            console.log(
                `${LOG_PREFIX} Cleared cached chart settings from state`
            );
        }

        const reason = `Setting change: ${settingName}`;
        // Prefer the shared render pipeline (no destructive teardown on every tweak).
        const managerCandidate = isChartRenderManagerLike(chartStateManager)
            ? chartStateManager
            : chartGlobal.chartStateManager;
        if (isChartRenderManagerLike(managerCandidate)) {
            managerCandidate.debouncedRender(reason);
            console.log(
                `${LOG_PREFIX} Delegated re-render to chartStateManager`
            );
            return;
        }

        const actions = isChartActionsLike(chartGlobal.chartActions)
            ? chartGlobal.chartActions
            : undefined;
        if (typeof actions?.requestRerender === "function") {
            actions.requestRerender(reason);
            console.log(
                `${LOG_PREFIX} Delegated re-render via chartActions.requestRerender`
            );
            return;
        }

        // LAST RESORT fallback (legacy): full teardown/rebuild.
        if (typeof actions?.clearCharts === "function") {
            actions.clearCharts();
        } else if (Array.isArray(chartGlobal._chartjsInstances)) {
            const chartInstances = chartGlobal._chartjsInstances;
            console.log(
                `${LOG_PREFIX} Destroying ${chartInstances.length} existing chart instances`
            );
            for (const [index, chart] of chartInstances.entries()) {
                if (isDestroyableChart(chart)) {
                    try {
                        chart.destroy();
                        console.log(
                            `${LOG_PREFIX} Destroyed chart instance ${index}`
                        );
                    } catch (error) {
                        console.warn(
                            `${LOG_PREFIX} Error destroying chart ${index}:`,
                            error
                        );
                    }
                }
            }
            chartGlobal._chartjsInstances = [];
        }

        const existingCanvases = queryAll(
            'canvas[id^="chart-"], canvas[id^="chartjs-canvas-"]'
        );
        console.log(
            `${LOG_PREFIX} Removing ${existingCanvases.length} existing chart canvases`
        );
        for (const canvas of existingCanvases) {
            if (canvas.parentNode) {
                canvas.remove();
            }
        }

        // Force a complete re-render - try multiple container approaches
        const container = getChartRenderContainer(document);

        console.log(
            `${LOG_PREFIX} Using container: ${container ? container.id : "none found"}`
        );

        // Force re-render through modern state management
        if (typeof chartGlobal.renderChartJS === "function") {
            // Fallback: direct rendering for compatibility if globally exposed
            const target =
                container || getChartRenderContainer(document) || document.body;
            chartGlobal.renderChartJS(target);
        } else {
            // Final fallback: dispatch a render request event handled elsewhere
            console.log(
                `${LOG_PREFIX} Dispatching render request event fallback`
            );
            chartGlobal.dispatchEvent(
                new CustomEvent("ffv:request-render-charts", {
                    detail: { reason: `setting-change:${settingName}` },
                })
            );
        }

        console.log(
            `${LOG_PREFIX} Chart re-render completed for ${settingName} change (fallback path)`
        );
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        console.error(
            `${LOG_PREFIX} Error re-rendering charts after ${settingName} change:`,
            errorMessage
        );
        if (typeof showNotification === "function") {
            showNotification(
                `Failed to update chart setting: ${errorMessage}`,
                "error"
            );
        }
    }
}

/**
 * Resets all chart settings to their default values
 *
 * Clears all chart-related settings from the settings state manager, resets UI
 * controls to default values, and re-renders charts with the default
 * configuration. Shows a success notification when complete.
 *
 * @returns True if reset was successful, false otherwise.
 */
export function resetAllSettings(): boolean {
    try {
        console.log(`${LOG_PREFIX} Resetting all settings to defaults`);
        clearScheduledResetTimers();

        // Clear all stored settings
        clearAllStorageItems(); // Reset UI controls with a small delay to ensure DOM is ready
        scheduleResetTimer(() => {
            const wrapper = getChartSettingsWrapper(document);
            if (wrapper) {
                resetUIControlsToDefaults(wrapper);
            }

            // Second pass for any controls that might not have been found initially
            scheduleResetTimer(() => {
                console.log(
                    `${LOG_PREFIX} Performing second pass UI control updates`
                );
                performDirectControlUpdates();
            }, 100);

            // Update chart status indicators after UI reset
            scheduleResetTimer(() => {
                updateAllChartStatusIndicators();
            }, 150);
        }, 50);

        // Re-render charts with default settings
        reRenderChartsAfterReset();

        // Show success notification
        showNotification("Settings reset to defaults", "success");

        console.log(`${LOG_PREFIX} Settings reset completed successfully`);
        return true;
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error resetting settings:`,
            getErrorMessage(error)
        );
        showNotification("Failed to reset settings", "error");
        return false;
    }
}

/**
 * Clears all chart-related settings entries
 */
function clearAllStorageItems(): void {
    try {
        resetChartSettings({ silent: true });

        console.log(`${LOG_PREFIX} All storage items cleared`);
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error clearing storage items:`,
            getErrorMessage(error)
        );
    }
}

function clearScheduledResetTimers(): void {
    for (const handle of resetTimerHandles) {
        clearTimeout(handle);
    }

    resetTimerHandles.clear();
}

function scheduleResetTimer(callback: () => void, delay: number): void {
    const handle = setTimeout(() => {
        resetTimerHandles.delete(handle);
        callback();
    }, delay);

    resetTimerHandles.add(handle);
}

/**
 * Performs direct control updates by specific selectors as fallback
 */
function performDirectControlUpdates(): void {
    try {
        let updatedCount = 0;

        // Direct updates for known control types
        for (const opt of chartOptionsConfig || []) {
            let updated = false;

            switch (opt.type) {
                case "range": {
                    const slider = query(`#chartjs-${opt.id}-slider`);
                    if (isInputElement(slider) && slider.type === "range") {
                        const defaultValue = opt.default;
                        slider.value = String(defaultValue);

                        // Update value display
                        const valueDisplay =
                            slider.parentElement?.querySelector("span");
                        if (
                            valueDisplay &&
                            valueDisplay.style.position === "absolute"
                        ) {
                            valueDisplay.textContent = String(opt.default);
                        }

                        // Update visual styling
                        const numericDefault = Number(defaultValue);
                        if (Number.isFinite(numericDefault)) {
                            updateRangeSliderStyling(
                                slider,
                                opt,
                                numericDefault
                            );
                        }
                        updated = true;
                    }
                    break;
                }

                case "select": {
                    const select = query(`#chartjs-${opt.id}-dropdown`);
                    if (isSelectElement(select)) {
                        select.value = String(opt.default);
                        updated = true;
                    }
                    break;
                }

                case "toggle": {
                    // Custom toggles are handled by _updateFromReset method
                    const containers = queryAll(".toggle-switch");
                    for (const toggle of containers) {
                        const parent = toggle.parentElement;
                        if (isResettable(parent)) {
                            parent._updateFromReset();
                            updated = true;
                        }
                    }
                    break;
                }
            }

            if (updated) {
                updatedCount++;
                console.log(
                    `${LOG_PREFIX} Direct update: ${opt.id} = ${opt.default}`
                );
            }
        }

        console.log(
            `${LOG_PREFIX} Performed ${updatedCount} direct control updates`
        );
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error in direct control updates:`,
            getErrorMessage(error)
        );
    }
}

/**
 * Re-renders charts after settings reset
 */
function reRenderChartsAfterReset(): void {
    try {
        const chartGlobal = getChartSettingsGlobal();
        // Check if chart data is available
        if (!chartGlobal.globalData || !chartGlobal.globalData.recordMesgs) {
            console.log(
                `${LOG_PREFIX} No chart data available for re-rendering`
            );
            return;
        }

        console.log(`${LOG_PREFIX} Re-rendering charts after settings reset`);

        // CRITICAL: Clear cached settings so chart rendering re-reads fresh defaults from state manager.
        // This mirrors the behavior of reRenderChartsAfterSettingChange.
        if (typeof setState === "function") {
            setState("settings.charts", null, {
                source: "reRenderChartsAfterReset",
            });
        }

        // Get the charts container
        const chartsContainer = getChartRenderContainer(document);

        // Clear existing chart instances
        if (Array.isArray(chartGlobal._chartjsInstances)) {
            for (const chart of chartGlobal._chartjsInstances) {
                if (isDestroyableChart(chart)) {
                    chart.destroy();
                }
            }
            chartGlobal._chartjsInstances = [];
        }

        // Force a complete re-render through modern state management
        if (isChartRenderManagerLike(chartStateManager)) {
            chartStateManager.debouncedRender("Settings reset");
        } else if (typeof chartGlobal.renderChartJS === "function") {
            const target =
                chartsContainer ||
                getChartRenderContainer(document) ||
                document.body;
            chartGlobal.renderChartJS(target);
        } else {
            chartGlobal.dispatchEvent(
                new CustomEvent("ffv:request-render-charts", {
                    detail: { reason: "settings-reset" },
                })
            );
        }
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error re-rendering charts:`,
            getErrorMessage(error)
        );
    }
}

/**
 * Resets all UI controls to default values
 *
 * @param wrapper - Settings wrapper element.
 */
function resetUIControlsToDefaults(wrapper: Element | null): void {
    if (!wrapper) {
        console.warn(`${LOG_PREFIX} Settings wrapper not found`);
        return;
    }

    try {
        console.log(
            `${LOG_PREFIX} Resetting ${chartOptionsConfig.length} chart option controls`
        );

        // Reset all chart option controls to default values
        for (const opt of chartOptionsConfig || []) {
            // Try multiple ways to find the control
            const control =
                query(`#chartjs-${opt.id}`, wrapper) ||
                query(`#chartjs-${opt.id}-dropdown`, wrapper) ||
                query(`#chartjs-${opt.id}-slider`, wrapper) ||
                query(`#chartjs-${opt.id}-container`, wrapper) ||
                query(`[data-option-id="${opt.id}"]`, wrapper);

            if (control) {
                updateUIControl(control, opt, opt.default);
                console.log(
                    `${LOG_PREFIX} Reset control ${opt.id} to default: ${opt.default}`
                );
            } else {
                // Try to find by searching all elements that might contain the option
                const allControls = queryAll(
                    'select, input[type="range"], .toggle-switch',
                    wrapper
                );
                for (const element of allControls) {
                    if (element.id && element.id.includes(opt.id)) {
                        updateUIControl(element, opt, opt.default);
                        console.log(
                            `${LOG_PREFIX} Reset control ${opt.id} via fallback search to: ${opt.default}`
                        );
                    }
                }
            }

            // Handle custom toggle controls with _updateFromReset method
            if (opt.type === "toggle") {
                const toggleContainer =
                    wrapper.querySelector(`#chartjs-${opt.id}`) ||
                    wrapper.querySelector(`[data-option-id="${opt.id}"]`);
                if (isResettable(toggleContainer)) {
                    toggleContainer._updateFromReset();
                } else {
                    // Find toggle container by checking for toggle-switch elements
                    const toggleSwitches =
                        wrapper.querySelectorAll(".toggle-switch");
                    for (const toggleSwitch of toggleSwitches) {
                        const parent = toggleSwitch.parentElement;
                        if (isResettable(parent)) {
                            // Check if this toggle is for our option by looking at surrounding context
                            const settingRow = parent.closest(".setting-row");
                            if (settingRow) {
                                const label =
                                    settingRow.querySelector(".setting-label");
                                // Guard label.textContent which can be null per DOM typings
                                if (
                                    label &&
                                    (label.textContent || "")
                                        .toLowerCase()
                                        .includes(opt.label.toLowerCase())
                                ) {
                                    parent._updateFromReset();
                                    console.log(
                                        `${LOG_PREFIX} Updated toggle ${opt.id} via context matching`
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }

        // Reset all field toggles to visible (default state)
        const fieldToggles = queryAll(
            '.field-toggle input[type="checkbox"]',
            wrapper
        );
        for (const toggle of fieldToggles) {
            setChecked(toggle, true);
        }
        if (fieldToggles.length > 0) {
            console.log(
                `${LOG_PREFIX} Reset ${fieldToggles.length} field toggles to visible`
            );
        }

        // Reset all color pickers to default colors
        const colorPickers = queryAll('input[type="color"]', wrapper);
        const defaultFieldColors: FieldColorMap = fieldColors;
        for (const picker of colorPickers) {
            const fieldName = picker.id
                .replace("field-color-", "")
                .replace("chartjs-", "");
            const defaultColor = defaultFieldColors[fieldName];
            if (defaultColor) {
                setValue(picker, defaultColor);
            }
        }
        if (colorPickers.length > 0) {
            console.log(
                `${LOG_PREFIX} Reset ${colorPickers.length} color pickers to defaults`
            );
        }

        // Find and update any custom controls with _updateFromReset method
        updateCustomControlsFromReset(wrapper);

        // Perform direct control updates as additional fallback
        performDirectControlUpdates();

        console.log(`${LOG_PREFIX} UI controls reset to defaults completed`);
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error resetting UI controls:`,
            getErrorMessage(error)
        );
    }
}

/**
 * Updates custom controls that have _updateFromReset methods
 *
 * @param wrapper - Settings wrapper element.
 */
function updateCustomControlsFromReset(wrapper: Element): void {
    try {
        // Find all elements with _updateFromReset method and call them
        const allElements = queryAll("*", wrapper);
        let updatedCount = 0;

        for (const element of allElements) {
            if (isResettable(element)) {
                element._updateFromReset();
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            console.log(
                `${LOG_PREFIX} Updated ${updatedCount} custom controls from reset`
            );
        }
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error updating custom controls from reset:`,
            getErrorMessage(error)
        );
    }
}

/**
 * Updates range slider visual styling
 *
 * @param control - Range input element.
 * @param option - Chart option configuration.
 * @param value - Current value.
 */
function updateRangeSliderStyling(
    control: Element,
    option: ChartOptionConfig,
    value: number
): void {
    try {
        const themeConfig = getTypedThemeConfig();
        const colors =
            typeof themeConfig.colors === "object" &&
            themeConfig.colors !== null
                ? themeConfig.colors
                : {};
        const accentColor = colors["accent"] || "var(--color-accent, #3b82f6)";
        const borderLight =
            colors["borderLight"] || "var(--color-border, #e5e7eb)";
        const max = typeof option.max === "number" ? option.max : 1;
        const min = typeof option.min === "number" ? option.min : 0;
        const range = max - min;
        const rawPercentage = range === 0 ? 0 : ((value - min) / range) * 100;
        const percentage = Math.max(0, Math.min(100, rawPercentage));

        if (isHTMLElement(control)) {
            control.style.background = `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${percentage}%, ${borderLight} ${percentage}%, ${borderLight} 100%)`;
        }
    } catch (error) {
        console.warn(
            `${LOG_PREFIX} Error updating range slider styling:`,
            getErrorMessage(error)
        );
    }
}

/**
 * Updates UI control to match setting value
 *
 * @param control - DOM control element.
 * @param option - Chart option configuration.
 * @param value - Value to set.
 */
function updateUIControl(
    control: Element,
    option: ChartOptionConfig,
    value: unknown
): void {
    if (!isHTMLElement(control)) {
        return;
    }

    try {
        switch (option.type) {
            case "range": {
                let sliderEl =
                    isInputElement(control) && control.type === "range"
                        ? control
                        : control.querySelector("input[type='range']");
                if (!sliderEl) {
                    sliderEl = query(`#chartjs-${option.id}-slider`);
                }
                if (isInputElement(sliderEl) && sliderEl.type === "range") {
                    sliderEl.value = String(value);

                    const valueDisplay =
                        sliderEl.parentElement?.querySelector("span");
                    if (
                        valueDisplay &&
                        valueDisplay.style.position === "absolute"
                    ) {
                        valueDisplay.textContent = String(value);
                    }

                    // Update range slider visual styling
                    const numericValue = Number(value);
                    if (Number.isFinite(numericValue)) {
                        updateRangeSliderStyling(
                            sliderEl,
                            option,
                            numericValue
                        );
                    }
                    console.log(
                        `${LOG_PREFIX} Updated range ${option.id} to: ${value}`
                    );
                }
                break;
            }

            case "select": {
                let selectEl = isSelectElement(control)
                    ? control
                    : control.querySelector("select");
                if (!selectEl) {
                    const fallbackSelect = query(
                        `#chartjs-${option.id}-dropdown`
                    );
                    selectEl = isSelectElement(fallbackSelect)
                        ? fallbackSelect
                        : null;
                }
                if (isSelectElement(selectEl)) {
                    selectEl.value = String(value);
                    console.log(
                        `${LOG_PREFIX} Updated select ${option.id} to: ${value}`
                    );
                }
                break;
            }

            case "toggle": {
                // Handle both regular checkbox toggles and custom toggle controls
                if (isInputElement(control) && control.type === "checkbox") {
                    control.checked = Boolean(value);
                } else if (isResettable(control)) {
                    // For custom toggle controls, use their update method
                    control._updateFromReset();
                } else {
                    // Try to find the parent container with the update method
                    const parent =
                        control.closest("[data-option-id]") ||
                        control.parentElement;
                    if (isResettable(parent)) {
                        parent._updateFromReset();
                    }
                }
                break;
            }
        }
    } catch (error) {
        console.warn(
            `${LOG_PREFIX} Error updating UI control for`,
            getErrorMessage(error)
        );
    }
}
