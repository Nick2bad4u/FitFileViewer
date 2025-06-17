import { getProductName, getManufacturerIdFromName } from "./formatAntNames.js";

/**
 * Formats product names for display
 * @param {number|string} manufacturer - Manufacturer ID or name
 * @param {number|string} productId - Product ID
 * @returns {string} Formatted product name
 */
export function formatProduct(manufacturer, productId) {
    try {
        // Handle cases where manufacturer might be null, undefined, or empty
        if (!manufacturer && manufacturer !== 0) {
            return productId?.toString() || "Unknown Product";
        }

        // Convert manufacturer name to ID if needed
        let manufacturerId = manufacturer;

        // If manufacturer is a string (not a numeric string), try to get ID from name
        if (typeof manufacturer === "string" && isNaN(Number(manufacturer))) {
            manufacturerId = getManufacturerIdFromName(manufacturer);
            if (!manufacturerId && manufacturerId !== 0) {
                // If we can't find the manufacturer ID, return the original product ID
                return productId?.toString() || "Unknown Product";
            }
        }

        // Ensure we have a valid product ID
        if (!productId && productId !== 0) {
            return "Unknown Product";
        } // Get the product name from the mapping
        const productName = getProductName(manufacturerId, productId);

        // If we found a mapped name and it's different from the original product ID, format it nicely
        if (productName && productName !== productId && typeof productName === "string") {
            // Convert snake_case to human-readable format
            return productName
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        }

        // If no mapping found, return the original product ID as string
        return productId?.toString() || "Unknown Product";
    } catch (error) {
        console.error("[formatProduct] Error formatting product:", error);
        return productId?.toString() || "Unknown Product";
    }
}
