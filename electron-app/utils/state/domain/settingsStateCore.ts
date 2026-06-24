/**
 * Settings State Manager Manages application settings with validation,
 * persistence, and change tracking
 */

import { showNotification } from "../../ui/notifications/showNotification.js";
import { getState, setState, subscribe } from "../core/stateManager.js";
import {
    SETTING_CATEGORIES,
    SETTINGS_SCHEMA,
    type SettingCategory,
    type SettingSchema,
} from "./settingsStateSchema.js";
import {
    getSettingsStateCoreRuntime,
    type SettingsStateCoreRuntime,
} from "./settingsStateCoreRuntime.js";

type SettingsSchemaMap = Record<SettingCategory, SettingSchema>;

interface ExportedSettings {
    settings: Record<string, unknown>;
    timestamp: number;
    version: string;
}

interface ResetSettingsOptions {
    silent?: boolean;
}

const settingsSchema = SETTINGS_SCHEMA as SettingsSchemaMap;

function settingsStateCoreRuntime(): SettingsStateCoreRuntime {
    return getSettingsStateCoreRuntime();
}

function getSettingsCategories(): SettingCategory[] {
    return [...SETTING_CATEGORIES];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getDefaultObjectValue(defaultValue: unknown, key: string): unknown {
    return isRecord(defaultValue) ? defaultValue[key] : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
    return isRecord(value) ? value : {};
}

function getSettingsStorage(): Storage | undefined {
    return settingsStateCoreRuntime().getLocalStorage();
}

/**
 * Settings State Manager Class
 */
class SettingsStateManager {
    initializePromise: Promise<void> | null = null;
    initialized = false;
    private readonly migrationVersion = "1.0.0";
    private storageSyncController: AbortController | undefined;
    private readonly subscribers = new Map<string, Set<unknown>>();

    /**
     * Cleanup resources (currently minimal)
     */
    cleanup(): void {
        console.log("[SettingsState] Cleaning up settings state manager...");
        this.storageSyncController?.abort();
        this.storageSyncController = undefined;
        this.subscribers.clear();
        this.initialized = false;
    }

    /**
     * Export all settings and metadata
     */
    exportSettings(): ExportedSettings | null {
        try {
            const settings: Record<string, unknown> = {};

            for (const category of getSettingsCategories()) {
                settings[category] = this.getSetting(category);
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
     * Return all chart (chartjs_) settings as object
     */
    getChartSettings(): Record<string, unknown> {
        const settings: Record<string, unknown> = {};
        const storage = getSettingsStorage();
        if (storage === undefined) {
            return settings;
        }

        // Get all chartjs_ prefixed settings
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith("chartjs_")) {
                const settingKey = key.replace("chartjs_", ""),
                    value = storage.getItem(key);

                try {
                    settings[settingKey] =
                        value == null ? null : JSON.parse(value);
                } catch {
                    settings[settingKey] = value;
                }
            }
        }

        return settings;
    }

    /**
     * Get a setting (entire category or specific key for object categories)
     */
    getSetting(category: SettingCategory, key: null | string = null): unknown {
        const schema = settingsSchema[category];
        if (!schema) {
            console.warn(
                `[SettingsState] Unknown setting category: ${category}`
            );
            return;
        }

        const storage = getSettingsStorage();
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
                        return schema.default &&
                            typeof schema.default === "object"
                            ? getDefaultObjectValue(schema.default, key)
                            : undefined;
                    }
                    try {
                        return JSON.parse(rawValue);
                    } catch {
                        return rawValue;
                    }
                }

                // Whole-category read
                const canIterate =
                    typeof storage.length === "number" &&
                    typeof storage.key === "function";
                if (!canIterate) {
                    return schema.default;
                }

                const settings: Record<string, unknown> = {};
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

                return Object.keys(settings).length > 0
                    ? { ...asRecord(schema.default), ...settings }
                    : schema.default;
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
            console.error(
                `[SettingsState] Error getting setting ${category}:`,
                error
            );
            return schema.default;
        }
    }

    /**
     * Import settings from an exported payload.
     *
     * The export format is produced by {@link exportSettings}.
     */
    importSettings(settingsData: unknown): boolean {
        try {
            if (!settingsData || typeof settingsData !== "object") {
                return false;
            }

            const payload = settingsData as {
                settings?: Record<string, unknown>;
            };
            const nextSettings = payload.settings;

            if (!nextSettings || typeof nextSettings !== "object") {
                return false;
            }

            let allOk = true;

            for (const [rawCategory, value] of Object.entries(nextSettings)) {
                const category = rawCategory as SettingCategory;
                if (!settingsSchema[category]) {
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
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }
        if (this.initializePromise) {
            return this.initializePromise;
        }

        this.initializePromise = (async () => {
            console.log(
                "[SettingsState] Initializing settings state manager..."
            );

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
                console.log(
                    "[SettingsState] Settings state manager initialized successfully"
                );
            } catch (error) {
                console.error(
                    "[SettingsState] Failed to initialize settings state manager:",
                    error
                );
                throw error;
            } finally {
                this.initializePromise = null;
            }
        })();

        return this.initializePromise;
    }

    /**
     * Initial legacy migration (idempotent)
     */
    async migrateFromLegacy(): Promise<void> {
        console.log("[SettingsState] Performing legacy settings migration...");

        const storage = getSettingsStorage();
        if (storage === undefined) {
            return;
        }

        // Migrate theme setting
        const oldTheme = storage.getItem("theme");
        if (oldTheme && !storage.getItem("ffv-theme")) {
            storage.setItem("ffv-theme", oldTheme);
            storage.removeItem("theme");
        }

        // No other legacy migrations needed currently
        // This method can be expanded for future migrations
    }

    /**
     * Perform migrations if required
     */
    async migrateSettings(): Promise<void> {
        try {
            const storage = getSettingsStorage();
            if (storage === undefined) {
                return;
            }

            const currentVersion = storage.getItem(
                "settings_migration_version"
            );

            if (currentVersion === this.migrationVersion) {
                console.log(
                    "[SettingsState] Settings already at current version"
                );
                return;
            }

            console.log(
                "[SettingsState] Migrating settings to version",
                this.migrationVersion
            );

            // Perform migrations based on current version
            if (!currentVersion) {
                // Initial migration - ensure all settings are properly structured
                await this.migrateFromLegacy();
            }

            // Set migration version
            storage.setItem(
                "settings_migration_version",
                this.migrationVersion
            );
            console.log("[SettingsState] Settings migration completed");
        } catch (error) {
            console.error(
                "[SettingsState] Error during settings migration:",
                error
            );
        }
    }

    /**
     * Reset settings (single category or all)
     */
    resetSettings(
        category: null | SettingCategory = null,
        options: ResetSettingsOptions = {}
    ): boolean {
        try {
            const { silent = false } = options || {};
            const storage = getSettingsStorage();
            if (storage === undefined) {
                return false;
            }

            if (category) {
                // Reset specific category
                const schema = settingsSchema[category];
                if (!schema) {
                    console.warn(
                        `[SettingsState] Unknown setting category: ${category}`
                    );
                    return false;
                }

                if (schema.type === "object") {
                    // Remove all keys with this prefix
                    const keysToRemove: string[] = [];
                    for (let i = 0; i < storage.length; i++) {
                        const key = storage.key(i);
                        if (key && key.startsWith(schema.key)) {
                            keysToRemove.push(key);
                        }
                    }
                    for (const key of keysToRemove) storage.removeItem(key);
                } else {
                    storage.removeItem(schema.key);
                }

                // Update state
                setState(`settings.${category}`, schema.default, {
                    source: "SettingsStateManager.resetSettings",
                });
            } else {
                // Reset all settings
                for (const cat of getSettingsCategories()) {
                    this.resetSettings(cat);
                }
            }

            setState("settings.lastModified", Date.now(), {
                source: "SettingsStateManager.resetSettings",
            });

            if (!silent) {
                showNotification(
                    category
                        ? `${category} settings reset to defaults`
                        : "All settings reset to defaults",
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
     * Set a setting value (entire category or specific key for object
     * categories)
     */
    setSetting(
        category: SettingCategory,
        value: unknown,
        key: null | string = null
    ): boolean {
        const schema = settingsSchema[category];
        if (!schema) {
            console.warn(
                `[SettingsState] Unknown setting category: ${category}`
            );
            return false;
        }

        try {
            const storage = getSettingsStorage();
            if (storage === undefined) {
                return false;
            }

            // Validate the value
            if (!schema.validate(value)) {
                console.error(
                    `[SettingsState] Invalid value for setting ${category}:`,
                    value
                );
                return false;
            }

            if (schema.type === "object" && key) {
                // Set specific object property
                const storageKey = schema.key + key;
                // Preserve legacy behavior for string settings:
                // historically these were stored as raw strings (e.g. "hidden"/"visible").
                // Writing JSON strings would add quotes and break direct localStorage comparisons.
                storage.setItem(
                    storageKey,
                    typeof value === "string" ? value : JSON.stringify(value)
                );

                // Update state
                const rootState = getState("settings"),
                    existingSettings = isRecord(rootState)
                        ? rootState[category]
                        : undefined,
                    currentSettings = isRecord(existingSettings)
                        ? { ...existingSettings }
                        : {};
                currentSettings[key] = value;
                setState(`settings.${category}`, currentSettings, {
                    source: "SettingsStateManager.setSetting",
                });
            } else {
                // Set entire setting
                storage.setItem(
                    schema.key,
                    schema.type === "boolean"
                        ? String(value)
                        : JSON.stringify(value)
                );

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
     * Wire listeners for cross-tab storage changes
     */
    setupLocalStorageSync(): void {
        // Subscribe to settings changes and update localStorage
        subscribe("settings", () => {
            // This will be called whenever settings state changes
            console.log(
                "[SettingsState] Settings state changed, localStorage already updated"
            );
        });

        // Listen for localStorage changes from other tabs/windows
        this.storageSyncController?.abort();
        this.storageSyncController =
            settingsStateCoreRuntime().createAbortController();

        settingsStateCoreRuntime().addStorageEventListener(
            (event) => {
                const k = event.key || ""; // Normalize for TS nullability
                if (
                    k &&
                    Object.values(settingsSchema).some((schema) =>
                        k.startsWith(schema.key)
                    )
                ) {
                    console.log(
                        "[SettingsState] External localStorage change detected:",
                        event.key
                    );

                    // Update state to reflect external changes
                    this.syncFromLocalStorage();
                }
            },
            this.storageSyncController.signal
        );
    }
    /**
     * Sync state from localStorage after external changes
     */
    syncFromLocalStorage(): void {
        try {
            for (const category of getSettingsCategories()) {
                const currentValue = this.getSetting(category);
                setState(`settings.${category}`, currentValue, {
                    source: "SettingsStateManager.syncFromLocalStorage",
                });
            }

            setState("settings.lastModified", Date.now(), {
                source: "SettingsStateManager.syncFromLocalStorage",
            });
        } catch (error) {
            console.error(
                "[SettingsState] Error syncing from localStorage:",
                error
            );
        }
    }
}

/**
 * Global settings state manager singleton.
 */
export const settingsStateManager = new SettingsStateManager();
