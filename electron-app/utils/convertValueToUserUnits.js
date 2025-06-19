import { convertDistanceUnits, DISTANCE_UNITS } from "./convertDistanceUnits.js";
import { convertTemperatureUnits, TEMPERATURE_UNITS } from "./convertTemperatureUnits.js";

/**
 * User unit preference storage keys
 * @readonly
 */
const UNIT_STORAGE_KEYS = {
    DISTANCE: "chartjs_distanceUnits",
    TEMPERATURE: "chartjs_temperatureUnits",
};

/**
 * Field categorization for unit conversion
 * @readonly
 */
const FIELD_CATEGORIES = {
    DISTANCE: ["distance", "altitude", "enhancedAltitude"],
    TEMPERATURE: ["temperature"],
};

/**
 * Converts values according to user's preferred units based on field type
 * @param {number} value - Raw value to convert
 * @param {string} field - Field name that determines conversion type
 * @returns {number} Converted value in user's preferred units
 * @throws {TypeError} If value is not a number
 * @example
 * // Convert distance from meters to user preference (e.g., kilometers)
 * const convertedDistance = convertValueToUserUnits(1000, "distance");
 *
 * // Convert temperature from Celsius to user preference (e.g., Fahrenheit)
 * const convertedTemp = convertValueToUserUnits(25, "temperature");
 */
export function convertValueToUserUnits(value, field) {
    // Input validation
    if (typeof value !== "number" || isNaN(value)) {
        console.warn(`[convertValueToUserUnits] Invalid value for field '${field}':`, value);
        return value;
    }

    if (typeof field !== "string" || !field.trim()) {
        console.warn("[convertValueToUserUnits] Invalid field name:", field);
        return value;
    }

    try {
        // Distance-related fields (assuming input is in meters)
        // Note: Altitude and enhancedAltitude are treated as distance for unit conversion
        if (FIELD_CATEGORIES.DISTANCE.includes(field)) {
            const distanceUnits = localStorage.getItem(UNIT_STORAGE_KEYS.DISTANCE) || DISTANCE_UNITS.KILOMETERS;
            return convertDistanceUnits(value, distanceUnits);
        }

        // Temperature fields (assuming input is in Celsius)
        if (FIELD_CATEGORIES.TEMPERATURE.includes(field)) {
            const temperatureUnits = localStorage.getItem(UNIT_STORAGE_KEYS.TEMPERATURE) || TEMPERATURE_UNITS.CELSIUS;
            return convertTemperatureUnits(value, temperatureUnits);
        }

        // No conversion needed for other fields
        return value;
    } catch (error) {
        console.error(`[convertValueToUserUnits] Conversion failed for field '${field}':`, error);
        return value; // Return original value on error
    }
}
