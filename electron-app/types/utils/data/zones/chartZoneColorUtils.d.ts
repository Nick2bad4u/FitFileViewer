/**
 * Applies zone colors to zone data objects
 * @param {ZoneData[]} zoneData - Array of zone data objects
 * @param {string} zoneType - "hr" or "power"
 * @returns {ZoneData[]} Zone data with color property set
 */
export function applyZoneColors(zoneData: ZoneData[], zoneType: string): ZoneData[];
/**
 * Gets the saved color for a specific zone and chart type or returns default
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut", "power_lap_zone_stacked")
 * @param {number} zoneIndex - 0-based zone index
 * @returns {string} Hex color code
 */
export function getChartSpecificZoneColor(chartField: string, zoneIndex: number): string;
/**
 * Gets an array of colors for all zones of a specific chart type
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut", "power_lap_zone_stacked")
 * @param {number} zoneCount - Number of zones
 * @returns {string[]} Array of hex color codes
 */
export function getChartSpecificZoneColors(chartField: string, zoneCount: number): string[];
/**
 * Gets zone colors for chart rendering based on color scheme
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @param {string} colorScheme - "classic", "vibrant", "monochrome", or "custom"
 * @returns {string[]} Array of colors for chart use
 */
export function getChartZoneColors(zoneType: string, zoneCount: number, colorScheme?: string): string[];
/**
 * Gets all predefined color schemes
 * @returns {Object} Object containing all color schemes
 */
export function getColorSchemes(): Object;
/**
 * Gets colors for display in the color picker UI based on the selected scheme
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @param {string} colorScheme - "classic", "vibrant", "monochrome", or "custom"
 * @returns {string[]} Array of colors for UI display
 */
export function getDisplayZoneColors(zoneType: string, zoneCount: number, colorScheme?: string): string[];
/**
 * Gets the saved color for a specific zone or returns default
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneIndex - 0-based zone index
 * @returns {string} Hex color code
 */
export function getZoneColor(zoneType: string, zoneIndex: number): string;
/**
 * Gets an array of colors for all zones of a given type
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones
 * @returns {string[]} Array of hex color codes
 */
export function getZoneColors(zoneType: string, zoneCount: number): string[];
/**
 * Determines zone type from field name
 * @param {string} field - Field name (e.g., zone chart identifiers)
 * @returns {string|null} "hr", "power", or null if not a zone field
 */
export function getZoneTypeFromField(field: string): string | null;
/**
 * Checks if a chart field has custom colors set
 * @param {string} chartField - Full chart field name
 * @param {number} zoneCount - Number of zones
 * @returns {boolean} True if any custom colors are set
 */
export function hasChartSpecificColors(chartField: string, zoneCount: number): boolean;
/**
 * Resets all zone colors for a specific chart type to defaults
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut", "power_lap_zone_stacked")
 * @param {number} zoneCount - Number of zones to reset
 */
export function resetChartSpecificZoneColors(chartField: string, zoneCount: number): void;
/**
 * Resets all zone colors to defaults
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneCount - Number of zones to reset
 */
export function resetZoneColors(zoneType: string, zoneCount: number): void;
/**
 * Saves a zone color for a specific chart type to localStorage
 * @param {string} chartField - Full chart field name (e.g., "hr_zone_doughnut", "power_lap_zone_stacked")
 * @param {number} zoneIndex - 0-based zone index
 * @param {string} color - Hex color code
 */
export function saveChartSpecificZoneColor(chartField: string, zoneIndex: number, color: string): void;
/**
 * Saves a zone color to localStorage
 * @param {string} zoneType - "hr" or "power"
 * @param {number} zoneIndex - 0-based zone index
 * @param {string} color - Hex color code
 */
export function saveZoneColor(zoneType: string, zoneIndex: number, color: string): void;
export function clearCachedChartZoneColor(chartField: any, zoneIndex: any): void;
export function clearCachedZoneColor(zoneType: any, zoneIndex: any): void;
export function clearCachedZoneColors(field: any, zoneCount: any): void;
/**
 * Default zone colors for Heart Rate zones
 */
export const DEFAULT_HR_ZONE_COLORS: string[];
/**
 * Default zone colors for Power zones, based on Coggan's levels
 * https://www.trainingpeaks.com/learn/articles/power-training-levels/
 */
export const DEFAULT_POWER_ZONE_COLORS: string[];
export type ZoneData = {
    /**
     * - 1-based zone number
     */
    zone?: number;
    /**
     * - Hex color code
     */
    color?: string;
    /**
     * - Zone display label
     */
    label?: string;
    /**
     * - Time spent in zone (seconds)
     */
    time?: number;
    /**
     * - Zone value/percentage
     */
    value?: number;
};
export type ThemeConfig = Record<string, any>;
export type ColorSchemes = Record<string, Record<string, string[]>>;
//# sourceMappingURL=chartZoneColorUtils.d.ts.map
