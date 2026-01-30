/**
 * Quick data availability check
 */
export function checkDataAvailability(): any;
/**
 * Extracts and displays detailed sensor information from global data
 *
 * @returns {Object | null} Sensor analysis summary or null if no data
 */
export function debugSensorInfo(): Object | null;
/**
 * Show all available data keys for debugging
 */
export function showDataKeys(): void;
/**
 * Quick command to show just the sensor names
 */
export function showSensorNames(): void;
/**
 * Test manufacturer ID resolution
 *
 * @param {number | string} manufacturerId - Manufacturer ID to test
 */
export function testManufacturerId(manufacturerId: number | string): {
    formatted: string;
    id: number;
    resolved: string;
};
/**
 * Test product ID resolution
 *
 * @param {number | string} manufacturerId - Manufacturer ID
 * @param {number | string} productId - Product ID to test
 */
export function testProductId(
    manufacturerId: number | string,
    productId: number | string
): {
    formattedProduct: string;
    manufacturerId: number;
    manufacturerName: string;
    productId: number;
    resolvedProduct: string;
};
