/**
 * Unit symbol utility for FitFileViewer.
 *
 * Provides display symbols for FIT fields using the active chart settings when
 * relevant, with fixed labels for common fitness metrics.
 */
import { getChartSetting } from "../../state/domain/settingsStateManager.js";
const DEFAULT_UNITS = {
    DISTANCE: "kilometers",
    TEMPERATURE: "celsius",
    TIME: "seconds",
};
const FIELD_TYPES = {
    DISTANCE: [
        "distance",
        "altitude",
        "enhancedAltitude",
    ],
    SPEED: ["speed", "enhancedSpeed"],
    TEMPERATURE: ["temperature"],
};
const DISTANCE_FIELDS = new Set(FIELD_TYPES.DISTANCE);
const SPEED_FIELDS = new Set(FIELD_TYPES.SPEED);
const TEMPERATURE_FIELDS = new Set(FIELD_TYPES.TEMPERATURE);
const ORIGINAL_FIELD_LABELS = {
    auxHeartRate: "bpm",
    cadence: "rpm",
    flow: "#",
    grit: "#",
    heartRate: "bpm",
    positionLat: "°",
    positionLong: "°",
    power: "W",
    resistance: "",
};
const SETTING_KEYS = {
    DISTANCE_UNITS: "distanceUnits",
    TEMPERATURE_UNITS: "temperatureUnits",
    TIME_UNITS: "timeUnits",
};
const UNIT_SYMBOLS = {
    DISTANCE: {
        feet: "ft",
        kilometers: "km",
        meters: "m",
        miles: "mi",
    },
    SPEED: {
        default: "m/s",
        kmh: "km/h",
        mph: "mph",
    },
    TEMPERATURE: {
        celsius: "°C",
        fahrenheit: "°F",
    },
    TIME: {
        hours: "h",
        minutes: "min",
        seconds: "s",
    },
};
/**
 * Gets the appropriate unit symbol for display based on field type and user
 * preferences.
 */
export function getUnitSymbol(field, unitType) {
    try {
        if (!field || typeof field !== "string") {
            console.warn("[UnitSymbol] Invalid field parameter:", field);
            return "";
        }
        if (unitType === "time") {
            return getTimeUnitSymbol();
        }
        if (isDistanceField(field)) {
            return getDistanceUnitSymbol();
        }
        if (isTemperatureField(field)) {
            return getTemperatureUnitSymbol();
        }
        if (isSpeedField(field)) {
            const distanceUnits = getUserPreference(
                SETTING_KEYS.DISTANCE_UNITS,
                DEFAULT_UNITS.DISTANCE
            );
            return distanceUnits === "miles" || distanceUnits === "feet"
                ? UNIT_SYMBOLS.SPEED.mph
                : UNIT_SYMBOLS.SPEED.kmh;
        }
        return ORIGINAL_FIELD_LABELS[field] ?? "";
    } catch (error) {
        console.error(
            `[UnitSymbol] Error getting unit symbol for field "${field}":`,
            error
        );
        return "";
    }
}
function getDistanceUnitSymbol() {
    const distanceUnits = getUserPreference(
        SETTING_KEYS.DISTANCE_UNITS,
        DEFAULT_UNITS.DISTANCE
    );
    return UNIT_SYMBOLS.DISTANCE[distanceUnits] ?? UNIT_SYMBOLS.DISTANCE.meters;
}
function getTemperatureUnitSymbol() {
    const temperatureUnits = getUserPreference(
        SETTING_KEYS.TEMPERATURE_UNITS,
        DEFAULT_UNITS.TEMPERATURE
    );
    return (
        UNIT_SYMBOLS.TEMPERATURE[temperatureUnits] ??
        UNIT_SYMBOLS.TEMPERATURE.celsius
    );
}
function getTimeUnitSymbol() {
    const timeUnits = getUserPreference(
        SETTING_KEYS.TIME_UNITS,
        DEFAULT_UNITS.TIME
    );
    return UNIT_SYMBOLS.TIME[timeUnits] ?? UNIT_SYMBOLS.TIME.seconds;
}
function getUserPreference(key, fallback) {
    try {
        const value = getChartSetting(key);
        return typeof value === "string" && value ? value : fallback;
    } catch (error) {
        console.warn(`[UnitSymbol] Error reading setting "${key}":`, error);
        return fallback;
    }
}
function isDistanceField(field) {
    return DISTANCE_FIELDS.has(field);
}
function isSpeedField(field) {
    return SPEED_FIELDS.has(field);
}
function isTemperatureField(field) {
    return TEMPERATURE_FIELDS.has(field);
}
