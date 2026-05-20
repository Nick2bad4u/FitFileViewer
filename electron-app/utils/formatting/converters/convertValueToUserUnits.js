import { getChartSetting } from "../../state/domain/settingsStateManager.js";
import { convertDistanceUnits, DISTANCE_UNITS, } from "./convertDistanceUnits.js";
import { convertMpsToKmh } from "./convertMpsToKmh.js";
import { convertMpsToMph } from "./convertMpsToMph.js";
import { convertTemperatureUnits, TEMPERATURE_UNITS, } from "./convertTemperatureUnits.js";
const FIELD_CATEGORIES = {
    DISTANCE: [
        "distance",
        "altitude",
        "enhancedAltitude",
    ],
    SPEED: ["speed", "enhancedSpeed"],
    TEMPERATURE: ["temperature"],
};
const UNIT_SETTING_KEYS = {
    DISTANCE: "distanceUnits",
    TEMPERATURE: "temperatureUnits",
};
const DISTANCE_FIELDS = new Set(FIELD_CATEGORIES.DISTANCE);
const SPEED_FIELDS = new Set(FIELD_CATEGORIES.SPEED);
const TEMPERATURE_FIELDS = new Set(FIELD_CATEGORIES.TEMPERATURE);
/**
 * Converts numeric values according to the user's preferred units for a field.
 *
 * Invalid values preserve legacy behavior by warning and returning the original
 * input unchanged.
 */
export function convertValueToUserUnits(value, field) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        console.warn(`[convertValueToUserUnits] Invalid value for field '${String(field)}':`, value);
        return value;
    }
    if (typeof field !== "string" || !field.trim()) {
        console.warn("[convertValueToUserUnits] Invalid field name:", field);
        return value;
    }
    try {
        if (DISTANCE_FIELDS.has(field)) {
            const distanceUnits = resolveDistanceUnits(getChartSetting(UNIT_SETTING_KEYS.DISTANCE));
            return convertDistanceUnits(value, distanceUnits);
        }
        if (TEMPERATURE_FIELDS.has(field)) {
            const temperatureUnits = resolveTemperatureUnits(getChartSetting(UNIT_SETTING_KEYS.TEMPERATURE));
            return convertTemperatureUnits(value, temperatureUnits);
        }
        if (SPEED_FIELDS.has(field)) {
            const distanceUnits = resolveDistanceUnits(getChartSetting(UNIT_SETTING_KEYS.DISTANCE));
            if (distanceUnits === DISTANCE_UNITS.MILES ||
                distanceUnits === DISTANCE_UNITS.FEET) {
                return convertMpsToMph(value);
            }
            return convertMpsToKmh(value);
        }
        return value;
    }
    catch (error) {
        console.error(`[convertValueToUserUnits] Conversion failed for field '${field}':`, error);
        return value;
    }
}
function resolveDistanceUnits(value) {
    return Object.values(DISTANCE_UNITS).includes(value)
        ? value
        : DISTANCE_UNITS.KILOMETERS;
}
function resolveTemperatureUnits(value) {
    return Object.values(TEMPERATURE_UNITS).includes(value)
        ? value
        : TEMPERATURE_UNITS.CELSIUS;
}
