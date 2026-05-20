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
    fieldVisibility?: ChartFieldVisibilityMap;
    [key: string]: unknown;
}

/**
 * Serialized settings export payload.
 */
export interface ExportedSettings {
    settings: Record<string, unknown>;
    timestamp: number;
    version: string;
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
export const settingsStateManager: SettingsStateManager;

export function exportAllSettings(): ExportedSettings | null;
export function getChartFieldVisibility(
    fieldKey: string,
    defaultVisibility?: ChartFieldVisibility
): ChartFieldVisibility;
export function getChartSetting(key: string): unknown;
export function getChartSettings(): ChartSettings;
export function getMapThemeSetting(): boolean;
export function getPowerEstimationSetting(key: string): unknown;
export function getThemeSetting(): string;
export function getUserChartSettings(): ChartSettings;
export function importAllSettings(settingsData: unknown): boolean;
export function removeChartSetting(key: string): boolean;
export function resetChartSettings(options?: Record<string, unknown>): unknown;
export function setChartFieldVisibility(
    fieldKey: string,
    visibility: ChartFieldVisibility
): ChartFieldVisibilityMap;
export function setChartSetting(key: string, value: unknown): unknown;
export function setMapThemeSetting(inverted: boolean): unknown;
export function setPowerEstimationSetting(key: string, value: unknown): unknown;
export function setThemeSetting(theme: string): unknown;
export function subscribeToChartSettings(
    callback: (
        nextSettings: ChartSettings,
        previousSettings: ChartSettings
    ) => void
): () => void;
export function updateChartSettings(updates: ChartSettings): ChartSettings;
