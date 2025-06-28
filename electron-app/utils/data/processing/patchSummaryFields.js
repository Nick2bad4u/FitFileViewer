/**
 * Summary fields patching utility for FitFileViewer
 * Provides consistent formatting and validation for summary data fields
 */

import { formatDistance } from "../../formatting/formatters/formatDistance.js";
import { formatDuration } from "../../formatting/formatters/formatDuration.js";

// Constants for better maintainability
const PATCH_CONSTANTS = {
    DECIMAL_PLACES: {
        DEFAULT: 2,
        TEMPERATURE: 1,
        CADENCE: 0,
        HEART_RATE: 0,
        POWER: 0,
        CALORIES: 0,
        HIGH_PRECISION: 3,
    },
    FIELD_MAPPINGS: {
        DISTANCE: ["total_distance", "totalDistance"],
        TIME: ["total_timer_time", "totalTimerTime", "total_elapsed_time", "totalElapsedTime"],
        SPEED: [
            "avg_speed",
            "avgSpeed",
            "max_speed",
            "maxSpeed",
            "enhanced_avg_speed",
            "enhancedAvgSpeed",
            "enhanced_max_speed",
            "enhancedMaxSpeed",
        ],
        POWER: [
            "avg_power",
            "avgPower",
            "max_power",
            "maxPower",
            "normalized_power",
            "normalizedPower",
            "total_work",
            "totalWork",
        ],
        HEART_RATE: ["avg_heart_rate", "avgHeartRate", "max_heart_rate", "maxHeartRate"],
        CADENCE: [
            "avg_cadence",
            "avgCadence",
            "max_cadence",
            "maxCadence",
            "avg_fractional_cadence",
            "avgFractionalCadence",
        ],
        TEMPERATURE: ["avg_temperature", "avgTemperature", "max_temperature", "maxTemperature"],
    },
    LOG_PREFIX: "[SummaryPatcher]",
};

/**
 * Logs messages with context for patching operations
 * @param {string} message - The message to log
 * @param {string} level - Log level ('info', 'warn', 'error')
 * @private
 */
function logWithContext(message, level = "info") {
    try {
        const prefix = PATCH_CONSTANTS.LOG_PREFIX;
        switch (level) {
            case "warn":
                console.warn(`${prefix} ${message}`);
                break;
            case "error":
                console.error(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    } catch {
        // Silently fail if logging encounters an error
    }
}

/**
 * Safely converts a value to a number with validation
 * @param {any} value - Value to convert
 * @param {string} fieldName - Name of the field for error reporting
 * @returns {number|null} Converted number or null if invalid
 * @private
 */
function safeToNumber(value, fieldName = "value") {
    if (value == null) return null;

    const num = Number(value);
    if (!Number.isFinite(num)) {
        logWithContext(`Invalid ${fieldName}: ${value}`, "warn");
        return null;
    }

    return num;
}

/**
 * Patches field with a custom formatter function
 * @param {Object} obj - Object containing fields to patch
 * @param {string[]} fieldNames - Array of field names to check
 * @param {Function} formatter - Formatting function
 * @param {string} description - Description for logging
 * @private
 */
function patchFieldsWithFormatter(obj, fieldNames, formatter, description) {
    for (const fieldName of fieldNames) {
        if (obj[fieldName] != null) {
            const value = safeToNumber(obj[fieldName], fieldName);
            if (value !== null) {
                try {
                    obj[fieldName] = formatter(value);
                } catch (error) {
                    logWithContext(`Error formatting ${description} field '${fieldName}': ${error.message}`, "error");
                }
            }
        }
    }
}

/**
 * Patches decimal fields with specified precision
 * @param {Object} obj - Object containing fields to patch
 * @param {string[]} fieldNames - Array of field names to check
 * @param {number} decimalPlaces - Number of decimal places
 * @private
 */
function patchDecimalFields(obj, fieldNames, decimalPlaces) {
    patchFieldsWithFormatter(
        obj,
        fieldNames,
        (value) => Number(value.toFixed(decimalPlaces)),
        `decimal (${decimalPlaces} places)`
    );
}

/**
 * Updates the fields of a summary object to ensure they are in a human-readable format.
 * Handles various metrics such as distance, time, speed, power, heart rate, and more.
 *
 * @param {Object} obj - The summary object containing various metrics to be patched
 * @param {Object} [options={}] - Configuration options for patching
 * @param {boolean} [options.preserveOriginal=false] - Whether to preserve original values
 * @param {boolean} [options.skipValidation=false] - Whether to skip input validation
 * @returns {Object} The patched object (same reference as input)
 *
 * @example
 * // Patch summary fields with default options
 * const summary = { total_distance: 5000, avg_speed: 2.5 };
 * patchSummaryFields(summary);
 * // summary.total_distance is now formatted as "5.00 km"
 *
 * @public
 */
export function patchSummaryFields(obj, options = {}) {
    const config = {
        preserveOriginal: false,
        skipValidation: false,
        ...options,
    };

    try {
        if (!config.skipValidation && (!obj || typeof obj !== "object")) {
            throw new Error("Invalid input: expected object");
        }

        // Create a backup if preserveOriginal is enabled
        const backup = config.preserveOriginal ? { ...obj } : null;

        try {
            patchDistance(obj);
            patchTime(obj);
            patchSpeed(obj);
            patchPower(obj);
            patchCalories(obj);
            patchHeartRate(obj);
            patchCadence(obj);
            patchRespirationRate(obj);
            patchTemperature(obj);
            patchGritFlow(obj);
            patchTrainingLoad(obj);
            patchStrokes(obj);
            patchFractionalCadence(obj);
            patchTorquePedal(obj);
            patchPCO(obj);
            patchArrays(obj);
            patchTimestamps(obj);
            patchDecimals(obj);

            return obj;
        } catch (error) {
            if (backup) {
                // Restore from backup if there was an error
                Object.assign(obj, backup);
            }
            throw error;
        }
    } catch (error) {
        logWithContext(`Error patching summary fields: ${error.message}`, "error");
        throw error;
    }
}

// --- Helper functions ---

/**
 * Formats the distance fields of the given object using the formatDistance function
 * @param {Object} obj - The object containing distance fields to patch
 * @private
 */
function patchDistance(obj) {
    patchFieldsWithFormatter(obj, PATCH_CONSTANTS.FIELD_MAPPINGS.DISTANCE, formatDistance, "distance");
}

/**
 * Formats the time fields of the given object using the formatDuration function
 * @param {Object} obj - The object containing time fields to patch
 * @private
 */
function patchTime(obj) {
    patchFieldsWithFormatter(obj, PATCH_CONSTANTS.FIELD_MAPPINGS.TIME, formatDuration, "time");
}

/**
 * Converts a speed value from meters per second to a formatted string
 * @param {number} val - The speed value in meters per second
 * @returns {string} The formatted speed string
 * @private
 */
function formatSpeed(val) {
    const mps = Number(val);
    const kmh = (mps * 3.6).toFixed(PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
    const mph = (mps * 2.23694).toFixed(PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
    return `${kmh} km/h / ${mph} mph`;
}

/**
 * Formats speed fields in the given object
 * @param {Object} obj - The object containing speed fields to patch
 * @private
 */
function patchSpeed(obj) {
    patchFieldsWithFormatter(obj, PATCH_CONSTANTS.FIELD_MAPPINGS.SPEED, formatSpeed, "speed");
}

/**
 * Modernized power fields formatting
 * @param {Object} obj - The object containing power fields to patch
 * @private
 */
function patchPowerModern(obj) {
    patchDecimalFields(obj, PATCH_CONSTANTS.FIELD_MAPPINGS.POWER, PATCH_CONSTANTS.DECIMAL_PLACES.POWER);
}

/**
 * Modernized heart rate fields formatting
 * @param {Object} obj - The object containing heart rate fields to patch
 * @private
 */
function patchHeartRateModern(obj) {
    patchDecimalFields(obj, PATCH_CONSTANTS.FIELD_MAPPINGS.HEART_RATE, PATCH_CONSTANTS.DECIMAL_PLACES.HEART_RATE);
}

/**
 * Modernized cadence fields formatting
 * @param {Object} obj - The object containing cadence fields to patch
 * @private
 */
function patchCadenceModern(obj) {
    patchDecimalFields(obj, PATCH_CONSTANTS.FIELD_MAPPINGS.CADENCE, PATCH_CONSTANTS.DECIMAL_PLACES.CADENCE);
}

/**
 * Modernized temperature fields formatting
 * @param {Object} obj - The object containing temperature fields to patch
 * @private
 */
function patchTemperatureModern(obj) {
    patchDecimalFields(obj, PATCH_CONSTANTS.FIELD_MAPPINGS.TEMPERATURE, PATCH_CONSTANTS.DECIMAL_PLACES.TEMPERATURE);
}

// Replace old implementations with modern ones
const patchPower = patchPowerModern;
const patchHeartRate = patchHeartRateModern;
const patchCadence = patchCadenceModern;
const patchTemperature = patchTemperatureModern;

// Stub implementations for missing functions that aren't in FIELD_MAPPINGS
function patchCalories(obj) {
    const calorieFields = ["total_calories", "totalCalories"];
    patchDecimalFields(obj, calorieFields, PATCH_CONSTANTS.DECIMAL_PLACES.CALORIES);
}

function patchRespirationRate(obj) {
    const respirationFields = [
        "enhanced_avg_respiration_rate",
        "enhancedAvgRespirationRate",
        "enhanced_max_respiration_rate",
        "enhancedMaxRespirationRate",
        "enhanced_min_respiration_rate",
        "enhancedMinRespirationRate",
    ];
    patchDecimalFields(obj, respirationFields, PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
}

function patchGritFlow(obj) {
    const gritFlowFields = ["avg_flow", "avgFlow", "avg_grit", "avgGrit"];
    patchDecimalFields(obj, gritFlowFields, PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
}

function patchTrainingLoad(obj) {
    const trainingLoadFields = ["training_stress_score", "trainingStressScore"];
    patchDecimalFields(obj, trainingLoadFields, PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
}

function patchStrokes(obj) {
    const strokeFields = ["total_strokes", "totalStrokes", "avg_stroke_distance", "avgStrokeDistance"];
    patchDecimalFields(obj, strokeFields, PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
}

function patchFractionalCadence(obj) {
    const fractionalCadenceFields = ["avg_fractional_cadence", "avgFractionalCadence"];
    patchDecimalFields(obj, fractionalCadenceFields, PATCH_CONSTANTS.DECIMAL_PLACES.HIGH_PRECISION);
}

function patchTorquePedal(obj) {
    const torqueFields = [
        "avg_left_torque_effectiveness",
        "avgLeftTorqueEffectiveness",
        "avg_right_torque_effectiveness",
        "avgRightTorqueEffectiveness",
    ];
    patchDecimalFields(obj, torqueFields, PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
}

function patchPCO(obj) {
    const pcoFields = ["avg_left_pco", "avgLeftPco", "avg_right_pco", "avgRightPco"];
    patchDecimalFields(obj, pcoFields, PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
}

function patchArrays(obj) {
    const arrayFields = [
        "avg_left_power_phase",
        "avgLeftPowerPhase",
        "avg_left_power_phase_peak",
        "avgLeftPowerPhasePeak",
        "avg_right_power_phase",
        "avgRightPowerPhase",
        "avg_right_power_phase_peak",
        "avgRightPowerPhasePeak",
    ];

    arrayFields.forEach((field) => {
        if (obj[field] != null) {
            try {
                obj[field] = formatArray(obj[field], PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
            } catch (error) {
                logWithContext(`Error formatting array field '${field}': ${error.message}`, "error");
            }
        }
    });
}

function patchTimestamps(obj) {
    const timestampFields = ["timestamp", "start_time", "startTime"];

    timestampFields.forEach((field) => {
        if (obj[field] != null && typeof obj[field] === "number") {
            try {
                obj[field] = new Date(obj[field] * 1000).toString();
            } catch (error) {
                logWithContext(`Error formatting timestamp field '${field}': ${error.message}`, "error");
            }
        }
    });
}

function patchDecimals(obj) {
    try {
        Object.keys(obj)
            .filter((key) => typeof obj[key] === "number" && !Number.isInteger(obj[key]))
            .forEach((key) => {
                obj[key] = Number(obj[key]).toFixed(PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT);
            });
    } catch (error) {
        logWithContext(`Error formatting decimal fields: ${error.message}`, "error");
    }
}

/**
 * Helper function for formatting arrays used by patchArrays
 * @param {Array|string} val - Array or comma-separated string to format
 * @param {number} digits - Number of decimal places
 * @returns {string} Formatted string
 * @private
 */
function formatArray(val, digits = PATCH_CONSTANTS.DECIMAL_PLACES.DEFAULT) {
    if (Array.isArray(val)) {
        return val.map((v) => Number(v).toFixed(digits)).join(", ");
    }
    if (typeof val === "string" && val.includes(",")) {
        return val
            .split(",")
            .map((v) => Number(v.trim()).toFixed(digits))
            .join(", ");
    }
    return val;
}
