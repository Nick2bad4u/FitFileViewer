import { formatManufacturer } from "./formatManufacturer.js";
import { formatProduct } from "./formatProduct.js";

/**
 * Sensor name formatting configuration
 * @readonly
 */
const SENSOR_FORMAT_CONFIG = {
    FALLBACK_NAME: "Unknown Sensor",
    WORD_SEPARATOR: "_",
    FORMATTED_SEPARATOR: " ",
    NAME_SEPARATOR: " ",
    ERROR_MESSAGES: {
        INVALID_SENSOR: "Invalid sensor object provided:",
        FORMATTING_ERROR: "Error formatting sensor name:",
    },
};

/**
 * Formats sensor names for consistent display across the application
 *
 * Uses multiple formatting strategies depending on available sensor data:
 * 1. Manufacturer + Product combination (preferred)
 * 2. Garmin product name formatting
 * 3. Manufacturer name only
 * 4. Fallback to unknown sensor
 *
 * @param {Object} sensor - Sensor device info object
 * @param {string|number} [sensor.manufacturer] - Manufacturer ID or name
 * @param {string|number} [sensor.product] - Product ID
 * @param {string} [sensor.garminProduct] - Garmin-specific product identifier
 * @returns {string} Formatted sensor name
 * @throws {TypeError} If sensor is not an object
 * @example
 * // Format with manufacturer and product
 * const sensor1 = formatSensorName({
 *   manufacturer: "garmin",
 *   product: 1735
 * }); // "Garmin Edge 520"
 *
 * // Format with Garmin product only
 * const sensor2 = formatSensorName({
 *   garminProduct: "edge_520_plus"
 * }); // "Edge 520 Plus"
 *
 * // Format with manufacturer only
 * const sensor3 = formatSensorName({
 *   manufacturer: "wahoo"
 * }); // "Wahoo"
 */
export function formatSensorName(sensor) {
    // Input validation
    if (!sensor || typeof sensor !== "object") {
        console.warn(`[formatSensorName] ${SENSOR_FORMAT_CONFIG.ERROR_MESSAGES.INVALID_SENSOR}`, sensor);
        return SENSOR_FORMAT_CONFIG.FALLBACK_NAME;
    }

    try {
        // Strategy 1: Manufacturer + Product combination (preferred)
        if (hasManufacturerAndProduct(sensor)) {
            return formatManufacturerProduct(sensor);
        }

        // Strategy 2: Garmin product name formatting
        if (sensor.garminProduct) {
            return formatGarminProduct(sensor.garminProduct);
        }

        // Strategy 3: Manufacturer name only
        if (sensor.manufacturer) {
            return formatManufacturer(sensor.manufacturer);
        }

        // Strategy 4: Fallback
        return SENSOR_FORMAT_CONFIG.FALLBACK_NAME;
    } catch (error) {
        console.error(`[formatSensorName] ${SENSOR_FORMAT_CONFIG.ERROR_MESSAGES.FORMATTING_ERROR}`, error);
        return SENSOR_FORMAT_CONFIG.FALLBACK_NAME;
    }
}

/**
 * Checks if sensor has both manufacturer and product information
 * @param {Object} sensor - Sensor object to check
 * @returns {boolean} True if both manufacturer and product are available
 * @private
 */
function hasManufacturerAndProduct(sensor) {
    return (
        /** @type {any} */ (sensor).manufacturer !== null &&
        /** @type {any} */ (sensor).manufacturer !== undefined &&
        /** @type {any} */ (sensor).product !== null &&
        /** @type {any} */ (sensor).product !== undefined
    );
}

/**
 * Formats sensor name using manufacturer and product information
 * @param {Object} sensor - Sensor object with manufacturer and product
 * @returns {string} Formatted manufacturer + product name
 * @private
 */
function formatManufacturerProduct(sensor) {
    const manufacturerName = formatManufacturer(/** @type {any} */ (sensor).manufacturer),
     productName = formatProduct(/** @type {any} */ (sensor).manufacturer, /** @type {any} */ (sensor).product);

    // Avoid duplication if product name already includes manufacturer
    if (productName.toLowerCase().includes(manufacturerName.toLowerCase())) {
        return productName;
    }

    return `${manufacturerName}${SENSOR_FORMAT_CONFIG.NAME_SEPARATOR}${productName}`;
}

/**
 * Formats Garmin product names from snake_case to human-readable format
 * @param {string} garminProduct - Garmin product identifier
 * @returns {string} Formatted Garmin product name
 * @private
 */
function formatGarminProduct(garminProduct) {
    // Ensure garminProduct is a string before formatting
    const garminProductStr = String(garminProduct);

    return garminProductStr
        .split(SENSOR_FORMAT_CONFIG.WORD_SEPARATOR)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(SENSOR_FORMAT_CONFIG.FORMATTED_SEPARATOR);
}
