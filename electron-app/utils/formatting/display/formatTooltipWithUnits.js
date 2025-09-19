import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { convertDistanceUnits } from "../converters/convertDistanceUnits.js";
import { convertTemperatureUnits } from "../converters/convertTemperatureUnits.js";
import { convertValueToUserUnits } from "../converters/convertValueToUserUnits.js";
import { formatSpeedTooltip } from "./formatSpeedTooltip.js";

/**
 * Formats tooltip with units based on user preferences
 * @param {number} value - Raw value
 * @param {string} field - Field name
 * @returns {string} Formatted tooltip text
 */
export function formatTooltipWithUnits(value, field) {
    // Distance fields - show both metric and imperial
    if (field === "distance" || field === "altitude" || field === "enhancedAltitude") {
        const km = convertDistanceUnits(value, "kilometers"),
            miles = convertDistanceUnits(value, "miles");
        return `${km.toFixed(2)} km (${miles.toFixed(2)} mi)`;
    }

    // Speed fields - show all three units
    if (field === "speed" || field === "enhancedSpeed") {
        return formatSpeedTooltip(value);
    }

    // Temperature fields - show both scales
    if (field === "temperature") {
        const celsius = value, // Assuming input is Celsius
            fahrenheit = convertTemperatureUnits(celsius, "fahrenheit");
        return `${celsius.toFixed(1)}°C (${fahrenheit.toFixed(1)}°F)`;
    }

    // Default formatting for other fields
    const convertedValue = convertValueToUserUnits(value, field),
        unitSymbol = getUnitSymbol(field);
    return `${convertedValue.toFixed(2)}${unitSymbol ? ` ${unitSymbol}` : ""}`;
}
