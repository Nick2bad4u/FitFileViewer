/**
 * Helper exports for settings state manager (chart settings and convenience
 * accessors).
 */

import { getState, setState, subscribe } from "../core/stateManager.js";
import { SETTINGS_SCHEMA, settingsStateManager } from "./settingsStateCore.js";

const CHART_FIELD_VISIBILITY_KEY = "fieldVisibility";
const LEGACY_CHART_FIELD_VISIBILITY_PREFIX = "chartjs_field_";

/**
 * @typedef {Object} ExportedSettings
 *
 * @property {string} version
 * @property {number} timestamp
 * @property {Record<string, any>} settings
 */

/**
 * @typedef {"visible" | "hidden"} ChartFieldVisibility
 */

/**
 * @typedef {Record<string, ChartFieldVisibility>} ChartFieldVisibilityMap
 */

/**
 * @typedef {Object} ChartSettings
 *
 * @property {ChartFieldVisibilityMap} [fieldVisibility] - Per-field visibility
 *   overrides.
 */

/**
 * Normalize chart settings payloads to ensure consistent shapes.
 *
 * @param {ChartSettings | null | undefined} settings
 *
 * @returns {ChartSettings}
 */
function normalizeChartSettings(settings) {
    const safeSettings =
        settings && typeof settings === "object" ? settings : {};
    const fieldVisibility = safeSettings?.[CHART_FIELD_VISIBILITY_KEY] || {};

    return {
        ...safeSettings,
        [CHART_FIELD_VISIBILITY_KEY]: {
            ...fieldVisibility,
        },
    };
}

/**
 * Read legacy per-field visibility preferences stored as individual keys.
 *
 * @param {string} fieldKey
 *
 * @returns {ChartFieldVisibility | undefined}
 */
function readLegacyChartFieldVisibility(fieldKey) {
    const storage = globalThis?.localStorage;
    if (!storage) {
        return;
    }

    const storedValue = storage.getItem(
        `${LEGACY_CHART_FIELD_VISIBILITY_PREFIX}${fieldKey}`
    );
    if (storedValue === "visible" || storedValue === "hidden") {
        return storedValue;
    }
}

/**
 * Remove legacy per-field visibility keys after migration.
 *
 * @param {string} fieldKey
 */
function removeLegacyChartFieldVisibility(fieldKey) {
    const storage = globalThis?.localStorage;
    if (!storage) {
        return;
    }

    storage.removeItem(`${LEGACY_CHART_FIELD_VISIBILITY_PREFIX}${fieldKey}`);
}

/**
 * Export all settings.
 *
 * @returns {ExportedSettings | null}
 */
export function exportAllSettings() {
    return settingsStateManager.exportSettings();
}

/**
 * Read field visibility from settings, migrating legacy localStorage keys if
 * present.
 *
 * @param {string} fieldKey
 * @param {ChartFieldVisibility} [defaultVisibility="visible"] Default is
 *   `"visible"`
 *
 * @returns {ChartFieldVisibility}
 */
export function getChartFieldVisibility(
    fieldKey,
    defaultVisibility = "visible"
) {
    const settings = getChartSettings();
    const fieldVisibility = settings[CHART_FIELD_VISIBILITY_KEY] || {};
    const currentValue = fieldVisibility[fieldKey];

    if (currentValue === "visible" || currentValue === "hidden") {
        return currentValue;
    }

    const legacyValue = readLegacyChartFieldVisibility(fieldKey);
    if (legacyValue) {
        const nextFieldVisibility = {
            ...fieldVisibility,
            [fieldKey]: legacyValue,
        };

        setChartSetting(CHART_FIELD_VISIBILITY_KEY, nextFieldVisibility);
        removeLegacyChartFieldVisibility(fieldKey);

        return legacyValue;
    }

    return defaultVisibility;
}

/**
 * Get chart setting.
 *
 * @param {string} key - Chart setting key
 *
 * @returns {any} Chart setting value
 */
/** @param {string} key */
export function getChartSetting(key) {
    return settingsStateManager.getSetting("chart", key);
}

/**
 * Return normalized chart settings with default field visibility map.
 *
 * @returns {ChartSettings}
 */
export function getChartSettings() {
    return normalizeChartSettings(settingsStateManager.getSetting("chart"));
}

/**
 * Get map theme setting.
 *
 * @returns {boolean} Map theme inverted state
 */
export function getMapThemeSetting() {
    return /** @type {boolean} */ (settingsStateManager.getSetting("mapTheme"));
}

/**
 * Get power estimation setting.
 *
 * @param {string} key
 */
export function getPowerEstimationSetting(key) {
    return settingsStateManager.getSetting("powerEstimation", key);
}

/**
 * Get theme setting.
 *
 * @returns {string} Current theme
 */
export function getThemeSetting() {
    return /** @type {string} */ (settingsStateManager.getSetting("theme"));
}

/**
 * Convenience wrapper for chart renderers to access user chart settings.
 *
 * @returns {ChartSettings}
 */
export function getUserChartSettings() {
    return getChartSettings();
}

/**
 * Import settings from data.
 *
 * @param {Object} settingsData - Settings data to import
 *
 * @returns {boolean} Success status
 */
/** @param {any} settingsData */
export function importAllSettings(settingsData) {
    return settingsStateManager.importSettings(settingsData);
}

/**
 * Remove a chart setting (chartjs_* key) and update state.
 *
 * @param {string} key
 *
 * @returns {boolean}
 */
export function removeChartSetting(key) {
    if (typeof key !== "string" || !key.trim()) {
        console.warn(
            "[SettingsState] removeChartSetting called with invalid key",
            key
        );
        return false;
    }

    try {
        const storageKey = `${SETTINGS_SCHEMA.chart.key}${key}`;
        localStorage.removeItem(storageKey);

        const rootState = /** @type {any} */ (getState("settings"));
        const currentSettings = (rootState && rootState.chart) || {};

        if (currentSettings && Object.hasOwn(currentSettings, key)) {
            const nextSettings = { ...currentSettings };
            delete nextSettings[key];
            setState("settings.chart", nextSettings, {
                source: "SettingsStateManager.removeChartSetting",
            });
        }

        setState("settings.lastModified", Date.now(), {
            source: "SettingsStateManager.removeChartSetting",
        });

        return true;
    } catch (error) {
        console.error("[SettingsState] Error removing chart setting:", error);
        return false;
    }
}

/**
 * Reset all chart settings.
 */
export function resetChartSettings(options = {}) {
    return settingsStateManager.resetSettings("chart", options);
}

/**
 * Update visibility for a single chart field.
 *
 * @param {string} fieldKey
 * @param {ChartFieldVisibility} visibility
 *
 * @returns {ChartFieldVisibilityMap}
 */
export function setChartFieldVisibility(fieldKey, visibility) {
    const settings = getChartSettings();
    const fieldVisibility = settings[CHART_FIELD_VISIBILITY_KEY] || {};
    const nextFieldVisibility = {
        ...fieldVisibility,
        [fieldKey]: visibility,
    };

    setChartSetting(CHART_FIELD_VISIBILITY_KEY, nextFieldVisibility);
    removeLegacyChartFieldVisibility(fieldKey);

    return nextFieldVisibility;
}

/**
 * Set chart setting.
 *
 * @param {string} key - Chart setting key
 * @param {any} value - Chart setting value
 */
/** @param {string} key @param {any} value */
export function setChartSetting(key, value) {
    return settingsStateManager.setSetting("chart", value, key);
}

/**
 * Set map theme setting.
 *
 * @param {boolean} inverted - Map theme inverted state
 */
/** @param {boolean} inverted */
export function setMapThemeSetting(inverted) {
    return settingsStateManager.setSetting("mapTheme", inverted);
}

/**
 * Set power estimation setting.
 *
 * @param {string} key
 * @param {unknown} value
 */
export function setPowerEstimationSetting(key, value) {
    return settingsStateManager.setSetting("powerEstimation", value, key);
}

/**
 * Set theme setting.
 *
 * @param {string} theme - Theme to set
 */
/** @param {string} theme */
export function setThemeSetting(theme) {
    return settingsStateManager.setSetting("theme", theme);
}

/**
 * Subscribe to chart settings updates.
 *
 * @param {(nextSettings: ChartSettings, previousSettings: ChartSettings) => void} callback
 *
 * @returns {() => void}
 */
export function subscribeToChartSettings(callback) {
    return subscribe("settings.chart", (nextValue, previousValue) => {
        callback(
            normalizeChartSettings(nextValue),
            normalizeChartSettings(previousValue)
        );
    });
}

/**
 * Update chart settings by merging new values into existing settings.
 *
 * @param {ChartSettings} updates
 *
 * @returns {ChartSettings}
 */
export function updateChartSettings(updates) {
    const current = getChartSettings();
    const nextFieldVisibility = updates?.[CHART_FIELD_VISIBILITY_KEY]
        ? {
              ...current[CHART_FIELD_VISIBILITY_KEY],
              ...updates[CHART_FIELD_VISIBILITY_KEY],
          }
        : current[CHART_FIELD_VISIBILITY_KEY];

    const nextSettings = {
        ...current,
        ...updates,
        [CHART_FIELD_VISIBILITY_KEY]: nextFieldVisibility,
    };

    for (const [key, value] of Object.entries(updates || {})) {
        if (key === CHART_FIELD_VISIBILITY_KEY && typeof value === "object") {
            setChartSetting(CHART_FIELD_VISIBILITY_KEY, nextFieldVisibility);
            continue;
        }

        setChartSetting(key, value);
    }

    return nextSettings;
}
