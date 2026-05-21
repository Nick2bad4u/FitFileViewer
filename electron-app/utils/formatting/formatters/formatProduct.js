import {
    getManufacturerIdFromName,
    getProductName,
} from "../display/formatAntNames.js";
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
 * Formats product names for consistent display across the application.
 *
 * @param manufacturer - Manufacturer ID or name.
 * @param productId - Product ID.
 *
 * @returns Formatted product name.
 */
export function formatProduct(manufacturer, productId) {
    try {
        if (!isValidManufacturer(manufacturer)) {
            return formatFallbackProduct(productId);
        }
        if (!isValidProductId(productId)) {
            return PRODUCT_FORMAT_CONFIG.FALLBACK_PRODUCT_NAME;
        }
        const manufacturerId = resolveManufacturerId(manufacturer);
        if (manufacturerId === null) {
            return formatFallbackProduct(productId);
        }
        return getFormattedProductName(manufacturerId, productId);
    } catch (error) {
        console.error(
            `[formatProduct] ${PRODUCT_FORMAT_CONFIG.ERROR_MESSAGES.FORMATTING_ERROR}`,
            error
        );
        return formatFallbackProduct(productId);
    }
}
function formatFallbackProduct(productId) {
    if (productId === null || productId === undefined) {
        return PRODUCT_FORMAT_CONFIG.FALLBACK_PRODUCT_NAME;
    }
    const value = String(productId);
    if (value.length === 0) {
        return PRODUCT_FORMAT_CONFIG.FALLBACK_PRODUCT_NAME;
    }
    const lower = value.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}
function formatProductNameString(productName) {
    return productName
        .split(PRODUCT_FORMAT_CONFIG.WORD_SEPARATOR)
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(PRODUCT_FORMAT_CONFIG.FORMATTED_SEPARATOR);
}
function getFormattedProductName(manufacturerId, productId) {
    try {
        const productName = getProductName(manufacturerId, productId);
        if (
            productName &&
            productName !== productId &&
            typeof productName === "string"
        ) {
            return formatProductNameString(productName);
        }
        return formatFallbackProduct(productId);
    } catch (error) {
        console.warn(
            `[formatProduct] ${PRODUCT_FORMAT_CONFIG.ERROR_MESSAGES.PRODUCT_LOOKUP_ERROR}`,
            error
        );
        return formatFallbackProduct(productId);
    }
}
function isValidManufacturer(manufacturer) {
    return (
        manufacturer !== null &&
        manufacturer !== undefined &&
        manufacturer !== ""
    );
}
function isValidProductId(productId) {
    if (productId === 0) {
        return true;
    }
    return productId !== null && productId !== undefined && productId !== "";
}
function resolveManufacturerId(manufacturer) {
    try {
        if (
            typeof manufacturer === "number" ||
            !Number.isNaN(Number(manufacturer))
        ) {
            return Number(manufacturer);
        }
        if (typeof manufacturer === "string") {
            const manufacturerId = getManufacturerIdFromName(manufacturer);
            return manufacturerId === null || manufacturerId === undefined
                ? null
                : manufacturerId;
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
