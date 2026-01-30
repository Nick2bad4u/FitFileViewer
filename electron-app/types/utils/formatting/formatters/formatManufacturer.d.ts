/**
 * Formats manufacturer names for consistent display across the application
 *
 * Handles both manufacturer IDs (numbers) and name strings. First attempts to
 * resolve numeric IDs using the ANT+ manufacturer database, then applies
 * consistent formatting using the manufacturer mapping table.
 *
 * @example
 *     // Format by name
 *     const name1 = formatManufacturer("garmin"); // "Garmin"
 *
 *     // Format by ID (if supported by ANT+ database)
 *     const name2 = formatManufacturer(1); // "Garmin" (if ID 1 maps to Garmin)
 *
 *     // Unknown manufacturer
 *     const name3 = formatManufacturer("unknown"); // "unknown"
 *
 * @param {string | number} manufacturer - Raw manufacturer name or ID
 *
 * @returns {string} Formatted manufacturer name
 */
export function formatManufacturer(manufacturer: string | number): string;
/**
 * Gets all available manufacturer mappings
 *
 * @example
 *     // Get all available manufacturer mappings
 *     const allManufacturers = getAllManufacturerMappings();
 *
 * @returns {Object} Copy of the manufacturer mapping object
 */
export function getAllManufacturerMappings(): Object;
/**
 * Checks if a manufacturer has a defined mapping
 *
 * @example
 *     // Check if manufacturer has mapping
 *     const hasMapping = hasManufacturerMapping("garmin"); // true
 *
 * @param {string} manufacturer - The manufacturer name to check
 *
 * @returns {boolean} True if manufacturer has a defined mapping
 */
export function hasManufacturerMapping(manufacturer: string): boolean;
