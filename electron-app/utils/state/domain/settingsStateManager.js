/**
 * Settings State Manager
 * Manages application settings with validation, persistence, and change tracking
 */

import { showNotification } from "../../ui/notifications/showNotification.js";
import { getState, setState, subscribe } from "../core/stateManager.js";

/**
 * @typedef {"theme"|"mapTheme"|"chart"|"ui"|"export"|"units"|"powerEstimation"} SettingCategory
 * @typedef {Object} SettingSchema
 * @property {string} key
 * @property {any} default
 * @property {(value:any)=>boolean} validate
 * @property {"string"|"boolean"|"object"|"number"} type
 */

/**
 * @typedef {Object} ExportedSettings
 * @property {string} version
 * @property {number} timestamp
 * @property {Record<string, any>} settings
 */

/**
 * Settings categories and their configurations
 */
/** @type {Record<SettingCategory, SettingSchema>} */
const SETTINGS_SCHEMA = {
    chart: {
        default: {},
        key: "chartjs_",
        type: "object",
        // Chart settings are stored as individual primitive values under object-keys
        // (e.g. chartjs_field_speed = "hidden", chartjs_color_speed = "#ff00ff").
        // Validation of the *whole object* is not meaningful in that model.
        validate: () => true,
    },
    export: {
        default: {
            format: "png",
            includeWatermark: false,
            quality: 0.9,
            theme: "auto",
        },
        key: "export_",
        type: "object",
        validate: (value) => typeof value === "object",
    },
    mapTheme: {
        default: true,
        key: "ffv-map-theme-inverted",
        type: "boolean",
        validate: (value) => typeof value === "boolean",
    },
    theme: {
        default: "dark",
        key: "ffv-theme",
        type: "string",
        validate: (value) => ["auto", "dark", "light"].includes(value),
    },
    ui: {
        default: {
            animationsEnabled: true,
            compactMode: false,
            showAdvancedControls: false,
        },
        key: "ui_",
        type: "object",
        validate: (value) => typeof value === "object",
    },
    units: {
        default: {
            distance: "metric",
            temperature: "celsius",
            time: "24h",
        },
        key: "units_",
        type: "object",
        validate: (value) => typeof value === "object",
    },
    powerEstimation: {
        default: {},
        key: "powerEst_",
        type: "object",
        // Power estimation settings are stored as individual primitive values (numbers/booleans)
        // under object-keys (e.g. powerEst_riderWeightKg = 75).
        validate: () => true,
    },
};

const CHART_FIELD_VISIBILITY_KEY = "fieldVisibility";
const LEGACY_CHART_FIELD_VISIBILITY_PREFIX = "chartjs_field_";

/**
 * @typedef {"visible" | "hidden"} ChartFieldVisibility
 */

/**
 * @typedef {Record<string, ChartFieldVisibility>} ChartFieldVisibilityMap
 */

/**
 * @typedef {Object} ChartSettings
 * @property {ChartFieldVisibilityMap} [fieldVisibility] - Per-field visibility overrides.
 */

/**
 * Settings State Manager Class
 */
class SettingsStateManager {
    initialized = false;
    /** @type {Promise<void>|null} */
    initializePromise = null;

    constructor() {
        this.subscribers = new Map();
        this.migrationVersion = "1.0.0";
    }

    /**
     * Clean up resources
     */
    /**
     * Cleanup resources (currently minimal)
     */
    cleanup() {
        console.log("[SettingsState] Cleaning up settings state manager...");
        this.subscribers.clear();
        this.initialized = false;
    }

    /**
     * Export settings to JSON
     * @returns {Object} Settings export object
     */
    /**
     * Export all settings and metadata
     * @returns {ExportedSettings|null}
     */
    exportSettings() {
        try {
            /** @type {Record<string, any>} */
            const settings = {};

            for (const category of Object.keys(SETTINGS_SCHEMA)) {
                const cat = /** @type {SettingCategory} */ (category);
                settings[cat] = this.getSetting(cat);
            }

            return {
                settings,
                timestamp: Date.now(),
                version: this.migrationVersion,
            };
        } catch (error) {
            console.error("[SettingsState] Error exporting settings:", error);
            return null;
        }
    }

    /**
     * Get all chart settings
     * @returns {Object} Chart settings object
     */
    /**
     * Return all chart (chartjs_) settings as object
     * @returns {Record<string, any>}
     */
    getChartSettings() {
        /** @type {Record<string, any>} */
        const settings = {};

        // Get all chartjs_ prefixed settings
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("chartjs_")) {
                const settingKey = key.replace("chartjs_", ""),
                    value = localStorage.getItem(key);

                try {
                    settings[settingKey] = value == null ? null : JSON.parse(value);
                } catch {
                    settings[settingKey] = value;
                }
            }
        }

        return settings;
    }

    /**
     * Get a setting value with validation
     * @param {string} category - Setting category
     * @param {string} key - Setting key (optional for non-object settings)
     * @returns {*} Setting value
     */
    /**
     * Get a setting (entire category or specific key for object categories)
     * @param {SettingCategory} category
     * @param {string|null} [key=null]
     * @returns {any}
     */
    getSetting(category, key = null) {
        const schema = SETTINGS_SCHEMA[category];
        if (!schema) {
            console.warn(`[SettingsState] Unknown setting category: ${category}`);
            return;
        }

        const storage = globalThis?.localStorage;
        if (!storage || typeof storage.getItem !== "function") {
            return schema.default;
        }

        try {
            if (schema.type === "object") {
                const prefix = schema.key;

                // PERFORMANCE CRITICAL:
                // When a specific key is requested we must NOT iterate all of localStorage.
                // This path is hit many thousands of times during chart conversions.
                if (key) {
                    const rawValue = storage.getItem(`${prefix}${key}`);
                    if (rawValue == null) {
                        return schema.default && typeof schema.default === "object" ? schema.default[key] : undefined;
                    }
                    try {
                        return JSON.parse(rawValue);
                    } catch {
                        return rawValue;
                    }
                }

                // Whole-category read
                const canIterate = typeof storage.length === "number" && typeof storage.key === "function";
                if (!canIterate) {
                    return schema.default;
                }

                /** @type {Record<string, unknown>} */
                const settings = {};
                for (let i = 0; i < storage.length; i++) {
                    const storageKey = storage.key(i);
                    if (storageKey && storageKey.startsWith(prefix)) {
                        const settingKey = storageKey.slice(prefix.length);
                        const rawValue = storage.getItem(storageKey);
                        if (rawValue == null) {
                            settings[settingKey] = null;
                            continue;
                        }
                        try {
                            settings[settingKey] = JSON.parse(rawValue);
                        } catch {
                            settings[settingKey] = rawValue;
                        }
                    }
                }

                return Object.keys(settings).length > 0 ? { ...schema.default, ...settings } : schema.default;
            }

            // Simple scalar settings
            const rawValue = storage.getItem(schema.key);
            if (rawValue == null) {
                return schema.default;
            }

            if (schema.type === "boolean") {
                return rawValue === "true";
            }

            if (schema.type === "number") {
                const numeric = Number(rawValue);
                return Number.isFinite(numeric) ? numeric : schema.default;
            }

            // string
            return rawValue;
        } catch (error) {
            console.error(`[SettingsState] Error getting setting ${category}:`, error);
            return schema.default;
        }
    }

    /**
     * Import settings from an exported payload.
     *
     * The export format is produced by {@link exportSettings}.
     *
     * @param {unknown} settingsData
     * @returns {boolean}
     */
    importSettings(settingsData) {
        try {
            if (!settingsData || typeof settingsData !== "object") {
                return false;
            }

            const payload = /** @type {{ settings?: Record<string, any> }} */ (settingsData);
            const nextSettings = payload.settings;

            if (!nextSettings || typeof nextSettings !== "object") {
                return false;
            }

            let allOk = true;

            for (const [rawCategory, value] of Object.entries(nextSettings)) {
                const category = /** @type {SettingCategory} */ (rawCategory);
                if (!SETTINGS_SCHEMA[category]) {
                    // Ignore unknown categories to allow forward-compatible imports.
                    continue;
                }

                const ok = this.setSetting(category, value);
                if (!ok) {
                    allOk = false;
                }
            }

            if (allOk) {
                showNotification("Settings imported successfully", "success");
            }

            return allOk;
        } catch (error) {
            console.error("[SettingsState] Error importing settings:", error);
            return false;
        }
    }

    /**
     * Initialize the settings state manager
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        if (this.initializePromise) {
            return this.initializePromise;
        }

        this.initializePromise = (async () => {
            console.log("[SettingsState] Initializing settings state manager...");

            try {
                // Initialize settings state in the main state manager
                setState(
                    "settings",
                    {
                        chart: this.getChartSettings(),
                        export: this.getSetting("export"),
                        isLoading: false,
                        lastModified: Date.now(),
                        mapTheme: this.getSetting("mapTheme"),
                        migrationVersion: this.migrationVersion,
                        theme: this.getSetting("theme"),
                        ui: this.getSetting("ui"),
                        units: this.getSetting("units"),
                    },
                    { source: "SettingsStateManager.initialize" }
                );

                // Migrate old settings if needed
                await this.migrateSettings();

                // Set up settings synchronization with localStorage
                this.setupLocalStorageSync();

                this.initialized = true;
                console.log("[SettingsState] Settings state manager initialized successfully");
            } catch (error) {
                console.error("[SettingsState] Failed to initialize settings state manager:", error);
                throw error;
            } finally {
                this.initializePromise = null;
            }
        })();

        return this.initializePromise;
    }

    /**
     * Migrate from legacy settings format
     */
    /**
     * Initial legacy migration (idempotent)
     */
    async migrateFromLegacy() {
        console.log("[SettingsState] Performing legacy settings migration...");

        // Migrate theme setting
        const oldTheme = localStorage.getItem("theme");
        if (oldTheme && !localStorage.getItem("ffv-theme")) {
            localStorage.setItem("ffv-theme", oldTheme);
            localStorage.removeItem("theme");
        }

        // No other legacy migrations needed currently
        // This method can be expanded for future migrations
    }

    /**
     * Migrate old settings to new format
     */
    /**
     * Perform migrations if required
     */
    async migrateSettings() {
        try {
            const currentVersion = localStorage.getItem("settings_migration_version");

            if (currentVersion === this.migrationVersion) {
                console.log("[SettingsState] Settings already at current version");
                return;
            }

            console.log("[SettingsState] Migrating settings to version", this.migrationVersion);

            // Perform migrations based on current version
            if (!currentVersion) {
                // Initial migration - ensure all settings are properly structured
                await this.migrateFromLegacy();
            }

            // Set migration version
            localStorage.setItem("settings_migration_version", this.migrationVersion);
            console.log("[SettingsState] Settings migration completed");
        } catch (error) {
            console.error("[SettingsState] Error during settings migration:", error);
        }
    }

    /**
     * Reset settings to defaults
     * @param {string} category - Category to reset (optional, resets all if not provided)
     */
    /**
     * Reset settings (single category or all)
     * @param {SettingCategory|null} [category=null]
     * @param {{ silent?: boolean }} [options]
     * @returns {boolean}
     */
    resetSettings(category = null, options = {}) {
        try {
            const { silent = false } = options || {};
            if (category) {
                // Reset specific category
                const schema = SETTINGS_SCHEMA[category];
                if (!schema) {
                    console.warn(`[SettingsState] Unknown setting category: ${category}`);
                    return false;
                }

                if (schema.type === "object") {
                    // Remove all keys with this prefix
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith(schema.key)) {
                            keysToRemove.push(key);
                        }
                    }
                    for (const key of keysToRemove) localStorage.removeItem(key);
                } else {
                    localStorage.removeItem(schema.key);
                }

                // Update state
                setState(`settings.${category}`, schema.default, {
                    source: "SettingsStateManager.resetSettings",
                });
            } else {
                // Reset all settings
                for (const cat of Object.keys(SETTINGS_SCHEMA)) {
                    this.resetSettings(/** @type {SettingCategory} */ (cat));
                }
            }

            setState("settings.lastModified", Date.now(), {
                source: "SettingsStateManager.resetSettings",
            });

            if (!silent) {
                showNotification(
                    category ? `${category} settings reset to defaults` : "All settings reset to defaults",
                    "success"
                );
            }

            return true;
        } catch (error) {
            console.error("[SettingsState] Error resetting settings:", error);
            if (!options?.silent) {
                showNotification("Failed to reset settings", "error");
            }
            return false;
        }
    }

    /**
     * Set a setting value with validation
     * @param {string} category - Setting category
     * @param {*} value - Setting value
     * @param {string} key - Setting key (for object-type settings)
     */
    /**
     * Set a setting value (entire category or specific key for object categories)
     * @param {SettingCategory} category
     * @param {any} value
     * @param {string|null} [key=null]
     * @returns {boolean}
     */
    setSetting(category, value, key = null) {
        const schema = SETTINGS_SCHEMA[category];
        if (!schema) {
            console.warn(`[SettingsState] Unknown setting category: ${category}`);
            return false;
        }

        try {
            // Validate the value
            if (!schema.validate(value)) {
                console.error(`[SettingsState] Invalid value for setting ${category}:`, value);
                return false;
            }

            if (schema.type === "object" && key) {
                // Set specific object property
                const storageKey = schema.key + key;
                // Preserve legacy behavior for string settings:
                // historically these were stored as raw strings (e.g. "hidden"/"visible").
                // Writing JSON strings would add quotes and break direct localStorage comparisons.
                localStorage.setItem(storageKey, typeof value === "string" ? value : JSON.stringify(value));

                // Update state
                const rootState = /** @type {any} */ (getState("settings")),
                    currentSettings = (rootState && rootState[category]) || {};
                currentSettings[key] = value;
                setState(`settings.${category}` /** @type {string} */, currentSettings, {
                    source: "SettingsStateManager.setSetting",
                });
            } else {
                // Set entire setting
                localStorage.setItem(schema.key, schema.type === "boolean" ? value.toString() : JSON.stringify(value));

                // Update state
                setState(`settings.${category}`, value, {
                    source: "SettingsStateManager.setSetting",
                });
            }

            // Update last modified timestamp
            setState("settings.lastModified", Date.now(), {
                source: "SettingsStateManager.setSetting",
            });

            return true;
        } catch (error) {
            console.error(`[SettingsState] Error setting ${category}:`, error);
            return false;
        }
    }

    /**
     * Set up synchronization between state and localStorage
     */
    /**
     * Wire listeners for cross-tab storage changes
     */
    setupLocalStorageSync() {
        // Subscribe to settings changes and update localStorage
        subscribe("settings", () => {
            // This will be called whenever settings state changes
            console.log("[SettingsState] Settings state changed, localStorage already updated");
        });

        // Listen for localStorage changes from other tabs/windows
        globalThis.addEventListener("storage", (event) => {
            const k = event.key || ""; // Normalize for TS nullability
            if (k && Object.values(SETTINGS_SCHEMA).some((schema) => k.startsWith(schema.key))) {
                console.log("[SettingsState] External localStorage change detected:", event.key);

                // Update state to reflect external changes
                this.syncFromLocalStorage();
            }
        });
    }
    /**
     * Sync state from localStorage (for external changes)
     */
    /**
     * Sync state from localStorage after external changes
     */
    syncFromLocalStorage() {
        try {
            for (const category of Object.keys(SETTINGS_SCHEMA)) {
                const cat = /** @type {SettingCategory} */ (category),
                    currentValue = this.getSetting(cat);
                setState(`settings.${category}`, currentValue, {
                    source: "SettingsStateManager.syncFromLocalStorage",
                });
            }

            setState("settings.lastModified", Date.now(), {
                source: "SettingsStateManager.syncFromLocalStorage",
            });
        } catch (error) {
            console.error("[SettingsState] Error syncing from localStorage:", error);
        }
    }
}

/**
 * Normalize chart settings payloads to ensure consistent shapes.
 *
 * @param {ChartSettings | null | undefined} settings
 * @returns {ChartSettings}
 */
function normalizeChartSettings(settings) {
    const safeSettings = settings && typeof settings === "object" ? settings : {};
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
 * @returns {ChartFieldVisibility | undefined}
 */
function readLegacyChartFieldVisibility(fieldKey) {
    const storage = globalThis?.localStorage;
    if (!storage) {
        return;
    }

    const storedValue = storage.getItem(`${LEGACY_CHART_FIELD_VISIBILITY_PREFIX}${fieldKey}`);
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

// Create and export global settings state manager
export const settingsStateManager = new SettingsStateManager();

/**
 * Convenience functions for common settings operations
 */

/**
 * Export all settings
 * @returns {Object} Settings export data
 */
/** @returns {ExportedSettings|null} */
export function exportAllSettings() {
    return settingsStateManager.exportSettings();
}

/**
 * Read field visibility from settings, migrating legacy localStorage keys if present.
 *
 * @param {string} fieldKey
 * @param {ChartFieldVisibility} [defaultVisibility="visible"]
 * @returns {ChartFieldVisibility}
 */
export function getChartFieldVisibility(fieldKey, defaultVisibility = "visible") {
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
 * Get chart setting
 * @param {string} key - Chart setting key
 * @returns {*} Chart setting value
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
 * Get map theme setting
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
 * Get theme setting
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
 * Import settings from data
 * @param {Object} settingsData - Settings data to import
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
 * @returns {boolean}
 */
export function removeChartSetting(key) {
    if (typeof key !== "string" || !key.trim()) {
        console.warn("[SettingsState] removeChartSetting called with invalid key", key);
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
 * Reset all chart settings
 */
export function resetChartSettings(options = {}) {
    return settingsStateManager.resetSettings("chart", options);
}

/**
 * Update visibility for a single chart field.
 *
 * @param {string} fieldKey
 * @param {ChartFieldVisibility} visibility
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
 * Set chart setting
 * @param {string} key - Chart setting key
 * @param {*} value - Chart setting value
 */
/** @param {string} key @param {any} value */
export function setChartSetting(key, value) {
    return settingsStateManager.setSetting("chart", value, key);
}

/**
 * Set map theme setting
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
 * Set theme setting
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
 * @returns {() => void}
 */
export function subscribeToChartSettings(callback) {
    return subscribe("settings.chart", (nextValue, previousValue) => {
        callback(normalizeChartSettings(nextValue), normalizeChartSettings(previousValue));
    });
}

/**
 * Update chart settings by merging new values into existing settings.
 *
 * @param {ChartSettings} updates
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
