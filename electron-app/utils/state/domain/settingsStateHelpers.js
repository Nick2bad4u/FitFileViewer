/**
 * Helper exports for settings state manager (chart settings and convenience
 * accessors).
 */
import { getState, setState, subscribe } from "../core/stateManager.js";
import { SETTINGS_SCHEMA } from "./settingsStateSchema.js";
import { settingsStateManager } from "./settingsStateCore.js";
const CHART_FIELD_VISIBILITY_KEY = "fieldVisibility";
const LEGACY_CHART_FIELD_VISIBILITY_PREFIX = "chartjs_field_";
function isPlainSettingsRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function asRecord(value) {
    return isPlainSettingsRecord(value) ? value : {};
}
function asChartFieldVisibilityMap(value) {
    const record = asRecord(value),
        visibility = {};
    for (const [key, setting] of Object.entries(record)) {
        if (setting === "visible" || setting === "hidden") {
            visibility[key] = setting;
        }
    }
    return visibility;
}
/**
 * Normalize chart settings payloads to ensure consistent shapes.
 */
function normalizeChartSettings(settings) {
    const safeSettings = asRecord(settings),
        fieldVisibility = asChartFieldVisibilityMap(
            safeSettings[CHART_FIELD_VISIBILITY_KEY]
        );
    return {
        ...safeSettings,
        [CHART_FIELD_VISIBILITY_KEY]: {
            ...fieldVisibility,
        },
    };
}
/**
 * Read legacy per-field visibility preferences stored as individual keys.
 */
function readLegacyChartFieldVisibility(fieldKey) {
    const storage = globalThis?.localStorage;
    if (!storage) {
        return undefined;
    }
    const storedValue = storage.getItem(
        `${LEGACY_CHART_FIELD_VISIBILITY_PREFIX}${fieldKey}`
    );
    if (storedValue === "visible" || storedValue === "hidden") {
        return storedValue;
    }
    return undefined;
}
/**
 * Remove legacy per-field visibility keys after migration.
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
 */
export function exportAllSettings() {
    return settingsStateManager.exportSettings();
}
/**
 * Read field visibility from settings, migrating legacy localStorage keys if
 * present.
 *
 * `"visible"`
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
 */
export function getChartSetting(key) {
    return settingsStateManager.getSetting("chart", key);
}
/**
 * Return normalized chart settings with default field visibility map.
 */
export function getChartSettings() {
    return normalizeChartSettings(settingsStateManager.getSetting("chart"));
}
/**
 * Get map theme setting.
 */
export function getMapThemeSetting() {
    return Boolean(settingsStateManager.getSetting("mapTheme"));
}
/**
 * Get power estimation setting.
 */
export function getPowerEstimationSetting(key) {
    return settingsStateManager.getSetting("powerEstimation", key);
}
/**
 * Get theme setting.
 */
export function getThemeSetting() {
    return String(settingsStateManager.getSetting("theme"));
}
/**
 * Convenience wrapper for chart renderers to access user chart settings.
 */
export function getUserChartSettings() {
    return getChartSettings();
}
/**
 * Import settings from data.
 */
export function importAllSettings(settingsData) {
    return settingsStateManager.importSettings(settingsData);
}
/**
 * Remove a chart setting (chartjs_* key) and update state.
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
        const rootState = getState("settings");
        const currentSettings =
            isPlainSettingsRecord(rootState) &&
            isPlainSettingsRecord(rootState["chart"])
                ? rootState["chart"]
                : {};
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
 */
export function setChartSetting(key, value) {
    return settingsStateManager.setSetting("chart", value, key);
}
/**
 * Set map theme setting.
 */
export function setMapThemeSetting(inverted) {
    return settingsStateManager.setSetting("mapTheme", inverted);
}
/**
 * Set power estimation setting.
 */
export function setPowerEstimationSetting(key, value) {
    return settingsStateManager.setSetting("powerEstimation", value, key);
}
/**
 * Set theme setting.
 */
export function setThemeSetting(theme) {
    return settingsStateManager.setSetting("theme", theme);
}
/**
 * Subscribe to chart settings updates.
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
