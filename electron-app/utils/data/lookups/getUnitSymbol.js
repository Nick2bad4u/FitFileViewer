/**
 * @fileoverview Unit symbol utility for FitFileViewer
 *
 * Provides functions for getting appropriate unit symbols for display based on
 * field types and user preferences stored in localStorage. Supports distance,
 * temperature, speed, time, and various fitness metrics.
 *
 * @author FitFileViewer Team
 * @since 1.0.0
 */

// LocalStorage keys for user unit preferences
// NOTE: Uses "chartjs_" prefix for historical reasons - consider refactoring if decoupling from Chart.js
const STORAGE_KEYS = {
    TIME_UNITS: "chartjs_timeUnits",
    DISTANCE_UNITS: "chartjs_distanceUnits",
    TEMPERATURE_UNITS: "chartjs_temperatureUnits",
};

// Default unit preferences
const DEFAULT_UNITS = {
    TIME: "seconds",
    DISTANCE: "kilometers",
    TEMPERATURE: "celsius",
};

// Unit symbol mappings
const UNIT_SYMBOLS = {
    DISTANCE: {
        kilometers: "km",
        meters: "m",
        feet: "ft",
        miles: "mi",
    },
    TEMPERATURE: {
        celsius: "°C",
        fahrenheit: "°F",
    },
    TIME: {
        seconds: "s",
        minutes: "min",
        hours: "h",
    },
    SPEED: {
        default: "m/s", // Always show m/s for speed fields
    },
};

// Field type categories
const FIELD_TYPES = {
    DISTANCE: ["distance", "altitude", "enhancedAltitude"],
    TEMPERATURE: ["temperature"],
    SPEED: ["speed", "enhancedSpeed"],
};

// Fallback symbols for fitness metrics and other fields
const ORIGINAL_FIELD_LABELS = {
    heartRate: "bpm",
    power: "W",
    cadence: "rpm",
    resistance: "",
    flow: "#",
    grit: "#",
    positionLat: "°",
    positionLong: "°",
};

/**
 * Gets user preference from localStorage with fallback
 * @param {string} key - Storage key
 * @param {string} fallback - Default value if not found
 * @returns {string} User preference or fallback
 */
function getUserPreference(key, fallback) {
    try {
        return localStorage.getItem(key) || fallback;
    } catch (error) {
        console.warn(`[UnitSymbol] Error reading localStorage key "${key}":`, error);
        return fallback;
    }
}

/**
 * Determines if field is a distance-related field
 * @param {string} field - Field name to check
 * @returns {boolean} True if field is distance-related
 */
function isDistanceField(field) {
    return FIELD_TYPES.DISTANCE.includes(field);
}

/**
 * Determines if field is a temperature field
 * @param {string} field - Field name to check
 * @returns {boolean} True if field is temperature-related
 */
function isTemperatureField(field) {
    return FIELD_TYPES.TEMPERATURE.includes(field);
}

/**
 * Determines if field is a speed field
 * @param {string} field - Field name to check
 * @returns {boolean} True if field is speed-related
 */
function isSpeedField(field) {
    return FIELD_TYPES.SPEED.includes(field);
}

/**
 * Gets distance unit symbol based on user preference
 * @returns {string} Distance unit symbol
 */
function getDistanceUnitSymbol() {
    const distanceUnits = getUserPreference(STORAGE_KEYS.DISTANCE_UNITS, DEFAULT_UNITS.DISTANCE);
    return UNIT_SYMBOLS.DISTANCE[distanceUnits] || UNIT_SYMBOLS.DISTANCE.meters;
}

/**
 * Gets temperature unit symbol based on user preference
 * @returns {string} Temperature unit symbol
 */
function getTemperatureUnitSymbol() {
    const temperatureUnits = getUserPreference(STORAGE_KEYS.TEMPERATURE_UNITS, DEFAULT_UNITS.TEMPERATURE);
    return UNIT_SYMBOLS.TEMPERATURE[temperatureUnits] || UNIT_SYMBOLS.TEMPERATURE.celsius;
}

/**
 * Gets time unit symbol based on user preference
 * @returns {string} Time unit symbol
 */
function getTimeUnitSymbol() {
    const timeUnits = getUserPreference(STORAGE_KEYS.TIME_UNITS, DEFAULT_UNITS.TIME);
    return UNIT_SYMBOLS.TIME[timeUnits] || UNIT_SYMBOLS.TIME.seconds;
}

/**
 * Gets the appropriate unit symbol for display based on field type and user preferences
 *
 * Determines the correct unit symbol to display for various data fields based on:
 * - Field type (distance, temperature, speed, time, fitness metrics)
 * - User unit preferences stored in localStorage
 * - Unit context (e.g., time axis vs. time field)
 *
 * @param {string} field - Field name (e.g., "distance", "temperature", "speed", "heartRate")
 * @param {string} [unitType] - Axis unit context (currently only supports "time" for time axis units)
 * @returns {string} Appropriate unit symbol for the field
 *
 * @example
 * getUnitSymbol("distance");           // "km" (if user prefers kilometers)
 * getUnitSymbol("temperature");        // "°C" (if user prefers celsius)
 * getUnitSymbol("speed");              // "m/s" (always m/s for speed)
 * getUnitSymbol("time", "time");       // "s" (if user prefers seconds)
 * getUnitSymbol("heartRate");          // "bpm" (fixed for heart rate)
 */
export function getUnitSymbol(field, unitType) {
    try {
        // Validate input
        if (!field || typeof field !== "string") {
            console.warn(`[UnitSymbol] Invalid field parameter:`, field);
            return "";
        }

        // Handle time axis units (special case)
        if (unitType === "time") {
            return getTimeUnitSymbol();
        }

        // Handle distance-related fields
        if (isDistanceField(field)) {
            return getDistanceUnitSymbol();
        }

        // Handle temperature fields
        if (isTemperatureField(field)) {
            return getTemperatureUnitSymbol();
        }

        // Handle speed fields (always m/s for consistency in tooltips)
        if (isSpeedField(field)) {
            return UNIT_SYMBOLS.SPEED.default;
        }

        // Fallback to predefined field labels for fitness metrics
        return ORIGINAL_FIELD_LABELS[field] || "";
    } catch (error) {
        console.error(`[UnitSymbol] Error getting unit symbol for field "${field}":`, error);
        return "";
    }
}
