import { getChartSetting } from "../../state/domain/settingsStateManager.js";
import {
    convertDistanceUnits,
    DISTANCE_UNITS,
} from "./convertDistanceUnits.js";
import { convertMpsToKmh } from "./convertMpsToKmh.js";
import { convertMpsToMph } from "./convertMpsToMph.js";
import {
    convertTemperatureUnits,
    TEMPERATURE_UNITS,
} from "./convertTemperatureUnits.js";

/**
 * User unit preference storage keys
 *
 * @readonly
 */
const /**
     * Field categorization for unit conversion
     *
     * @readonly
     */
    FIELD_CATEGORIES = {
        DISTANCE: [
            "distance",
            "altitude",
            "enhancedAltitude",
        ],
        TEMPERATURE: ["temperature"],
        SPEED: ["speed", "enhancedSpeed"],
    },
    UNIT_SETTING_KEYS = {
        DISTANCE: "distanceUnits",
        TEMPERATURE: "temperatureUnits",
    };

const resolveDistanceUnits = (value) =>
    Object.values(DISTANCE_UNITS).includes(value)
        ? value
        : DISTANCE_UNITS.KILOMETERS;
const resolveTemperatureUnits = (value) =>
    Object.values(TEMPERATURE_UNITS).includes(value)
        ? value
        : TEMPERATURE_UNITS.CELSIUS;

/**
 * Converts values according to user's preferred units based on field type
 *
 * @example
 *     // Convert distance from meters to user preference (e.g., kilometers)
 *     const convertedDistance = convertValueToUserUnits(1000, "distance");
 *
 *     // Convert temperature from Celsius to user preference (e.g., Fahrenheit)
 *     const convertedTemp = convertValueToUserUnits(25, "temperature");
 *
 * @param {number} value - Raw value to convert
 * @param {string} field - Field name that determines conversion type
 *
 * @returns {number} Converted value in user's preferred units
 *
 * @throws {TypeError} If value is not a number
 */
export function convertValueToUserUnits(value, field) {
    // Input validation
    if (typeof value !== "number" || isNaN(value)) {
        console.warn(
            `[convertValueToUserUnits] Invalid value for field '${field}':`,
            value
        );
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
            const distanceUnits = resolveDistanceUnits(
                getChartSetting(UNIT_SETTING_KEYS.DISTANCE)
            );
            return convertDistanceUnits(value, distanceUnits);
        }

        // Temperature fields (assuming input is in Celsius)
        if (FIELD_CATEGORIES.TEMPERATURE.includes(field)) {
            const temperatureUnits = resolveTemperatureUnits(
                getChartSetting(UNIT_SETTING_KEYS.TEMPERATURE)
            );
            return convertTemperatureUnits(value, temperatureUnits);
        }

        // Speed fields (assuming input is in m/s)
        if (FIELD_CATEGORIES.SPEED.includes(field)) {
            const distanceUnits = resolveDistanceUnits(
                getChartSetting(UNIT_SETTING_KEYS.DISTANCE)
            );
            if (distanceUnits === "miles" || distanceUnits === "feet") {
                return convertMpsToMph(value);
            }
            return convertMpsToKmh(value);
        }

        // No conversion needed for other fields
        return value;
    } catch (error) {
        console.error(
            `[convertValueToUserUnits] Conversion failed for field '${field}':`,
            error
        );
        return value; // Return original value on error
    }
}
