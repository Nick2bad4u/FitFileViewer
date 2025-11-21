/**
 * Gets all available field colors as an object
 * @returns {Object} Object containing all field color mappings
 * @example
 * // Get all available colors
 * const allColors = getAllFieldColors();
 */
export function getAllFieldColors(): Object;
/**
 * Gets the standardized color for a given field type
 *
 * Provides consistent color mapping for chart visualizations and data displays.
 * Returns a default gray color for unmapped field types.
 *
 * @param {string} field - The field name to get color for
 * @returns {string} Hex color code for the field
 * @throws {TypeError} If field is not a string
 * @example
 * // Get color for heart rate data
 * const heartRateColor = getFieldColor("heartRate"); // "#EF4444"
 *
 * // Get color for unknown field
 * const unknownColor = getFieldColor("unknownField"); // "#6B7280"
 */
export function getFieldColor(field: string): string;
/**
 * Checks if a field has a defined color mapping
 * @param {string} field - The field name to check
 * @returns {boolean} True if field has a defined color
 * @example
 * // Check if field has color mapping
 * const hasColor = hasFieldColor("heartRate"); // true
 */
export function hasFieldColor(field: string): boolean;
//# sourceMappingURL=getFieldColor.d.ts.map
