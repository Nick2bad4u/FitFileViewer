import { getProductName, getManufacturerIdFromName } from "./manufacturerIds.js";

/**
 * Formats product names for display
 * @param {number|string} manufacturer - Manufacturer ID or name
 * @param {number|string} productId - Product ID
 * @returns {string} Formatted product name
 */
export function formatProduct(manufacturer, productId) {
    // Convert manufacturer name to ID if needed
    let manufacturerId = manufacturer;
    if (typeof manufacturer === "string" && isNaN(manufacturer)) {
        manufacturerId = getManufacturerIdFromName(manufacturer);
        if (!manufacturerId) {
            // If we can't find the manufacturer ID, return the original product ID
            return productId;
        }
    }

    // Get the product name from the mapping
    const productName = getProductName(manufacturerId, productId);

    // If we found a mapped name, format it nicely
    if (productName !== productId) {
        // Convert snake_case to human-readable format
        return productName
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    // If no mapping found, return the original product ID
    return productId;
}
