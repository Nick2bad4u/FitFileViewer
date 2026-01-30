/**
 * Formats product names for consistent display across the application
 *
 * Handles manufacturer ID/name conversion, product name lookup from ANT+
 * database, and formatting of product names from snake_case to human-readable
 * format. Provides graceful fallback handling for missing or invalid data.
 *
 * @example
 *     // Format with manufacturer ID and product ID
 *     const product1 = formatProduct(1, 1735); // "Edge 520"
 *
 *     // Format with manufacturer name and product ID
 *     const product2 = formatProduct("garmin", 1735); // "Edge 520"
 *
 *     // Handle unknown product
 *     const product3 = formatProduct(999, 999); // "999"
 *
 * @param {number | string} manufacturer - Manufacturer ID or name
 * @param {number | string} productId - Product ID
 *
 * @returns {string} Formatted product name
 */
export function formatProduct(
    manufacturer: number | string,
    productId: number | string
): string;
