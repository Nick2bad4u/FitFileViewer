/**
 * Settings State Manager
 * Manages application settings with validation, persistence, and change tracking
 */

import { getState, setState, subscribe } from "../core/stateManager.js";
import { showNotification } from "../../ui/notifications/showNotification.js";

/**
 * @typedef {"theme"|"mapTheme"|"chart"|"ui"|"export"|"units"} SettingCategory
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
    theme: {
        key: "ffv-theme",
        default: "dark",
        validate: (value) => ["light", "dark", "auto"].includes(value),
        type: "string",
    },
    mapTheme: {
        key: "ffv-map-theme-inverted",
        default: true,
        validate: (value) => typeof value === "boolean",
        type: "boolean",
    },
    chart: {
        key: "chartjs_",
        default: {},
        validate: (value) => typeof value === "object",
        type: "object",
    },
    ui: {
        key: "ui_",
        default: {
            showAdvancedControls: false,
            compactMode: false,
            animationsEnabled: true,
        },
        validate: (value) => typeof value === "object",
        type: "object",
    },
    export: {
        key: "export_",
        default: {
            format: "png",
            quality: 0.9,
            theme: "auto",
            includeWatermark: false,
        },
        validate: (value) => typeof value === "object",
        type: "object",
    },
    units: {
        key: "units_",
        default: {
            distance: "metric",
            temperature: "celsius",
            time: "24h",
        },
        validate: (value) => typeof value === "object",
        type: "object",
    },
};

/**
 * Settings State Manager Class
 */
class SettingsStateManager {
    constructor() {
        this.initialized = false;
        this.subscribers = new Map();
        this.migrationVersion = "1.0.0";
    }

    /**
     * Initialize the settings state manager
     */
    async initialize() {
        if (this.initialized) {
            console.warn("[SettingsState] Already initialized");
            return;
        }

        console.log("[SettingsState] Initializing settings state manager...");

        try {
            // Initialize settings state in the main state manager
            setState(
                "settings",
                {
                    theme: this.getSetting("theme"),
                    mapTheme: this.getSetting("mapTheme"),
                    chart: this.getChartSettings(),
                    ui: this.getSetting("ui"),
                    export: this.getSetting("export"),
                    units: this.getSetting("units"),
                    isLoading: false,
                    lastModified: Date.now(),
                    migrationVersion: this.migrationVersion,
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
        }
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
        // Use bracket access to satisfy exactOptionalPropertyTypes / index signature rules
        const schema = SETTINGS_SCHEMA[category];
        if (!schema) {
            console.warn(`[SettingsState] Unknown setting category: ${category}`);
            return undefined;
        }

        try {
            if (schema.type === "object") {
                // Handle object-type settings (chart, ui, export, units)
                /** @type {Record<string, any>} */
                const settings = {},
                    prefix = schema.key;

                // Get all localStorage keys with this prefix
                for (let i = 0; i < localStorage.length; i++) {
                    const storageKey = localStorage.key(i);
                    if (storageKey && storageKey.startsWith(prefix)) {
                        const settingKey = storageKey.replace(prefix, ""),
                            value = localStorage.getItem(storageKey);

                        try {
                            // Try to parse as JSON, fallback to string
                            settings[settingKey] = value != null ? JSON.parse(value) : null;
                        } catch {
                            settings[settingKey] = value;
                        }
                    }
                }

                // Return specific key or entire object
                if (key) {
                    return settings[key] !== undefined
                        ? settings[key]
                        : schema.default && typeof schema.default === "object"
                          ? schema.default[key]
                          : undefined;
                }

                return Object.keys(settings).length > 0 ? { ...schema.default, ...settings } : schema.default;
            }
            // Handle simple settings (theme, mapTheme)
            const value = localStorage.getItem(schema.key);
            if (value === null) {
                return schema.default;
            }

            // Convert to correct type
            if (schema.type === "boolean") {
                return value === "true";
            } else if (schema.type === "number") {
                return parseFloat(value);
            }
            return value;
        } catch (error) {
            console.error(`[SettingsState] Error getting setting ${category}:`, error);
            return schema.default;
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
                localStorage.setItem(storageKey, JSON.stringify(value));

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
                    settings[settingKey] = value != null ? JSON.parse(value) : null;
                } catch {
                    settings[settingKey] = value;
                }
            }
        }

        return settings;
    }

    /**
     * Reset settings to defaults
     * @param {string} category - Category to reset (optional, resets all if not provided)
     */
    /**
     * Reset settings (single category or all)
     * @param {SettingCategory|null} [category=null]
     * @returns {boolean}
     */
    resetSettings(category = null) {
        try {
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
                    keysToRemove.forEach((key) => localStorage.removeItem(key));
                } else {
                    localStorage.removeItem(schema.key);
                }

                // Update state
                setState(`settings.${category}`, schema.default, {
                    source: "SettingsStateManager.resetSettings",
                });
            } else {
                // Reset all settings
                Object.keys(SETTINGS_SCHEMA).forEach((cat) => {
                    this.resetSettings(/** @type {SettingCategory} */ (cat));
                });
            }

            setState("settings.lastModified", Date.now(), {
                source: "SettingsStateManager.resetSettings",
            });

            showNotification(
                category ? `${category} settings reset to defaults` : "All settings reset to defaults",
                "success"
            );

            return true;
        } catch (error) {
            console.error("[SettingsState] Error resetting settings:", error);
            showNotification("Failed to reset settings", "error");
            return false;
        }
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

            Object.keys(SETTINGS_SCHEMA).forEach((category) => {
                const cat = /** @type {SettingCategory} */ (category);
                settings[cat] = this.getSetting(cat);
            });

            return {
                version: this.migrationVersion,
                timestamp: Date.now(),
                settings,
            };
        } catch (error) {
            console.error("[SettingsState] Error exporting settings:", error);
            return null;
        }
    }

    /**
     * Import settings from JSON
     * @param {Object} settingsData - Settings data to import
     * @returns {boolean} Success status
     */
    /**
     * Import settings from exported data
     * @param {any} settingsData
     * @returns {boolean}
     */
    importSettings(settingsData) {
        try {
            if (!settingsData || !settingsData.settings) {
                console.error("[SettingsState] Invalid settings data for import");
                return false;
            }

            // Validate and import each category
            Object.keys(settingsData.settings).forEach((category) => {
                const cat = /** @type {SettingCategory} */ (category);
                if (SETTINGS_SCHEMA[cat]) {
                    this.setSetting(cat, settingsData.settings[category]);
                }
            });

            showNotification("Settings imported successfully", "success");
            return true;
        } catch (error) {
            console.error("[SettingsState] Error importing settings:", error);
            showNotification("Failed to import settings", "error");
            return false;
        }
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
        window.addEventListener("storage", (event) => {
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
            Object.keys(SETTINGS_SCHEMA).forEach((category) => {
                const cat = /** @type {SettingCategory} */ (category),
                    currentValue = this.getSetting(cat);
                setState(`settings.${category}`, currentValue, {
                    source: "SettingsStateManager.syncFromLocalStorage",
                });
            });

            setState("settings.lastModified", Date.now(), {
                source: "SettingsStateManager.syncFromLocalStorage",
            });
        } catch (error) {
            console.error("[SettingsState] Error syncing from localStorage:", error);
        }
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
}

// Create and export global settings state manager
export const settingsStateManager = new SettingsStateManager();

/**
 * Convenience functions for common settings operations
 */

/**
 * Get theme setting
 * @returns {string} Current theme
 */
export function getThemeSetting() {
    return /** @type {string} */ (settingsStateManager.getSetting("theme"));
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
 * Get map theme setting
 * @returns {boolean} Map theme inverted state
 */
export function getMapThemeSetting() {
    return /** @type {boolean} */ (settingsStateManager.getSetting("mapTheme"));
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
 * Get chart setting
 * @param {string} key - Chart setting key
 * @returns {*} Chart setting value
 */
/** @param {string} key */
export function getChartSetting(key) {
    return settingsStateManager.getSetting("chart", key);
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
 * Reset all chart settings
 */
export function resetChartSettings() {
    return settingsStateManager.resetSettings("chart");
}

/**
 * Export all settings
 * @returns {Object} Settings export data
 */
/** @returns {ExportedSettings|null} */
export function exportAllSettings() {
    return settingsStateManager.exportSettings();
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
