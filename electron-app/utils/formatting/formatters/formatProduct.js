import {
    getManufacturerIdFromName,
    getProductName,
} from "../display/formatAntNames.js";

/**
 * Product formatting configuration and constants
 *
 * @readonly
 */
const PRODUCT_FORMAT_CONFIG = {
    ERROR_MESSAGES: {
        FORMATTING_ERROR: "Error formatting product:",
        MANUFACTURER_LOOKUP_ERROR: "Error looking up manufacturer ID:",
        PRODUCT_LOOKUP_ERROR: "Error looking up product name:",
    },
    FALLBACK_PRODUCT_NAME: "Unknown Product",
    FORMATTED_SEPARATOR: " ",
    WORD_SEPARATOR: "_",
};

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
export function formatProduct(manufacturer, productId) {
    try {
        // Validate inputs
        if (!isValidManufacturer(manufacturer)) {
            return formatFallbackProduct(productId);
        }

        if (!isValidProductId(productId)) {
            return PRODUCT_FORMAT_CONFIG.FALLBACK_PRODUCT_NAME;
        }

        // Convert manufacturer to ID if needed
        const manufacturerId = resolveManufacturerId(manufacturer);
        if (manufacturerId === null) {
            return formatFallbackProduct(productId);
        }

        // Get formatted product name
        return getFormattedProductName(manufacturerId, productId);
    } catch (error) {
        console.error(
            `[formatProduct] ${PRODUCT_FORMAT_CONFIG.ERROR_MESSAGES.FORMATTING_ERROR}`,
            error
        );
        return formatFallbackProduct(productId);
    }
}

/**
 * Formats fallback product name when lookup fails
 *
 * @private
 *
 * @param {number | string} productId - Original product ID
 *
 * @returns {string} Fallback product name
 */
function formatFallbackProduct(productId) {
    if (productId === null || productId === undefined) {
        return PRODUCT_FORMAT_CONFIG.FALLBACK_PRODUCT_NAME;
    }
    const str = String(productId);
    if (str.length === 0) {
        return PRODUCT_FORMAT_CONFIG.FALLBACK_PRODUCT_NAME;
    }
    const lower = str.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Formats product name string from snake_case to human-readable format
 *
 * @private
 *
 * @param {string} productName - Raw product name from database
 *
 * @returns {string} Formatted product name
 */
function formatProductNameString(productName) {
    return productName
        .split(PRODUCT_FORMAT_CONFIG.WORD_SEPARATOR)
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(PRODUCT_FORMAT_CONFIG.FORMATTED_SEPARATOR);
}

/**
 * Gets and formats the product name from the ANT+ database
 *
 * @private
 *
 * @param {number} manufacturerId - Manufacturer ID
 * @param {number | string} productId - Product ID
 *
 * @returns {string} Formatted product name
 */
function getFormattedProductName(manufacturerId, productId) {
    try {
        // Get the product name from the mapping
        const productName = getProductName(manufacturerId, productId);

        // If we found a mapped name and it's different from the original product ID, format it
        if (
            productName &&
            productName !== productId &&
            typeof productName === "string"
        ) {
            return formatProductNameString(productName);
        }

        // If no mapping found, return the original product ID as string
        return formatFallbackProduct(productId);
    } catch (error) {
        console.warn(
            `[formatProduct] ${PRODUCT_FORMAT_CONFIG.ERROR_MESSAGES.PRODUCT_LOOKUP_ERROR}`,
            error
        );
        return formatFallbackProduct(productId);
    }
}

/**
 * Validates if manufacturer value is usable
 *
 * @private
 *
 * @param {any} manufacturer - Manufacturer value to validate
 *
 * @returns {boolean} True if manufacturer is valid
 */
function isValidManufacturer(manufacturer) {
    return (
        manufacturer !== null &&
        manufacturer !== undefined &&
        manufacturer !== ""
    );
}

/**
 * Validates if product ID is usable
 *
 * @private
 *
 * @param {any} productId - Product ID to validate
 *
 * @returns {boolean} True if product ID is valid
 */
function isValidProductId(productId) {
    return (
        productId !== null &&
        productId !== undefined &&
        (productId !== "" || productId === 0)
    );
}

/**
 * Resolves manufacturer name to ID if needed
 *
 * @private
 *
 * @param {number | string} manufacturer - Manufacturer ID or name
 *
 * @returns {number | null} Manufacturer ID or null if not found
 */
function resolveManufacturerId(manufacturer) {
    try {
        // If already a number or numeric string, use as is
        if (typeof manufacturer === "number" || !isNaN(Number(manufacturer))) {
            return Number(manufacturer);
        }

        // If string (non-numeric), try to get ID from name
        if (typeof manufacturer === "string") {
            const manufacturerId = getManufacturerIdFromName(manufacturer);
            return manufacturerId !== null && manufacturerId !== undefined
                ? manufacturerId
                : null;
        }

        return null;
    } catch (error) {
        console.warn(
            `[formatProduct] ${PRODUCT_FORMAT_CONFIG.ERROR_MESSAGES.MANUFACTURER_LOOKUP_ERROR}`,
            error
        );
        return null;
    }
}
