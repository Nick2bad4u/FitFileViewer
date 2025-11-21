import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { convertDistanceUnits } from "../converters/convertDistanceUnits.js";
import { convertTemperatureUnits } from "../converters/convertTemperatureUnits.js";
import { convertValueToUserUnits } from "../converters/convertValueToUserUnits.js";

/**
 * Formats tooltip with units based on user preferences
 * @param {number} value - Raw value
 * @param {string} field - Field name
 * @returns {string} Formatted tooltip text
 */
export function formatTooltipWithUnits(value, field) {
    // Distance fields - show both metric and imperial
    if (field === "distance" || field === "altitude" || field === "enhancedAltitude") {
        const distanceUnits = localStorage.getItem("chartjs_distanceUnits") || "kilometers";
        const km = convertDistanceUnits(value, "kilometers");
        const miles = convertDistanceUnits(value, "miles");

        if (distanceUnits === "miles" || distanceUnits === "feet") {
            return `${miles.toFixed(2)} mi (${km.toFixed(2)} km)`;
        }
        return `${km.toFixed(2)} km (${miles.toFixed(2)} mi)`;
    }

    // Temperature fields - show both scales
    if (field === "temperature") {
        const temperatureUnits = localStorage.getItem("chartjs_temperatureUnits") || "celsius";
        const celsius = value; // Assuming input is Celsius
        const fahrenheit = convertTemperatureUnits(celsius, "fahrenheit");

        if (temperatureUnits === "fahrenheit") {
            return `${fahrenheit.toFixed(1)}°F (${celsius.toFixed(1)}°C)`;
        }
        return `${celsius.toFixed(1)}°C (${fahrenheit.toFixed(1)}°F)`;
    }

    // Default formatting for other fields (including speed)
    const convertedValue = convertValueToUserUnits(value, field);
    const unitSymbol = getUnitSymbol(field);
    return `${convertedValue.toFixed(2)}${unitSymbol ? ` ${unitSymbol}` : ""}`;
}
