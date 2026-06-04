import { getUnitSymbol } from "../../data/lookups/getUnitSymbol.js";
import { getChartSetting } from "../../state/domain/settingsStateManager.js";
import {
    convertDistanceUnits,
    DISTANCE_UNITS,
    type DistanceUnit,
} from "../converters/convertDistanceUnits.js";
import {
    convertTemperatureUnits,
    TEMPERATURE_UNITS,
    type TemperatureUnit,
} from "../converters/convertTemperatureUnits.js";
import { convertValueToUserUnits } from "../converters/convertValueToUserUnits.js";

const DISTANCE_FIELDS = new Set([
    "altitude",
    "distance",
    "enhancedAltitude",
]);

/**
 * Formats a tooltip value with units based on user preferences.
 */
export function formatTooltipWithUnits(value: number, field: string): string {
    if (DISTANCE_FIELDS.has(field)) {
        const distanceUnits = resolveDistanceUnits(
            getChartSetting("distanceUnits")
        );
        const km = convertDistanceUnits(value, DISTANCE_UNITS.KILOMETERS);
        const miles = convertDistanceUnits(value, DISTANCE_UNITS.MILES);

        if (
            distanceUnits === DISTANCE_UNITS.MILES ||
            distanceUnits === DISTANCE_UNITS.FEET
        ) {
            return `${miles.toFixed(2)} mi (${km.toFixed(2)} km)`;
        }
        return `${km.toFixed(2)} km (${miles.toFixed(2)} mi)`;
    }

    if (field === "temperature") {
        const temperatureUnits = resolveTemperatureUnits(
            getChartSetting("temperatureUnits")
        );
        const celsius = value;
        const fahrenheit = convertTemperatureUnits(
            celsius,
            TEMPERATURE_UNITS.FAHRENHEIT
        );

        if (temperatureUnits === TEMPERATURE_UNITS.FAHRENHEIT) {
            return `${fahrenheit.toFixed(1)}°F (${celsius.toFixed(1)}°C)`;
        }
        return `${celsius.toFixed(1)}°C (${fahrenheit.toFixed(1)}°F)`;
    }

    const convertedValue = convertValueToUserUnits(value, field);
    const unitSymbol = getUnitSymbol(field);
    return `${convertedValue.toFixed(2)}${unitSymbol ? ` ${unitSymbol}` : ""}`;
}

function resolveDistanceUnits(value: unknown): DistanceUnit {
    return Object.values(DISTANCE_UNITS).includes(value as DistanceUnit)
        ? (value as DistanceUnit)
        : DISTANCE_UNITS.KILOMETERS;
}

function resolveTemperatureUnits(value: unknown): TemperatureUnit {
    return Object.values(TEMPERATURE_UNITS).includes(value as TemperatureUnit)
        ? (value as TemperatureUnit)
        : TEMPERATURE_UNITS.CELSIUS;
}
