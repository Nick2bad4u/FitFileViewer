/**
 * Get both manufacturer and product names from IDs
 *
 * @param {number | string} manufacturerId - Manufacturer ID
 * @param {number | string | null} productId - Product ID (optional)
 *
 * @returns {Object} Object with manufacturerName and productName
 */
export function getManufacturerAndProduct(
    manufacturerId: number | string,
    productId?: number | string | null
): Object;
/**
 * Get manufacturer ID from manufacturer name (reverse lookup)
 *
 * @param {string} manufacturerName - Manufacturer name (e.g.,
 *   "faveroElectronics", "garmin")
 *
 * @returns {number | null} Manufacturer ID or null if not found
 */
export function getManufacturerIdFromName(
    manufacturerName: string
): number | null;
/**
 * Get manufacturer name from ID
 *
 * @param {number | string} manufacturerId - Manufacturer ID
 *
 * @returns {string} Manufacturer name or original value if not found
 */
export function getManufacturerName(manufacturerId: number | string): string;
/**
 * Get product name from manufacturer ID and product ID
 *
 * @param {number | string} manufacturerId - Manufacturer ID
 * @param {number | string} productId - Product ID
 *
 * @returns {string} Product name or original product ID if not found
 */
export function getProductName(
    manufacturerId: number | string,
    productId: number | string
): string;
