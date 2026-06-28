import { settingsStateManager as settingsStateManagerImpl } from "./settingsStateCore.js";
import {
    getChartSettings as getChartSettingsImpl,
    getUserChartSettings as getUserChartSettingsImpl,
    resetChartSettings as resetChartSettingsImpl,
    setChartSetting as setChartSettingImpl,
    setMapThemeSetting as setMapThemeSettingImpl,
    setPowerEstimationSetting as setPowerEstimationSettingImpl,
    setThemeSetting as setThemeSettingImpl,
    subscribeToChartSettings as subscribeToChartSettingsImpl,
    updateChartSettings as updateChartSettingsImpl,
} from "./settingsStateHelpers.js";

/**
 * Visibility state for a chart field.
 */
export type ChartFieldVisibility = "hidden" | "visible";

/**
 * Per-field visibility preferences stored in chart settings.
 */
export type ChartFieldVisibilityMap = Record<string, ChartFieldVisibility>;

/**
 * Chart settings exposed by the legacy settings manager boundary.
 */
export interface ChartSettings {
    readonly fieldVisibility?: ChartFieldVisibilityMap;
    readonly [key: string]: unknown;
}

/**
 * Serialized settings export payload.
 */
export interface ExportedSettings {
    readonly settings: Record<string, unknown>;
    readonly timestamp: number;
    readonly version: string;
}

/**
 * Public shape of the legacy settings state manager singleton.
 */
export interface SettingsStateManager {
    exportSettings(): ExportedSettings | null;
    getSetting(category: string, key?: string): unknown;
    importSettings(settingsData: unknown): boolean;
    resetSettings(category: string, options?: Record<string, unknown>): unknown;
    setSetting(category: string, value: unknown, key?: string): unknown;
}

/**
 * Legacy settings state manager singleton.
 */
export const settingsStateManager =
    settingsStateManagerImpl as SettingsStateManager;

/**
 * Read a chart field visibility preference.
 */


/**
 * Read a chart setting value.
 */


/**
 * Read the current chart settings object.
 */
export const getChartSettings = getChartSettingsImpl as () => ChartSettings;

/**
 * Read the persisted map-theme inversion preference.
 */


/**
 * Read a power-estimation setting.
 */


/**
 * Read the persisted application theme preference.
 */


/**
 * Read chart settings customized by the user.
 */
export const getUserChartSettings =
    getUserChartSettingsImpl as () => ChartSettings;

/**
 * Import a serialized settings payload.
 */


/**
 * Remove a chart setting.
 */


/**
 * Reset chart settings, optionally scoped by reset options.
 */
export const resetChartSettings = resetChartSettingsImpl as (
    options?: Record<string, unknown>
) => unknown;

/**
 * Persist a chart field visibility preference.
 */


/**
 * Persist a chart setting value.
 */
export const setChartSetting = setChartSettingImpl as (
    key: string,
    value: unknown
) => unknown;

/**
 * Persist the map-theme inversion preference.
 */
export const setMapThemeSetting = setMapThemeSettingImpl as (
    inverted: boolean
) => unknown;

/**
 * Persist a power-estimation setting.
 */
export const setPowerEstimationSetting = setPowerEstimationSettingImpl as (
    key: string,
    value: unknown
) => unknown;

/**
 * Persist the application theme preference.
 */
export const setThemeSetting = setThemeSettingImpl as (
    theme: string
) => unknown;

/**
 * Subscribe to chart settings changes.
 */
export const subscribeToChartSettings = subscribeToChartSettingsImpl as (
    callback: (
        nextSettings: ChartSettings,
        previousSettings: ChartSettings
    ) => void
) => () => void;

/**
 * Merge partial chart settings into the current chart settings state.
 */
export const updateChartSettings = updateChartSettingsImpl as (
    updates: ChartSettings
) => ChartSettings;

export {
    clearCachedChartSettings,
    exportAllSettings,
    getCachedChartSettings,
    getChartFieldVisibility,
    getChartSetting,
    getMapThemeSetting,
    getPowerEstimationSetting,
    getThemeSetting,
    importAllSettings,
    removeChartSetting,
    setCachedChartSettings,
    setChartFieldVisibility,
    updateCachedChartSettings,
} from "./settingsStateHelpers.js";
