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
} as const;

const FIELD_TYPES = {
    DISTANCE: [
        "distance",
        "altitude",
        "enhancedAltitude",
    ],
    SPEED: ["speed", "enhancedSpeed"],
    TEMPERATURE: ["temperature"],
} as const satisfies Readonly<Record<string, readonly string[]>>;

const DISTANCE_FIELDS = new Set<string>(FIELD_TYPES.DISTANCE);
const SPEED_FIELDS = new Set<string>(FIELD_TYPES.SPEED);
const TEMPERATURE_FIELDS = new Set<string>(FIELD_TYPES.TEMPERATURE);

const ORIGINAL_FIELD_LABELS: Readonly<Record<string, string>> = {
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
} as const;

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
} as const;

type DistanceUnit = keyof typeof UNIT_SYMBOLS.DISTANCE;
type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];
type TemperatureUnit = keyof typeof UNIT_SYMBOLS.TEMPERATURE;
type TimeUnit = keyof typeof UNIT_SYMBOLS.TIME;
type UnitPreference = DistanceUnit | TemperatureUnit | TimeUnit;

/**
 * Gets the appropriate unit symbol for display based on field type and user
 * preferences.
 */
export function getUnitSymbol(field: string, unitType?: string): string {
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
            const distanceUnits = getUserPreference<DistanceUnit>(
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

function getDistanceUnitSymbol(): string {
    const distanceUnits = getUserPreference<DistanceUnit>(
        SETTING_KEYS.DISTANCE_UNITS,
        DEFAULT_UNITS.DISTANCE
    );
    return UNIT_SYMBOLS.DISTANCE[distanceUnits] ?? UNIT_SYMBOLS.DISTANCE.meters;
}

function getTemperatureUnitSymbol(): string {
    const temperatureUnits = getUserPreference<TemperatureUnit>(
        SETTING_KEYS.TEMPERATURE_UNITS,
        DEFAULT_UNITS.TEMPERATURE
    );
    return (
        UNIT_SYMBOLS.TEMPERATURE[temperatureUnits] ??
        UNIT_SYMBOLS.TEMPERATURE.celsius
    );
}

function getTimeUnitSymbol(): string {
    const timeUnits = getUserPreference<TimeUnit>(
        SETTING_KEYS.TIME_UNITS,
        DEFAULT_UNITS.TIME
    );
    return UNIT_SYMBOLS.TIME[timeUnits] ?? UNIT_SYMBOLS.TIME.seconds;
}

function getUserPreference<T extends UnitPreference>(
    key: SettingKey,
    fallback: T
): T {
    try {
        const value: unknown = getChartSetting(key);
        return typeof value === "string" && value ? (value as T) : fallback;
    } catch (error) {
        console.warn(`[UnitSymbol] Error reading setting "${key}":`, error);
        return fallback;
    }
}

function isDistanceField(field: string): boolean {
    return DISTANCE_FIELDS.has(field);
}

function isSpeedField(field: string): boolean {
    return SPEED_FIELDS.has(field);
}

function isTemperatureField(field: string): boolean {
    return TEMPERATURE_FIELDS.has(field);
}
