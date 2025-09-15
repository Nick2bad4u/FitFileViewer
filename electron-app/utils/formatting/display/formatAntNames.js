/**
 * Manufacturer and Product ID mappings for FIT files
 * Based on the Garmin FIT SDK and community-maintained lists
 */

import { dataAntManufacturerIDs } from "../../data/lookups/dataAntManufacturerIDs.js";
import { dataAntProductIds } from "../../data/lookups/dataAntProductIds.js";

/**
 * Get manufacturer name from ID
 * @param {number|string} manufacturerId - Manufacturer ID
 * @returns {string} Manufacturer name or original value if not found
 */
export function getManufacturerName(manufacturerId) {
    const id = typeof manufacturerId === "string" ? parseInt(manufacturerId, 10) : manufacturerId;
    return /** @type {any} */ (dataAntManufacturerIDs)[id] || manufacturerId;
}

/**
 * Get product name from manufacturer ID and product ID
 * @param {number|string} manufacturerId - Manufacturer ID
 * @param {number|string} productId - Product ID
 * @returns {string} Product name or original product ID if not found
 */
export function getProductName(manufacturerId, productId) {
    const mfgId = typeof manufacturerId === "string" ? parseInt(manufacturerId, 10) : manufacturerId,
        prodId = typeof productId === "string" ? parseInt(productId, 10) : productId,
        manufacturerProducts = /** @type {any} */ (dataAntProductIds)[mfgId];
    if (manufacturerProducts && manufacturerProducts[prodId]) {
        return manufacturerProducts[prodId];
    }

    return /** @type {string} */ (productId);
}

/**
 * Get both manufacturer and product names from IDs
 * @param {number|string} manufacturerId - Manufacturer ID
 * @param {number|string|null} productId - Product ID (optional)
 * @returns {Object} Object with manufacturerName and productName
 */
export function getManufacturerAndProduct(manufacturerId, productId = /** @type {string|number|null} */ (null)) {
    const manufacturerName = getManufacturerName(manufacturerId),
        productName = productId !== null ? getProductName(manufacturerId, productId) : null;

    return {
        manufacturerName,
        productName,
    };
}

/**
 * Get manufacturer ID from manufacturer name (reverse lookup)
 * @param {string} manufacturerName - Manufacturer name (e.g., "faveroElectronics", "garmin")
 * @returns {number|null} Manufacturer ID or null if not found
 */
export function getManufacturerIdFromName(manufacturerName) {
    if (!manufacturerName || typeof manufacturerName !== "string") {
        return null;
    }

    // Normalize the manufacturer name for comparison
    const normalizedInput = manufacturerName.toLowerCase(),
        // Create common variations to check
        variations = [
            normalizedInput,
            normalizedInput.replace(/([A-Z])/g, "_$1").toLowerCase(), // CamelCase to snake_case
            normalizedInput.replace(/_/g, ""), // Remove underscores
            normalizedInput.replace(/electronics/g, "_electronics"), // Add underscore before electronics
            normalizedInput.replace(/electronics/g, "electronics"), // Ensure electronics is present
        ];

    // Search through all manufacturer IDs to find a match
    for (const [id, name] of Object.entries(dataAntManufacturerIDs)) {
        const normalizedName = name.toLowerCase();

        // Check if any variation matches
        if (variations.includes(normalizedName)) {
            return parseInt(id, 10);
        }

        // Also check common variations of the stored name
        const nameVariations = [
            normalizedName,
            normalizedName.replace(/_/g, ""), // Remove underscores from stored name
            normalizedName.replace(/_electronics/, "electronics"), // Remove underscore before electronics
        ];

        if (nameVariations.includes(normalizedInput)) {
            return parseInt(id, 10);
        }
    }

    return null;
}
