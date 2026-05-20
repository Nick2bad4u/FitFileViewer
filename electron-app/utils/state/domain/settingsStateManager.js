import { settingsStateManager as settingsStateManagerImpl } from "./settingsStateCore.js";
import { exportAllSettings as exportAllSettingsImpl, getChartFieldVisibility as getChartFieldVisibilityImpl, getChartSetting as getChartSettingImpl, getChartSettings as getChartSettingsImpl, getMapThemeSetting as getMapThemeSettingImpl, getPowerEstimationSetting as getPowerEstimationSettingImpl, getThemeSetting as getThemeSettingImpl, getUserChartSettings as getUserChartSettingsImpl, importAllSettings as importAllSettingsImpl, removeChartSetting as removeChartSettingImpl, resetChartSettings as resetChartSettingsImpl, setChartFieldVisibility as setChartFieldVisibilityImpl, setChartSetting as setChartSettingImpl, setMapThemeSetting as setMapThemeSettingImpl, setPowerEstimationSetting as setPowerEstimationSettingImpl, setThemeSetting as setThemeSettingImpl, subscribeToChartSettings as subscribeToChartSettingsImpl, updateChartSettings as updateChartSettingsImpl, } from "./settingsStateHelpers.js";
/**
 * Legacy settings state manager singleton.
 */
export const settingsStateManager = settingsStateManagerImpl;
/**
 * Export all persisted settings into a serializable payload.
 */
export const exportAllSettings = exportAllSettingsImpl;
/**
 * Read a chart field visibility preference.
 */
export const getChartFieldVisibility = getChartFieldVisibilityImpl;
/**
 * Read a chart setting value.
 */
export const getChartSetting = getChartSettingImpl;
/**
 * Read the current chart settings object.
 */
export const getChartSettings = getChartSettingsImpl;
/**
 * Read the persisted map-theme inversion preference.
 */
export const getMapThemeSetting = getMapThemeSettingImpl;
/**
 * Read a power-estimation setting.
 */
export const getPowerEstimationSetting = getPowerEstimationSettingImpl;
/**
 * Read the persisted application theme preference.
 */
export const getThemeSetting = getThemeSettingImpl;
/**
 * Read chart settings customized by the user.
 */
export const getUserChartSettings = getUserChartSettingsImpl;
/**
 * Import a serialized settings payload.
 */
export const importAllSettings = importAllSettingsImpl;
/**
 * Remove a chart setting.
 */
export const removeChartSetting = removeChartSettingImpl;
/**
 * Reset chart settings, optionally scoped by reset options.
 */
export const resetChartSettings = resetChartSettingsImpl;
/**
 * Persist a chart field visibility preference.
 */
export const setChartFieldVisibility = setChartFieldVisibilityImpl;
/**
 * Persist a chart setting value.
 */
export const setChartSetting = setChartSettingImpl;
/**
 * Persist the map-theme inversion preference.
 */
export const setMapThemeSetting = setMapThemeSettingImpl;
/**
 * Persist a power-estimation setting.
 */
export const setPowerEstimationSetting = setPowerEstimationSettingImpl;
/**
 * Persist the application theme preference.
 */
export const setThemeSetting = setThemeSettingImpl;
/**
 * Subscribe to chart settings changes.
 */
export const subscribeToChartSettings = subscribeToChartSettingsImpl;
/**
 * Merge partial chart settings into the current chart settings state.
 */
export const updateChartSettings = updateChartSettingsImpl;
