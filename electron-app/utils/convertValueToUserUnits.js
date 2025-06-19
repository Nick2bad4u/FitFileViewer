import { convertDistanceUnits } from "./convertDistanceUnits.js";
import { convertTemperatureUnits } from "./convertTemperatureUnits.js";

/**
 * Formats value according to user's preferred units
 * @param {number} value - Raw value
 * @param {string} field - Field name
 * @returns {number} Converted value
 */
export function convertValueToUserUnits(value, field) {
    // Distance-related fields (assuming input is in meters)
    // Note: Altitude and enhancedAltitude are treated as distance for unit conversion (e.g., meters/feet)
    // If altitude should use a different unit, adjust this logic accordingly.
    if (field === "distance" || field === "altitude" || field === "enhancedAltitude") {
        const distanceUnits = localStorage.getItem("chartjs_distanceUnits") || "kilometers";
        return convertDistanceUnits(value, distanceUnits);
    }

    // Temperature fields (assuming input is in Celsius)
    if (field === "temperature") {
        const temperatureUnits = localStorage.getItem("chartjs_temperatureUnits") || "celsius";
        return convertTemperatureUnits(value, temperatureUnits);
    }

    // No conversion needed for other fields
    return value;
}
