/**
 * Chart settings management utility for FitFileViewer.
 *
 * Provides functions for getting, setting, and resetting chart configuration
 * settings. Handles centralized settings persistence and UI synchronization for
 * chart options including toggles, selects, ranges, and color settings.
 */

import { updateAllChartStatusIndicators } from "../../charts/components/chartStatusIndicator.js";
import { getChartSettingsWrapper } from "../../charts/dom/chartDomUtils.js";
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
import {
    getChartSettings,
    resetChartSettings,
} from "../../state/domain/settingsStateManager.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import {
    reRenderChartsAfterReset,
    reRenderChartsAfterSettingChange as renderChartsAfterSettingChange,
} from "./chartSettingsRender.js";
import {
    parseStoredValue,
    type StoredSettingValue,
} from "./getCurrentSettingsParsing.js";
import {
    getGetCurrentSettingsRuntime,
    type GetCurrentSettingsRuntime,
    type GetCurrentSettingsTimer,
} from "./getCurrentSettingsRuntime.js";

/**
 * Element that exposes the legacy chart settings reset hook.
 */
export type ResettableElement = HTMLElement & {
    _updateFromReset: () => void;
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
        "_updateFromReset" in el && typeof el._updateFromReset === "function"
    );
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function formatLogValue(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }

    if (
        typeof value === "boolean" ||
        typeof value === "bigint" ||
        typeof value === "number"
    ) {
        return String(value);
    }

    if (value === null) {
        return "null";
    }

    if (value === undefined) {
        return "undefined";
    }

    if (value instanceof Error) {
        return value.message;
    }

    return "[object]";
}

function isInputElement(value: unknown): value is HTMLInputElement {
    return currentSettingsRuntime().isHTMLInputElement(value);
}

function isSelectElement(value: unknown): value is HTMLSelectElement {
    return currentSettingsRuntime().isHTMLSelectElement(value);
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

function currentSettingsRuntime(): GetCurrentSettingsRuntime {
    return getGetCurrentSettingsRuntime();
}

const resetTimerHandles = new Set<GetCurrentSettingsTimer>();

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
    renderChartsAfterSettingChange(settingName, newValue);
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
            const wrapper = getChartSettingsWrapper(
                currentSettingsRuntime().documentRef
            );
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
        void showNotification("Settings reset to defaults", "success");

        console.log(`${LOG_PREFIX} Settings reset completed successfully`);
        return true;
    } catch (error) {
        console.error(
            `${LOG_PREFIX} Error resetting settings:`,
            getErrorMessage(error)
        );
        void showNotification("Failed to reset settings", "error");
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
        currentSettingsRuntime().clearTimeout(handle);
    }

    resetTimerHandles.clear();
}

function scheduleResetTimer(callback: () => void, delay: number): void {
    const handle = currentSettingsRuntime().setTimeout(() => {
        resetTimerHandles.delete(handle);
        callback();
    }, delay);

    resetTimerHandles.add(handle);
}

function updateRangeControlToDefault(option: ChartOptionConfig): boolean {
    const slider = query(`#chartjs-${option.id}-slider`);
    if (!isInputElement(slider) || slider.type !== "range") {
        return false;
    }

    const defaultValue = option.default;
    slider.value = String(defaultValue);

    const valueDisplay = slider.parentElement?.querySelector("span");
    if (valueDisplay && valueDisplay.style.position === "absolute") {
        valueDisplay.textContent = String(defaultValue);
    }

    const numericDefault = Number(defaultValue);
    if (Number.isFinite(numericDefault)) {
        updateRangeSliderStyling(slider, option, numericDefault);
    }

    return true;
}

function updateSelectControlToDefault(option: ChartOptionConfig): boolean {
    const select = query(`#chartjs-${option.id}-dropdown`);
    if (!isSelectElement(select)) {
        return false;
    }

    select.value = String(option.default);
    return true;
}

function updateToggleControlsToDefault(): boolean {
    let updated = false;
    const containers = queryAll(".toggle-switch");
    for (const toggle of containers) {
        const parent = toggle.parentElement;
        if (isResettable(parent)) {
            parent._updateFromReset();
            updated = true;
        }
    }

    return updated;
}

function updateDirectControlToDefault(option: ChartOptionConfig): boolean {
    switch (option.type) {
        case "range": {
            return updateRangeControlToDefault(option);
        }

        case "select": {
            return updateSelectControlToDefault(option);
        }

        case "toggle": {
            return updateToggleControlsToDefault();
        }

        default: {
            return false;
        }
    }
}

/**
 * Performs direct control updates by specific selectors as fallback
 */
function performDirectControlUpdates(): void {
    try {
        let updatedCount = 0;

        // Direct updates for known control types
        for (const opt of chartOptionsConfig || []) {
            const updated = updateDirectControlToDefault(opt);
            if (updated) {
                updatedCount += 1;
                console.log(
                    `${LOG_PREFIX} Direct update: ${opt.id} = ${formatLogValue(opt.default)}`
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

function findControlForOption(
    wrapper: Element,
    option: ChartOptionConfig
): Element | null {
    return (
        query(`#chartjs-${option.id}`, wrapper) ||
        query(`#chartjs-${option.id}-dropdown`, wrapper) ||
        query(`#chartjs-${option.id}-slider`, wrapper) ||
        query(`#chartjs-${option.id}-container`, wrapper) ||
        query(`[data-option-id="${option.id}"]`, wrapper)
    );
}

function resetFallbackControlsForOption(
    wrapper: Element,
    option: ChartOptionConfig
): void {
    const allControls = queryAll(
        'select, input[type="range"], .toggle-switch',
        wrapper
    );
    for (const element of allControls) {
        if (!element.id || !element.id.includes(option.id)) {
            continue;
        }

        updateUIControl(element, option, option.default);
        console.log(
            `${LOG_PREFIX} Reset control ${option.id} via fallback search to: ${formatLogValue(option.default)}`
        );
    }
}

function resetPrimaryControlForOption(
    wrapper: Element,
    option: ChartOptionConfig
): void {
    const control = findControlForOption(wrapper, option);
    if (!control) {
        resetFallbackControlsForOption(wrapper, option);
        return;
    }

    updateUIControl(control, option, option.default);
    console.log(
        `${LOG_PREFIX} Reset control ${option.id} to default: ${formatLogValue(option.default)}`
    );
}

function updateToggleFromSettingRow(
    parent: ResettableElement,
    option: ChartOptionConfig
): boolean {
    const settingRow = parent.closest(".setting-row");
    const label = settingRow?.querySelector(".setting-label");
    const labelText = label?.textContent?.toLowerCase() ?? "";
    if (!labelText.includes(option.label.toLowerCase())) {
        return false;
    }

    parent._updateFromReset();
    console.log(
        `${LOG_PREFIX} Updated toggle ${option.id} via context matching`
    );
    return true;
}

function resetToggleControlForOption(
    wrapper: Element,
    option: ChartOptionConfig
): void {
    const toggleContainer =
        wrapper.querySelector(`#chartjs-${option.id}`) ||
        wrapper.querySelector(`[data-option-id="${option.id}"]`);
    if (isResettable(toggleContainer)) {
        toggleContainer._updateFromReset();
        return;
    }

    const toggleSwitches = wrapper.querySelectorAll(".toggle-switch");
    for (const toggleSwitch of toggleSwitches) {
        const parent = toggleSwitch.parentElement;
        if (isResettable(parent)) {
            updateToggleFromSettingRow(parent, option);
        }
    }
}

function resetChartOptionControl(
    wrapper: Element,
    option: ChartOptionConfig
): void {
    resetPrimaryControlForOption(wrapper, option);

    if (option.type === "toggle") {
        resetToggleControlForOption(wrapper, option);
    }
}

function resetFieldToggles(wrapper: Element): void {
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
}

function resetColorPickers(wrapper: Element): void {
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
            resetChartOptionControl(wrapper, opt);
        }

        resetFieldToggles(wrapper);
        resetColorPickers(wrapper);

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
                updatedCount += 1;
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

function findRangeInput(
    control: HTMLElement,
    option: ChartOptionConfig
): HTMLInputElement | null {
    if (isInputElement(control) && control.type === "range") {
        return control;
    }

    const nestedInput = control.querySelector("input[type='range']");
    if (isInputElement(nestedInput) && nestedInput.type === "range") {
        return nestedInput;
    }

    const fallbackInput = query(`#chartjs-${option.id}-slider`);
    return isInputElement(fallbackInput) && fallbackInput.type === "range"
        ? fallbackInput
        : null;
}

function updateRangeUIControl(
    control: HTMLElement,
    option: ChartOptionConfig,
    value: unknown
): void {
    const sliderEl = findRangeInput(control, option);
    if (!sliderEl) {
        return;
    }

    sliderEl.value = String(value);

    const valueDisplay = sliderEl.parentElement?.querySelector("span");
    if (valueDisplay && valueDisplay.style.position === "absolute") {
        valueDisplay.textContent = String(value);
    }

    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
        updateRangeSliderStyling(sliderEl, option, numericValue);
    }
    console.log(
        `${LOG_PREFIX} Updated range ${option.id} to: ${formatLogValue(value)}`
    );
}

function findSelectInput(
    control: HTMLElement,
    option: ChartOptionConfig
): HTMLSelectElement | null {
    if (isSelectElement(control)) {
        return control;
    }

    const nestedSelect = control.querySelector("select");
    if (isSelectElement(nestedSelect)) {
        return nestedSelect;
    }

    const fallbackSelect = query(`#chartjs-${option.id}-dropdown`);
    return isSelectElement(fallbackSelect) ? fallbackSelect : null;
}

function updateSelectUIControl(
    control: HTMLElement,
    option: ChartOptionConfig,
    value: unknown
): void {
    const selectEl = findSelectInput(control, option);
    if (!selectEl) {
        return;
    }

    selectEl.value = String(value);
    console.log(
        `${LOG_PREFIX} Updated select ${option.id} to: ${formatLogValue(value)}`
    );
}

function updateToggleUIControl(control: HTMLElement, value: unknown): void {
    if (isInputElement(control) && control.type === "checkbox") {
        control.checked = Boolean(value);
        return;
    }

    if (isResettable(control)) {
        control._updateFromReset();
        return;
    }

    const parent = control.closest("[data-option-id]") || control.parentElement;
    if (isResettable(parent)) {
        parent._updateFromReset();
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
                updateRangeUIControl(control, option, value);
                break;
            }

            case "select": {
                updateSelectUIControl(control, option, value);
                break;
            }

            case "toggle": {
                updateToggleUIControl(control, value);
                break;
            }

            default: {
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
