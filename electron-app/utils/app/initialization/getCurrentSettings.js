/**
 * @fileoverview Chart settings management utility for FitFileViewer
 *
 * Provides functions for getting, setting, and resetting chart configuration
 * settings. Handles localStorage persistence and UI synchronization for
 * chart options including toggles, selects, ranges, and color settings.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

import { updateAllChartStatusIndicators } from "../../charts/components/chartStatusIndicator.js";
import { chartStateManager } from "../../charts/core/chartStateManager.js";
import { chartOptionsConfig } from "../../charts/plugins/chartOptionsConfig.js";
import { isHTMLElement, query, queryAll, setChecked, setValue } from "../../dom/index.js";
import { fieldColors, formatChartFields } from "../../formatting/display/formatChartFields.js";
import { setState } from "../../state/core/stateManager.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

/**
 * @typedef {HTMLElement & { _updateFromReset?: Function }} ResettableElement
 */
/**
 * Type guard for elements that expose a custom _updateFromReset method
 * @param {Element|null} el
 * @returns {el is ResettableElement}
 */
function isResettable(el) {
    // @ts-ignore augment runtime check
    return Boolean(el && isHTMLElement(el) && typeof el._updateFromReset === "function");
}

// Storage key prefixes
const LOG_PREFIX = "[ChartSettings]",
    MAX_ZONE_COUNT = 5,
    STORAGE_PREFIXES = {
        CHART_OPTION: "chartjs_",
        FIELD_COLOR: "chartjs_color_",
        FIELD_VISIBILITY: "chartjs_field_",
        HR_ZONE_COLOR: "chartjs_hr_zone_",
        POWER_ZONE_COLOR: "chartjs_power_zone_",
    },
    UNIT_TYPES = ["timeUnits", "distanceUnits", "temperatureUnits"],
    // Special field types for zone charts
    ZONE_CHART_FIELDS = [
        "gps_track",
        "speed_vs_distance",
        "power_vs_hr",
        "altitude_profile",
        "hr_zone_doughnut",
        "power_zone_doughnut",
        "hr_lap_zone_stacked",
        "hr_lap_zone_individual",
        "power_lap_zone_stacked",
        "power_lap_zone_individual",
    ];

/**
 * @typedef {Object} ChartOptionConfig
 * @property {string} id
 * @property {string} label
 * @property {string} type - select|toggle|range|other
 * @property {*} default
 * @property {number} [min]
 * @property {number} [max]
 */

/**
 * @typedef {Object.<string, string>} FieldColorMap
 */

/**
 * @typedef {Object} ChartSettings
 * @property {FieldColorMap} colors
 * @property {Object.<string, any>} [extra]
 */

/**
 * Gets current settings from localStorage and DOM
 *
 * Retrieves all chart settings from localStorage with fallbacks to
 * default values. Handles type conversion and validation for different
 * setting types (select, toggle, range, colors).
 *
 * @returns {Object} Current settings object
 */
export function getCurrentSettings() {
    try {
        const /** @type {Record<string, any> & { colors: Record<string,string> }} */
            settings = { colors: {} },
            themeConfig = getThemeConfig();

        // Get chart option settings
        for (const opt of chartOptionsConfig || []) {
            const stored = localStorage.getItem(`${STORAGE_PREFIXES.CHART_OPTION}${opt.id}`);
            // @ts-ignore opt shape
            settings[opt.id] = parseStoredValue(stored, opt);
        }

        // Get color settings
        settings.colors = {};
        /** @type {any[]} */
        const fields = Array.isArray(formatChartFields) ? formatChartFields : [];
        for (const field of fields) {
            const stored = localStorage.getItem(`${STORAGE_PREFIXES.FIELD_COLOR}${field}`);
            // @ts-ignore dynamic field key
            settings.colors[field] =
                stored ||
                /** @type {any} */ (fieldColors)[field] ||
                (themeConfig && themeConfig.colors ? themeConfig.colors.primaryAlpha : "#3b82f6");
        }

        return settings;
    } catch (error) {
        const err = /** @type {any} */ (error);
        console.error(`${LOG_PREFIX} Error getting current settings:`, err?.message || err);
        return getDefaultSettings();
    }
}

/**
 * Gets default settings object based on chart configuration
 *
 * Creates a settings object with all default values from the chart
 * options configuration and default field colors.
 *
 * @returns {Object} Default settings object
 */
export function getDefaultSettings() {
    try {
        /** @type {Record<string, any> & { colors: Record<string,string> }} */
        const settings = { colors: {} };

        // Get default values from chart options config
        for (const opt of chartOptionsConfig || []) {
            // @ts-ignore config shape trusted
            settings[opt.id] = /** @type {any} */ (opt).default;
        }

        // Add default field colors
        settings.colors = { ...fieldColors };

        return settings;
    } catch (error) {
        const err = /** @type {any} */ (error);
        console.error(`${LOG_PREFIX} Error getting default settings:`, err?.message || err);
        return {};
    }
}

/**
 * Re-renders charts after a setting change
 * @param {string} settingName - Name of the setting that changed
 * @param {*} newValue - New value of the setting
 */
export function reRenderChartsAfterSettingChange(settingName, newValue) {
    try {
        // Check if chart data is available
        if (!globalThis.globalData || !globalThis.globalData.recordMesgs) {
            console.log(`${LOG_PREFIX} No chart data available for re-rendering after ${settingName} change`);
            return;
        }

        console.log(`${LOG_PREFIX} Re-rendering charts after ${settingName} changed to ${newValue}`);

        // CRITICAL: Clear cached settings from state management
        // This ensures the chart rendering will read fresh settings from localStorage
        if (typeof setState === "function") {
            setState("settings.charts", null, { source: "reRenderChartsAfterSettingChange" });
            console.log(`${LOG_PREFIX} Cleared cached chart settings from state`);
        }

        const reason = `Setting change: ${settingName}`;
        // Prefer the shared render pipeline (no destructive teardown on every tweak).
        const managerCandidate =
            chartStateManager && typeof chartStateManager.debouncedRender === "function"
                ? chartStateManager
                : /** @type {any} */ (globalThis).chartStateManager;
        if (managerCandidate && typeof managerCandidate.debouncedRender === "function") {
            managerCandidate.debouncedRender(reason);
            console.log(`${LOG_PREFIX} Delegated re-render to chartStateManager`);
            return;
        }

        const actions = /** @type {any} */ (globalThis).chartActions;
        if (actions && typeof actions.requestRerender === "function") {
            actions.requestRerender(reason);
            console.log(`${LOG_PREFIX} Delegated re-render via chartActions.requestRerender`);
            return;
        }

        // LAST RESORT fallback (legacy): full teardown/rebuild.
        if (actions && typeof actions.clearCharts === "function") {
            actions.clearCharts();
        } else if (globalThis._chartjsInstances && Array.isArray(globalThis._chartjsInstances)) {
            console.log(`${LOG_PREFIX} Destroying ${globalThis._chartjsInstances.length} existing chart instances`);
            for (const [index, chart] of globalThis._chartjsInstances.entries()) {
                if (chart && typeof chart.destroy === "function") {
                    try {
                        chart.destroy();
                        console.log(`${LOG_PREFIX} Destroyed chart instance ${index}`);
                    } catch (error) {
                        console.warn(`${LOG_PREFIX} Error destroying chart ${index}:`, error);
                    }
                }
            }
            globalThis._chartjsInstances = [];
        }

        const existingCanvases = queryAll('canvas[id^="chart-"], canvas[id^="chartjs-canvas-"]');
        console.log(`${LOG_PREFIX} Removing ${existingCanvases.length} existing chart canvases`);
        for (const canvas of existingCanvases) {
            if (canvas.parentNode) {
                canvas.remove();
            }
        }

        // Force a complete re-render - try multiple container approaches
        let container = document.querySelector("#content-chart");
        if (!container) {
            container = document.querySelector("#chartjs-chart-container");
        }
        if (!container) {
            container = document.querySelector("#chart-container");
        }

        console.log(`${LOG_PREFIX} Using container: ${container ? container.id : "none found"}`);

        // Force re-render through modern state management
        if (typeof (/** @type {any} */ (globalThis).renderChartJS) === "function") {
            // Fallback: direct rendering for compatibility if globally exposed
            const target = container || document.querySelector("#content-chart") || document.body;
            /** @type {any} */ (globalThis).renderChartJS(target);
        } else {
            // Final fallback: dispatch a render request event handled elsewhere
            console.log(`${LOG_PREFIX} Dispatching render request event fallback`);
            globalThis.dispatchEvent(
                new CustomEvent("ffv:request-render-charts", { detail: { reason: `setting-change:${settingName}` } })
            );
        }

        console.log(`${LOG_PREFIX} Chart re-render completed for ${settingName} change (fallback path)`);
    } catch (error) {
        const err = /** @type {any} */ (error);
        console.error(`${LOG_PREFIX} Error re-rendering charts after ${settingName} change:`, err?.message || err);
        if (typeof showNotification === "function") {
            showNotification(`Failed to update chart setting: ${err?.message || err}`, "error");
        }
    }
}

/**
 * Resets all chart settings to their default values
 *
 * Clears all chart-related settings from localStorage, resets UI controls
 * to default values, and re-renders charts with the default configuration.
 * Shows a success notification when complete.
 *
 * @returns {boolean} True if reset was successful, false otherwise
 */
export function resetAllSettings() {
    try {
        console.log(`${LOG_PREFIX} Resetting all settings to defaults`);

        // Clear all stored settings
        clearAllStorageItems(); // Reset UI controls with a small delay to ensure DOM is ready
        setTimeout(() => {
            const wrapper = document.querySelector("#chartjs-settings-wrapper");
            if (wrapper) {
                resetUIControlsToDefaults(wrapper);
            }

            // Second pass for any controls that might not have been found initially
            setTimeout(() => {
                console.log(`${LOG_PREFIX} Performing second pass UI control updates`);
                performDirectControlUpdates();
            }, 100);

            // Update chart status indicators after UI reset
            setTimeout(() => {
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
        const err = /** @type {any} */ (error);
        console.error(`${LOG_PREFIX} Error resetting settings:`, err?.message || err);
        showNotification("Failed to reset settings", "error");
        return false;
    }
}

/**
 * Clears all chart-related localStorage items
 */
function clearAllStorageItems() {
    try {
        // Clear chart option settings
        for (const opt of chartOptionsConfig || []) {
            localStorage.removeItem(`${STORAGE_PREFIXES.CHART_OPTION}${opt.id}`);
        }

        // Clear field visibility and color settings
        for (const field of Array.isArray(formatChartFields) ? formatChartFields : []) {
            localStorage.removeItem(`${STORAGE_PREFIXES.FIELD_COLOR}${field}`);
            localStorage.removeItem(`${STORAGE_PREFIXES.FIELD_VISIBILITY}${field}`);
        }

        // Clear zone chart field settings
        for (const field of ZONE_CHART_FIELDS) {
            localStorage.removeItem(`${STORAGE_PREFIXES.FIELD_VISIBILITY}${field}`);
        }

        // Clear zone color settings
        for (let i = 1; i <= MAX_ZONE_COUNT; i++) {
            localStorage.removeItem(`${STORAGE_PREFIXES.HR_ZONE_COLOR}${i}_color`);
            localStorage.removeItem(`${STORAGE_PREFIXES.POWER_ZONE_COLOR}${i}_color`);
        }

        // Clear unit settings
        for (const unit of UNIT_TYPES) {
            localStorage.removeItem(`${STORAGE_PREFIXES.CHART_OPTION}${unit}`);
        }

        console.log(`${LOG_PREFIX} All storage items cleared`);
    } catch (error) {
        const err = /** @type {any} */ (error);
        console.error(`${LOG_PREFIX} Error clearing storage items:`, err?.message || err);
    }
}

/**
 * Parses stored value based on option type
 * @param {string|null} stored - Stored value from localStorage
 * @param {Object} option - Chart option configuration
 * @returns {*} Parsed value with correct type
 */
/**
 * @param {string|null} stored
 * @param {ChartOptionConfig|any} option
 */
function parseStoredValue(stored, option) {
    /** @type {ChartOptionConfig} */
    // @ts-ignore - runtime trusted from config import
    const opt = option;
    if (stored === null) {
        return opt.default;
    }

    switch (opt.type) {
        case "range": {
            return Number.parseFloat(stored);
        }

        case "select": {
            if (opt.id === "maxpoints") {
                return stored === "all" ? "all" : Number.parseInt(stored, 10);
            }
            return stored;
        }

        case "toggle": {
            // Handle both boolean and string representations
            if (typeof stored === "boolean") {
                return stored;
            }
            return stored === "true" || stored === "on";
        }

        default: {
            return stored;
        }
    }
}

/**
 * Performs direct control updates by specific selectors as fallback
 */
function performDirectControlUpdates() {
    try {
        let updatedCount = 0;

        // Direct updates for known control types
        for (const opt of chartOptionsConfig || []) {
            let updated = false;

            switch (opt.type) {
                case "range": {
                    const slider = query(`#chartjs-${opt.id}-slider`);
                    if (slider && "type" in slider && slider.type === "range") {
                        // @ts-ignore value exists
                        slider.value = opt.default;

                        // Update value display
                        const valueDisplay = slider.parentElement?.querySelector("span");
                        if (valueDisplay && valueDisplay.style.position === "absolute") {
                            valueDisplay.textContent = String(opt.default);
                        }

                        // Update visual styling
                        // @ts-ignore slider is range
                        updateRangeSliderStyling(slider, opt, opt.default);
                        updated = true;
                    }
                    break;
                }

                case "select": {
                    const select = query(`#chartjs-${opt.id}-dropdown`);
                    if (select && select.tagName === "SELECT") {
                        // @ts-ignore value exists
                        select.value = opt.default;
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
                            parent._updateFromReset && parent._updateFromReset();
                            updated = true;
                        }
                    }
                    break;
                }
            }

            if (updated) {
                updatedCount++;
                console.log(`${LOG_PREFIX} Direct update: ${opt.id} = ${opt.default}`);
            }
        }

        console.log(`${LOG_PREFIX} Performed ${updatedCount} direct control updates`);
    } catch (error) {
        const err = /** @type {any} */ (error);
        console.error(`${LOG_PREFIX} Error in direct control updates:`, err?.message || err);
    }
}

/**
 * Re-renders charts after settings reset
 */
function reRenderChartsAfterReset() {
    try {
        // Check if chart data is available
        if (!globalThis.globalData || !globalThis.globalData.recordMesgs) {
            console.log(`${LOG_PREFIX} No chart data available for re-rendering`);
            return;
        }

        console.log(`${LOG_PREFIX} Re-rendering charts after settings reset`);

        // Get the charts container
        const chartsContainer = document.querySelector("#chart-container");

        // Clear existing chart instances
        if (globalThis._chartjsInstances && Array.isArray(globalThis._chartjsInstances)) {
            for (const chart of globalThis._chartjsInstances) {
                if (chart && typeof chart.destroy === "function") {
                    chart.destroy();
                }
            }
            globalThis._chartjsInstances = [];
        }

        // Force a complete re-render through modern state management
        if (chartStateManager) {
            chartStateManager.debouncedRender("Settings reset");
        } else if (typeof (/** @type {any} */ (globalThis).renderChartJS) === "function") {
            const target = chartsContainer || document.querySelector("#content-chart") || document.body;
            /** @type {any} */ (globalThis).renderChartJS(target);
        } else {
            globalThis.dispatchEvent(
                new CustomEvent("ffv:request-render-charts", { detail: { reason: "settings-reset" } })
            );
        }
    } catch (error) {
        const err = /** @type {any} */ (error);
        console.error(`${LOG_PREFIX} Error re-rendering charts:`, err?.message || err);
    }
}

/**
 * Resets all UI controls to default values
 * @param {Element} wrapper - Settings wrapper element
 */
function resetUIControlsToDefaults(wrapper) {
    if (!wrapper) {
        console.warn(`${LOG_PREFIX} Settings wrapper not found`);
        return;
    }

    try {
        console.log(`${LOG_PREFIX} Resetting ${chartOptionsConfig.length} chart option controls`);

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
                console.log(`${LOG_PREFIX} Reset control ${opt.id} to default: ${opt.default}`);
            } else {
                // Try to find by searching all elements that might contain the option
                const allControls = queryAll('select, input[type="range"], .toggle-switch', wrapper);
                for (const element of allControls) {
                    if (element.id && element.id.includes(opt.id)) {
                        updateUIControl(element, opt, opt.default);
                        console.log(`${LOG_PREFIX} Reset control ${opt.id} via fallback search to: ${opt.default}`);
                    }
                }
            }

            // Handle custom toggle controls with _updateFromReset method
            if (opt.type === "toggle") {
                const toggleContainer =
                    wrapper.querySelector(`#chartjs-${opt.id}`) ||
                    wrapper.querySelector(`[data-option-id="${opt.id}"]`);
                if (isResettable(toggleContainer)) {
                    // @ts-ignore existence
                    toggleContainer._updateFromReset && toggleContainer._updateFromReset();
                } else {
                    // Find toggle container by checking for toggle-switch elements
                    const toggleSwitches = wrapper.querySelectorAll(".toggle-switch");
                    for (const toggleSwitch of toggleSwitches) {
                        const parent = toggleSwitch.parentElement;
                        if (isResettable(parent)) {
                            // Check if this toggle is for our option by looking at surrounding context
                            const settingRow = parent.closest(".setting-row");
                            if (settingRow) {
                                const label = settingRow.querySelector(".setting-label");
                                // Guard label.textContent which can be null per DOM typings
                                if (
                                    label &&
                                    (label.textContent || "").toLowerCase().includes(opt.label.toLowerCase())
                                ) {
                                    parent._updateFromReset && parent._updateFromReset();
                                    console.log(`${LOG_PREFIX} Updated toggle ${opt.id} via context matching`);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Reset all field toggles to visible (default state)
        const fieldToggles = queryAll('.field-toggle input[type="checkbox"]', wrapper);
        for (const toggle of fieldToggles) {
            setChecked(toggle, true);
        }
        if (fieldToggles.length > 0) {
            console.log(`${LOG_PREFIX} Reset ${fieldToggles.length} field toggles to visible`);
        }

        // Reset all color pickers to default colors
        const colorPickers = queryAll('input[type="color"]', wrapper);
        for (const picker of colorPickers) {
            const fieldName = picker.id.replace("field-color-", "").replace("chartjs-", "");
            if (/** @type {any} */ (fieldColors)[fieldName]) {
                setValue(picker, /** @type {any} */ (fieldColors)[fieldName]);
            }
        }
        if (colorPickers.length > 0) {
            console.log(`${LOG_PREFIX} Reset ${colorPickers.length} color pickers to defaults`);
        }

        // Find and update any custom controls with _updateFromReset method
        updateCustomControlsFromReset(wrapper);

        // Perform direct control updates as additional fallback
        performDirectControlUpdates();

        console.log(`${LOG_PREFIX} UI controls reset to defaults completed`);
    } catch (error) {
        const err = /** @type {any} */ (error);
        console.error(`${LOG_PREFIX} Error resetting UI controls:`, err?.message || err);
    }
}

/**
 * Updates custom controls that have _updateFromReset methods
 * @param {Element} wrapper - Settings wrapper element
 */
function updateCustomControlsFromReset(wrapper) {
    try {
        // Find all elements with _updateFromReset method and call them
        const allElements = queryAll("*", wrapper);
        let updatedCount = 0;

        for (const element of allElements) {
            if (isResettable(element)) {
                // @ts-ignore existence
                element._updateFromReset && element._updateFromReset();
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            console.log(`${LOG_PREFIX} Updated ${updatedCount} custom controls from reset`);
        }
    } catch (error) {
        const err = /** @type {any} */ (error);
        console.error(`${LOG_PREFIX} Error updating custom controls from reset:`, err?.message || err);
    }
}

/**
 * Updates range slider visual styling
 * @param {Element} control - Range input element
 * @param {Object} option - Chart option configuration
 * @param {number} value - Current value
 */
function updateRangeSliderStyling(control, option, value) {
    try {
        const themeConfig = getThemeConfig(),
            /** @type {any} */
            theme = themeConfig || {},
            accentColor = theme.colors?.accent || "var(--color-accent, #3b82f6)",
            borderLight = theme.colors?.borderLight || "var(--color-border, #e5e7eb)",
            /** @type {any} */
            optRange = option || {},
            max = optRange && optRange.max != null ? optRange.max : 1,
            min = optRange && optRange.min != null ? optRange.min : 0,
            percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

        if (isHTMLElement(control)) {
            control.style.background = `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${percentage}%, ${borderLight} ${percentage}%, ${borderLight} 100%)`;
        }
    } catch (error) {
        const err = /** @type {any} */ (error);
        console.warn(`${LOG_PREFIX} Error updating range slider styling:`, err?.message || err);
    }
}

/**
 * Updates UI control to match setting value
 * @param {Element} control - DOM control element
 * @param {Object} option - Chart option configuration
 * @param {*} value - Value to set
 */
function updateUIControl(control, option, value) {
    if (!isHTMLElement(control)) {
        return;
    }

    try {
        /** @type {ChartOptionConfig} */
        // @ts-ignore
        const opt = option;
        switch (opt.type) {
            case "range": {
                /** @type {HTMLElement|null} */
                let sliderEl =
                    "type" in control && control.type === "range"
                        ? control
                        : control.querySelector("input[type='range']");
                if (!sliderEl) {
                    sliderEl = query(`#chartjs-${opt.id}-slider`);
                }
                if (sliderEl && "type" in sliderEl && sliderEl.type === "range") {
                    // @ts-ignore value exists
                    sliderEl.value = value;

                    const valueDisplay = sliderEl.parentElement?.querySelector("span");
                    if (valueDisplay && valueDisplay.style.position === "absolute") {
                        valueDisplay.textContent = String(value);
                    }

                    // Update range slider visual styling
                    // @ts-ignore sliderEl is range input
                    updateRangeSliderStyling(sliderEl, opt, value);
                    console.log(`${LOG_PREFIX} Updated range ${opt.id} to: ${value}`);
                }
                break;
            }

            case "select": {
                /** @type {HTMLElement|null} */
                let selectEl = control.tagName === "SELECT" ? control : control.querySelector("select");
                if (!selectEl) {
                    selectEl = query(`#chartjs-${opt.id}-dropdown`);
                }
                if (selectEl && selectEl.tagName === "SELECT") {
                    // @ts-ignore value exists
                    selectEl.value = value;
                    console.log(`${LOG_PREFIX} Updated select ${opt.id} to: ${value}`);
                }
                break;
            }

            case "toggle": {
                // Handle both regular checkbox toggles and custom toggle controls
                if ("type" in control && control.type === "checkbox") {
                    // @ts-ignore guarded
                    control.checked = Boolean(value);
                } else if (isResettable(control)) {
                    // For custom toggle controls, use their update method
                    // @ts-ignore guard
                    control._updateFromReset && control._updateFromReset();
                } else {
                    // Try to find the parent container with the update method
                    const parent = control.closest("[data-option-id]") || control.parentElement;
                    if (isResettable(parent)) {
                        // @ts-ignore guard
                        parent._updateFromReset && parent._updateFromReset();
                    }
                }
                break;
            }
        }
    } catch (error) {
        const err = /** @type {any} */ (error);
        console.warn(`${LOG_PREFIX} Error updating UI control for`, err?.message || err);
    }
}
