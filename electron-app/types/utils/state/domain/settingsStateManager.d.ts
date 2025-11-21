/**
 * Convenience functions for common settings operations
 */
/**
 * Export all settings
 * @returns {Object} Settings export data
 */
/** @returns {ExportedSettings|null} */
export function exportAllSettings(): ExportedSettings | null;
/**
 * Get chart setting
 * @param {string} key - Chart setting key
 * @returns {*} Chart setting value
 */
/** @param {string} key */
export function getChartSetting(key: string): any;
/**
 * Get map theme setting
 * @returns {boolean} Map theme inverted state
 */
export function getMapThemeSetting(): boolean;
/**
 * Get theme setting
 * @returns {string} Current theme
 */
export function getThemeSetting(): string;
/**
 * Import settings from data
 * @param {Object} settingsData - Settings data to import
 * @returns {boolean} Success status
 */
/** @param {any} settingsData */
export function importAllSettings(settingsData: any): boolean;
/**
 * Reset all chart settings
 */
export function resetChartSettings(): boolean;
/**
 * Set chart setting
 * @param {string} key - Chart setting key
 * @param {*} value - Chart setting value
 */
/** @param {string} key @param {any} value */
export function setChartSetting(key: string, value: any): boolean;
/**
 * Set map theme setting
 * @param {boolean} inverted - Map theme inverted state
 */
/** @param {boolean} inverted */
export function setMapThemeSetting(inverted: boolean): boolean;
/**
 * Set theme setting
 * @param {string} theme - Theme to set
 */
/** @param {string} theme */
export function setThemeSetting(theme: string): boolean;
export const settingsStateManager: SettingsStateManager;
export type SettingCategory = "theme" | "mapTheme" | "chart" | "ui" | "export" | "units";
export type SettingSchema = {
    key: string;
    default: any;
    validate: (value: any) => boolean;
    type: "string" | "boolean" | "object" | "number";
};
export type ExportedSettings = {
    version: string;
    timestamp: number;
    settings: Record<string, any>;
};
/**
 * Settings State Manager Class
 */
declare class SettingsStateManager {
    initialized: boolean;
    /** @type {Promise<void>|null} */
    initializePromise: Promise<void> | null;
    subscribers: Map<any, any>;
    migrationVersion: string;
    /**
     * Clean up resources
     */
    /**
     * Cleanup resources (currently minimal)
     */
    cleanup(): void;
    /**
     * Export settings to JSON
     * @returns {Object} Settings export object
     */
    /**
     * Export all settings and metadata
     * @returns {ExportedSettings|null}
     */
    exportSettings(): ExportedSettings | null;
    /**
     * Get all chart settings
     * @returns {Object} Chart settings object
     */
    /**
     * Return all chart (chartjs_) settings as object
     * @returns {Record<string, any>}
     */
    getChartSettings(): Record<string, any>;
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
    getSetting(category: SettingCategory, key?: string | null): any;
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
    importSettings(settingsData: any): boolean;
    /**
     * Initialize the settings state manager
     */
    initialize(): Promise<void>;
    /**
     * Migrate from legacy settings format
     */
    /**
     * Initial legacy migration (idempotent)
     */
    migrateFromLegacy(): Promise<void>;
    /**
     * Migrate old settings to new format
     */
    /**
     * Perform migrations if required
     */
    migrateSettings(): Promise<void>;
    /**
     * Reset settings to defaults
     * @param {string} category - Category to reset (optional, resets all if not provided)
     */
    /**
     * Reset settings (single category or all)
     * @param {SettingCategory|null} [category=null]
     * @returns {boolean}
     */
    resetSettings(category?: SettingCategory | null): boolean;
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
    setSetting(category: SettingCategory, value: any, key?: string | null): boolean;
    /**
     * Set up synchronization between state and localStorage
     */
    /**
     * Wire listeners for cross-tab storage changes
     */
    setupLocalStorageSync(): void;
    /**
     * Sync state from localStorage (for external changes)
     */
    /**
     * Sync state from localStorage after external changes
     */
    syncFromLocalStorage(): void;
}
export {};
//# sourceMappingURL=settingsStateManager.d.ts.map
